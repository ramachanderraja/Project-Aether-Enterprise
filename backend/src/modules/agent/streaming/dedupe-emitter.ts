import type { AgUiEvent } from './agui-events';

/**
 * Deduplicates repeated state emissions from LangGraph.
 * Simplified from reference — no HITL, handoff, or think-tag parsing.
 */
export class AgUiDedupeEmitter {
  private emittedLogs = new Set<string>();
  private emittedToolCalls = new Set<string>();
  private emittedErrors = new Set<string>();

  private streamedAnyToken = false;
  private streamedAnswerContent = '';

  public markTokenStreamed(token: string) {
    if (!token) return;
    this.streamedAnyToken = true;
    this.streamedAnswerContent += token;
  }

  public get hasStreamedAnyToken() {
    return this.streamedAnyToken;
  }

  public emitFromState(state: any): AgUiEvent[] {
    const out: AgUiEvent[] = [];

    // Logs
    if (Array.isArray(state?.logs)) {
      for (const log of state.logs) {
        const key = String(log);
        if (this.emittedLogs.has(key)) continue;
        this.emittedLogs.add(key);
        out.push({ type: 'log', content: key });
      }
    }

    // Tool calls
    if (Array.isArray(state?.toolCalls)) {
      for (const tc of state.toolCalls) {
        const toolName = String(tc?.tool || '');
        const toolId = tc?.id || `tool_${toolName}_${Date.now()}`;
        const key = `tool:${toolName}:${tc?.status || ''}:${toolId}`;
        if (this.emittedToolCalls.has(key)) continue;
        this.emittedToolCalls.add(key);

        out.push({
          type: 'action',
          content: toolName,
          toolName,
          toolId,
          toolStatus: tc?.status || 'completed',
          metadata: { input: tc?.input, output: tc?.output },
        });
      }
    }

    // Final answer fallback (only if no token streaming happened)
    if (
      !this.streamedAnyToken &&
      typeof state?.finalAnswer === 'string' &&
      state.finalAnswer.length > 0 &&
      this.streamedAnswerContent !== state.finalAnswer
    ) {
      this.streamedAnswerContent = state.finalAnswer;
      out.push({ type: 'answer', content: state.finalAnswer });
    }

    // Message-based fallback
    if (!this.streamedAnyToken && Array.isArray(state?.messages)) {
      const lastMsg = state.messages[state.messages.length - 1];
      if (
        lastMsg &&
        typeof lastMsg._getType === 'function' &&
        lastMsg._getType() === 'ai'
      ) {
        const content =
          typeof lastMsg.content === 'string' ? lastMsg.content : '';
        if (
          content &&
          content !== this.streamedAnswerContent &&
          !lastMsg.tool_calls?.length
        ) {
          this.streamedAnswerContent = content;
          out.push({ type: 'answer', content });
        }
      }
    }

    // Errors
    if (typeof state?.error === 'string' && state.error.length > 0) {
      if (!this.emittedErrors.has(state.error)) {
        this.emittedErrors.add(state.error);
        out.push({ type: 'error', content: state.error });
      }
    }

    return out;
  }
}
