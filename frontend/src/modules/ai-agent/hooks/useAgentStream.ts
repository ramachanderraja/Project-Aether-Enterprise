import { useState, useCallback, useRef } from 'react';
import { streamAgentChat, type HistoryMessage } from '../services/agent-api';

export interface ToolCall {
  id: string;
  name: string;
  status: 'calling' | 'completed' | 'failed';
  input?: any;
  output?: string;
}

export interface RouteInfo {
  tab: string;
  tabIndex: number;
  reason: string;
  agentKey: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  thoughts?: string;
  route?: RouteInfo;
  elapsedMs?: number;
}

export function useAgentStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (agentKey: string, content: string) => {
      // Add user message
      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      // Build history from existing messages (exclude the one being added)
      const history: HistoryMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Create assistant placeholder
      const assistantId = `assistant_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: [],
        thoughts: '',
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsStreaming(true);

      const streamStartTime = Date.now();
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const toolCallsMap = new Map<string, ToolCall>();
        let answerContent = '';
        let thoughts = '';
        let routeInfo: RouteInfo | undefined;

        for await (const event of streamAgentChat(
          agentKey,
          content,
          history,
          abortController.signal,
        )) {
          if (abortController.signal.aborted) break;

          switch (event.type) {
            case 'answer':
              answerContent += event.content;
              break;

            case 'thought':
              thoughts += event.content;
              break;

            case 'action': {
              const toolId =
                event.toolId || `tool_${event.toolName}_${Date.now()}`;
              toolCallsMap.set(toolId, {
                id: toolId,
                name: event.toolName || event.content,
                status:
                  (event.toolStatus as ToolCall['status']) || 'calling',
                input: event.metadata?.input,
              });
              break;
            }

            case 'observation': {
              const obsToolId = event.toolId;
              if (obsToolId && toolCallsMap.has(obsToolId)) {
                const tc = toolCallsMap.get(obsToolId)!;
                tc.status = 'completed';
                tc.output = event.content;
              } else if (event.toolName) {
                // Try to match by name
                for (const [, tc] of toolCallsMap) {
                  if (
                    tc.name === event.toolName &&
                    tc.status === 'calling'
                  ) {
                    tc.status = 'completed';
                    tc.output = event.content;
                    break;
                  }
                }
              }
              break;
            }

            case 'error':
              if (event.toolId && toolCallsMap.has(event.toolId)) {
                const tc = toolCallsMap.get(event.toolId)!;
                tc.status = 'failed';
                tc.output = event.content;
              } else {
                answerContent +=
                  answerContent.length > 0
                    ? `\n\n**Error:** ${event.content}`
                    : `**Error:** ${event.content}`;
              }
              break;

            case 'route': {
              const meta = event.metadata || {};
              routeInfo = {
                tab: (meta.tab as string) || event.content,
                tabIndex: (meta.tabIndex as number) ?? -1,
                reason: (meta.reason as string) || '',
                agentKey: (meta.agentKey as string) || '',
              };
              break;
            }

            case 'done':
            case 'ping':
              // Ignored
              break;

            case 'log':
              // Could display in debug mode
              break;
          }

          // Update assistant message in state
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: answerContent,
                    thoughts,
                    toolCalls: Array.from(toolCallsMap.values()),
                    route: routeInfo,
                    isStreaming: event.type !== 'done',
                  }
                : m,
            ),
          );
        }

        // Mark streaming complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: answerContent || 'No response received.',
                  thoughts,
                  toolCalls: Array.from(toolCallsMap.values()),
                  route: routeInfo,
                  isStreaming: false,
                  elapsedMs: Date.now() - streamStartTime,
                }
              : m,
          ),
        );
      } catch (error) {
        const elapsed = Date.now() - streamStartTime;
        if ((error as Error).name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `**Error:** ${(error as Error).message || 'An error occurred'}`,
                    isStreaming: false,
                    elapsedMs: elapsed,
                  }
                : m,
            ),
          );
        } else {
          // Abort: mark the assistant message as no longer streaming
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false, elapsedMs: elapsed } : m,
            ),
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, stopStreaming, clearMessages };
}
