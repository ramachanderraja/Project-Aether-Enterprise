import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { StructuredToolInterface } from '@langchain/core/tools';
import { SalesService } from '../sales/sales.service';
import { DealService } from '../sales/services/deal.service';
import { ForecastService } from '../sales/services/forecast.service';
import { RevenueService } from '../revenue/revenue.service';
import { createSalesTools } from './tools/sales.tools';
import { createRevenueTools } from './tools/revenue.tools';
import { AGENT_CONFIGS, AgentConfig } from './config/agent-configs';
import {
  buildToolAgentGraph,
  streamToolAgentGraph,
} from './graphs/tool-agent-graph';
import type { AgUiEvent } from './streaming/agui-events';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private llm: BaseChatModel | null = null;
  private graphByAgent: Map<string, ReturnType<typeof buildToolAgentGraph>> =
    new Map();
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly salesService: SalesService,
    private readonly dealService: DealService,
    private readonly forecastService: ForecastService,
    private readonly revenueService: RevenueService,
  ) {}

  private ensureInitialized(): boolean {
    if (this.initialized) return true;

    this.llm = this.buildLlm();
    if (!this.llm) return false;

    const salesTools = createSalesTools(
      this.salesService,
      this.dealService,
      this.forecastService,
    );
    const revenueTools = createRevenueTools(this.revenueService);

    const toolsMap: Record<string, StructuredToolInterface[]> = {
      sales_pipeline: salesTools,
      arr_revenue: revenueTools,
    };

    for (const [agentKey, tools] of Object.entries(toolsMap)) {
      const config = AGENT_CONFIGS[agentKey];
      const graph = buildToolAgentGraph(this.llm, tools, config?.systemPrompt);
      this.graphByAgent.set(agentKey, graph);
    }

    this.initialized = true;
    return true;
  }

  private buildLlm(): BaseChatModel | null {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (openaiKey) {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'o4-mini';
      this.logger.log(`Initializing OpenAI LLM (model: ${model})`);
      return new ChatOpenAI({
        openAIApiKey: openaiKey,
        modelName: model,
        streaming: true,
        timeout: 60000,
      });
    }

    const azureKey = this.configService.get<string>('AZURE_OPENAI_API_KEY');
    const azureDeployment = this.configService.get<string>('AZURE_OPENAI_API_DEPLOYMENT_NAME');
    const azureVersion = this.configService.get<string>('AZURE_OPENAI_API_VERSION');
    const azureInstance = this.configService.get<string>('AZURE_OPENAI_API_INSTANCE_NAME');

    if (azureKey && azureDeployment) {
      this.logger.log(
        `Initializing Azure OpenAI LLM (deployment: ${azureDeployment}, instance: ${azureInstance || 'default'})`,
      );
      const basePath = this.configService.get<string>('AZURE_OPENAI_BASE_PATH');
      return new AzureChatOpenAI({
        azureOpenAIApiKey: azureKey,
        azureOpenAIApiDeploymentName: azureDeployment,
        azureOpenAIApiVersion: azureVersion || '2024-08-01-preview',
        azureOpenAIApiInstanceName: azureInstance,
        streaming: true,
        timeout: 60000,
        ...(basePath ? { azureOpenAIBasePath: basePath } : {}),
      });
    }

    this.logger.warn(
      'No LLM configured — set OPENAI_API_KEY or AZURE_OPENAI_API_KEY + AZURE_OPENAI_API_DEPLOYMENT_NAME in .env',
    );
    return null;
  }

  listAgents(): AgentConfig[] {
    return Object.values(AGENT_CONFIGS);
  }

  async chat(
    agentKey: string,
    message: string,
    userId: string,
    history?: Array<{ role: string; content: string }>,
  ): Promise<{ answer: string; toolCalls: any[] }> {
    if (!this.ensureInitialized()) {
      return {
        answer:
          'The AI agent is not available. Please configure OPENAI_API_KEY or Azure OpenAI credentials in the backend .env file.',
        toolCalls: [],
      };
    }

    const config = AGENT_CONFIGS[agentKey];
    if (!config) {
      return { answer: `Unknown agent: ${agentKey}`, toolCalls: [] };
    }

    const graph = this.graphByAgent.get(agentKey)!;
    const historyMessages = this.buildHistoryMessages(history);

    const result = await graph.invoke({
      messages: [...historyMessages, new HumanMessage(message)],
    });

    const msgs = result.messages || [];
    const lastAi = [...msgs].reverse().find(
      (m: BaseMessage) => m._getType() === 'ai',
    );
    const answer = lastAi
      ? typeof lastAi.content === 'string'
        ? lastAi.content
        : JSON.stringify(lastAi.content)
      : 'No response generated.';

    return { answer, toolCalls: [] };
  }

  async *chatStream(
    agentKey: string,
    message: string,
    userId: string,
    history?: Array<{ role: string; content: string }>,
  ): AsyncGenerator<AgUiEvent> {
    if (!this.ensureInitialized()) {
      yield {
        type: 'error',
        content:
          'The AI agent is not available. Please configure OPENAI_API_KEY or Azure OpenAI credentials in the backend .env file.',
      };
      yield { type: 'done', content: '' };
      return;
    }

    const config = AGENT_CONFIGS[agentKey];
    if (!config) {
      yield { type: 'error', content: `Unknown agent: ${agentKey}` };
      yield { type: 'done', content: '' };
      return;
    }

    const graph = this.graphByAgent.get(agentKey)!;
    const historyMessages = this.buildHistoryMessages(history);

    try {
      for await (const event of streamToolAgentGraph(graph, {
        userId,
        input: message,
        systemPrompt: config.systemPrompt,
        history: historyMessages,
        maxIterations: 15,
      })) {
        yield event as AgUiEvent;
      }
    } catch (error) {
      this.logger.error(`Agent stream error: ${error}`);
      yield {
        type: 'error',
        content:
          error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }

    yield { type: 'done', content: '' };
  }

  private buildHistoryMessages(
    history?: Array<{ role: string; content: string }>,
  ): BaseMessage[] {
    if (!history || history.length === 0) return [];
    return history.map((msg) => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      return new AIMessage(msg.content);
    });
  }
}
