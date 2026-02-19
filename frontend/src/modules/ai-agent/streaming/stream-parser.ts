import type { AgUiEvent } from './agui-events';

/**
 * Parse an NDJSON response stream into an async generator of AgUiEvents.
 */
export async function* parseNDJSONStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<AgUiEvent> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event: AgUiEvent = JSON.parse(trimmed);
          yield event;
        } catch {
          // Skip malformed lines
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer.trim());
      } catch {
        // Skip
      }
    }
  } finally {
    reader.releaseLock();
  }
}
