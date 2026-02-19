import { Annotation } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

export const ToolAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  userId: Annotation<string>(),
  input: Annotation<string>(),
  systemPrompt: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  iterations: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 10,
  }),
  toolCalls: Annotation<Array<{ tool: string; input: any; output: string; id?: string; status?: string }>>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  finalAnswer: Annotation<string | undefined>(),
  logs: Annotation<string[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  error: Annotation<string | undefined>(),
});

export type ToolAgentStateType = typeof ToolAgentState.State;
