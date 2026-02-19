// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
import {
  BaseMessage,
  HumanMessage,
} from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { AgUiEvent } from '../streaming/agui-events';

export function buildToolAgentGraph(
  llm: BaseChatModel,
  tools: StructuredToolInterface[],
  systemPrompt?: string,
) {
  return createReactAgent({
    llm,
    tools,
    ...(systemPrompt ? { prompt: systemPrompt } : {}),
  });
}

export async function* streamToolAgentGraph(
  graph: ReturnType<typeof buildToolAgentGraph>,
  params: {
    userId: string;
    input: string;
    systemPrompt: string;
    history?: BaseMessage[];
    maxIterations?: number;
  },
): AsyncGenerator<AgUiEvent> {
  const messages: BaseMessage[] = [
    ...(params.history || []),
    new HumanMessage(params.input),
  ];

  const announcedTools = new Set<string>();

  try {
    for await (const event of graph.streamEvents(
      { messages },
      {
        version: 'v2',
        recursionLimit: (params.maxIterations ?? 10) * 2 + 1,
      },
    )) {
      const { event: eventType, name, data } = event;

      if (eventType === 'on_chat_model_stream') {
        const chunk = data?.chunk;
        if (!chunk) continue;

        const content =
          typeof chunk.content === 'string' ? chunk.content : '';
        if (content) {
          yield { type: 'answer', content };
        }
      }

      if (eventType === 'on_tool_start') {
        const toolId = event.run_id || `call_${name}_${Date.now()}`;
        if (!announcedTools.has(toolId)) {
          announcedTools.add(toolId);
          yield {
            type: 'action',
            toolId,
            toolName: name,
            toolStatus: 'calling',
            content: name,
            metadata: data?.input ? { input: data.input } : undefined,
          };
        }
      }

      if (eventType === 'on_tool_end') {
        const toolId = event.run_id || `call_${name}_end`;
        const output =
          typeof data?.output === 'string'
            ? data.output
            : typeof data?.output?.content === 'string'
              ? data.output.content
              : JSON.stringify(data?.output ?? '');
        yield {
          type: 'observation',
          toolId,
          toolName: name,
          content: output,
        };
      }
    }
  } catch (err) {
    console.error('[streamToolAgentGraph] Stream error:', err);
    yield {
      type: 'error',
      content: err instanceof Error ? err.message : String(err),
    };
  }
}
