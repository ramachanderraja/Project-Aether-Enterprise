import type { ChatMessage as ChatMessageType } from '../hooks/useAgentStream';
import type { AgentConfig } from '../services/agent-api';
import { AgentAvatar } from './AgentSelector';
import MarkdownRenderer from './MarkdownRenderer';
import ThinkingIndicator from './ThinkingIndicator';
import ToolCallCard from './ToolCallCard';

interface ChatMessageProps {
  message: ChatMessageType;
  agent: AgentConfig;
  userName?: string;
}

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm shrink-0">
      <span className="text-white text-xs font-bold leading-none">{initials || 'U'}</span>
    </div>
  );
}

export default function ChatMessage({ message, agent, userName = 'You' }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {isUser ? (
        <UserAvatar name={userName} />
      ) : (
        <div className="shrink-0 pt-0.5">
          <AgentAvatar icon={agent.icon} size="sm" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Name row */}
        <div className={`flex items-center gap-2 mb-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold text-secondary-600">
            {isUser ? userName : agent.name}
          </span>
          {!isUser && message.isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] text-primary-500 font-medium">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              Streaming
            </span>
          )}
        </div>

        {/* Message body */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary-600 text-white rounded-tr-sm'
              : 'bg-secondary-50 border border-secondary-200 text-secondary-900 rounded-tl-sm'
          }`}
        >
          {/* Thinking indicator */}
          {!isUser && message.thoughts && (
            <ThinkingIndicator thoughts={message.thoughts} />
          )}

          {/* Tool calls */}
          {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mb-2">
              {message.toolCalls.map((tc) => (
                <ToolCallCard key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {/* Content */}
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {/* Thinking state — before any content arrives */}
          {message.isStreaming &&
            !message.content &&
            !message.thoughts &&
            (!message.toolCalls || message.toolCalls.length === 0) && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-secondary-500">Thinking...</span>
              </div>
            )}

          {/* Streaming cursor */}
          {message.isStreaming && message.content && (
            <span className="inline-block w-1.5 h-4 bg-primary-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>

        {/* Timestamp */}
        <span className={`text-[10px] mt-1 px-1 ${isUser ? 'text-secondary-400' : 'text-secondary-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
