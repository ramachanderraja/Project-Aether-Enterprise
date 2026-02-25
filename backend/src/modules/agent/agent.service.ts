import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { SalesService } from '../sales/sales.service';
import { DealService } from '../sales/services/deal.service';
import { ForecastService } from '../sales/services/forecast.service';
import { SalesComputeService } from '../sales/services/sales-compute.service';
import { RevenueService } from '../revenue/revenue.service';
import { RevenueComputeService } from '../revenue/services/revenue-compute.service';

import { AGENT_CONFIGS, AgentConfig } from './config/agent-configs';
import type { AgUiEvent } from './streaming/agui-events';

// Sales Supervisor graph
import {
  createOverviewTools,
  createForecastTools,
  createPipelineTools,
  createYoYTools,
  buildSalesSupervisor,
  streamSalesSupervisor,
} from './graphs/sales';

// ARR Supervisor graph
import {
  createOverviewTools as createArrOverviewTools,
  createMovementTools,
  createCustomersTools,
  createProductsTools,
  buildArrSupervisor,
  streamArrSupervisor,
} from './graphs/arr';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private llm: BaseChatModel | null = null;
  private salesSupervisor: ReturnType<typeof buildSalesSupervisor> | null = null;
  private arrSupervisor: ReturnType<typeof buildArrSupervisor> | null = null;
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly salesService: SalesService,
    private readonly dealService: DealService,
    private readonly forecastService: ForecastService,
    private readonly salesComputeService: SalesComputeService,
    private readonly revenueService: RevenueService,
    private readonly revenueComputeService: RevenueComputeService,
  ) {}

  private ensureInitialized(): boolean {
    if (this.initialized) return true;

    this.llm = this.buildLlm();
    if (!this.llm) return false;

    // ── Build Sales Supervisor (4 sub-agents) ──
    const overviewTools = createOverviewTools(this.salesComputeService, this.dealService);
    const forecastTools = createForecastTools(this.salesComputeService, this.dealService, this.forecastService);
    const pipelineTools = createPipelineTools(this.salesComputeService);
    const yoyTools = createYoYTools(this.salesComputeService);

    this.salesSupervisor = buildSalesSupervisor(this.llm, {
      overviewTools,
      forecastTools,
      pipelineTools,
      yoyTools,
    });

    this.logger.log(
      `Sales Supervisor built: Overview(${overviewTools.length}), Forecast(${forecastTools.length}), Pipeline(${pipelineTools.length}), YoY(${yoyTools.length}) tools`,
    );

    // ── Build ARR Supervisor (4 sub-agents) ──
    const arrOverviewTools = createArrOverviewTools(this.revenueComputeService);
    const arrMovementTools = createMovementTools(this.revenueComputeService);
    const arrCustomersTools = createCustomersTools(this.revenueComputeService);
    const arrProductsTools = createProductsTools(this.revenueComputeService);

    this.arrSupervisor = buildArrSupervisor(this.llm, {
      overviewTools: arrOverviewTools,
      movementTools: arrMovementTools,
      customersTools: arrCustomersTools,
      productsTools: arrProductsTools,
    });

    this.logger.log(
      `ARR Supervisor built: Overview(${arrOverviewTools.length}), Movement(${arrMovementTools.length}), Customers(${arrCustomersTools.length}), Products(${arrProductsTools.length}) tools`,
    );

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

    // Collect answer from streaming
    let answer = '';
    const toolCalls: any[] = [];

    for await (const event of this.chatStream(agentKey, message, userId, history)) {
      if (event.type === 'answer') answer += event.content;
      if (event.type === 'action') toolCalls.push({ name: event.toolName, input: event.metadata });
    }

    return { answer: answer || 'No response generated.', toolCalls };
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

    const historyMessages = this.buildHistoryMessages(history);

    try {
      if (agentKey === 'sales_pipeline' && this.salesSupervisor) {
        // ── Sales: Supervisor with routing ──
        for await (const event of streamSalesSupervisor(
          this.llm!,
          this.salesSupervisor,
          {
            userId,
            input: message,
            history: historyMessages,
            maxIterations: 15,
          },
        )) {
          yield event as AgUiEvent;
        }
      } else if (agentKey === 'arr_revenue' && this.arrSupervisor) {
        // ── ARR: Supervisor with routing ──
        for await (const event of streamArrSupervisor(
          this.llm!,
          this.arrSupervisor,
          {
            userId,
            input: message,
            history: historyMessages,
            maxIterations: 15,
          },
        )) {
          yield event as AgUiEvent;
        }
      } else {
        yield { type: 'error', content: `Agent ${agentKey} not properly initialized.` };
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
