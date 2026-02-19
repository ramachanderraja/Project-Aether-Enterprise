import type { AgUiEvent } from './agui-events';
import { AgUiDedupeEmitter } from './dedupe-emitter';

/**
 * Process a single LangGraph streamEvent and yield AG-UI events.
 * Simplified from reference — no internal/structured node suppression.
 */
export function* handleStreamEvent(
  evt: any,
  emitter: AgUiDedupeEmitter,
  emittedStreamEvents: Set<string>,
): Generator<AgUiEvent, boolean> {
  const eventType = String(evt?.event || '');

  // Token streaming
  if (
    eventType === 'on_chat_model_stream' ||
    eventType === 'on_llm_stream'
  ) {
    const chunk = evt?.data?.chunk;

    // Extract reasoning tokens
    const reasoning =
      chunk?.additional_kwargs?.reasoning_content ??
      chunk?.additional_kwargs?.thinking;

    if (typeof reasoning === 'string' && reasoning.length > 0) {
      yield { type: 'thought', content: reasoning };
    }

    // Extract main content token
    const rawContent =
      (chunk?.content != null && chunk.content !== ''
        ? chunk.content
        : undefined) ??
      evt?.data?.token ??
      (typeof chunk === 'string' ? chunk : undefined);

    let token = '';
    if (typeof rawContent === 'string') token = rawContent;
    else if (rawContent != null) token = String(rawContent);

    if (token.length > 0) {
      emitter.markTokenStreamed(token);
      yield { type: 'answer', content: token };
    }
    return true;
  }

  // Tool start
  if (eventType === 'on_tool_start') {
    const toolName = String(evt?.name || 'unknown');
    const toolInput = evt?.data?.input;
    const runId = evt?.run_id || `${Date.now()}`;
    const key = `action:${toolName}:${runId}`;
    if (!emittedStreamEvents.has(key)) {
      emittedStreamEvents.add(key);
      yield {
        type: 'action',
        content: toolName,
        toolName,
        toolId: `tool_${toolName}_${runId}`,
        toolStatus: 'calling',
        metadata: toolInput != null ? { input: toolInput } : undefined,
      };
    }
    return true;
  }

  // Tool end
  if (eventType === 'on_tool_end') {
    const toolName = String(evt?.name || 'unknown');
    const output = evt?.data?.output;
    const runId = evt?.run_id || `${Date.now()}`;
    const key = `observation:${toolName}:${runId}`;
    if (!emittedStreamEvents.has(key)) {
      emittedStreamEvents.add(key);
      yield {
        type: 'observation',
        content: typeof output === 'string' ? output : JSON.stringify(output),
        toolName,
        toolId: `tool_${toolName}_${runId}`,
        toolStatus: 'completed',
      };
    }
    return true;
  }

  // State-level events from chain
  if (eventType === 'on_chain_end' || eventType === 'on_chain_stream') {
    const output = evt?.data?.output;
    if (output && typeof output === 'object') {
      const state = (output as any).state ?? output;
      for (const e of emitter.emitFromState(state)) yield e;
    }
  }

  return false;
}
