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
  stopwatch?: string;
}

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  if (mins > 0) return `${mins}m ${secs % 60}s`;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${secs}.${tenths}s`;
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

export default function ChatMessage({ message, agent, userName = 'You', stopwatch }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar pinned to bottom */}
      {isUser ? (
        <div className="shrink-0 mb-5">
          <UserAvatar name={userName} />
        </div>
      ) : (
        <div className="shrink-0 mb-5">
          <AgentAvatar icon={agent.icon} size="sm" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message body */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-secondary-50 border border-secondary-100 text-secondary-900 rounded-bl-sm'
          }`}
        >
          {/* Routing badge */}
          {!isUser && message.route && (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium border border-indigo-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Routed to: {message.route.tab}
              </span>
              {message.route.reason && (
                <span className="text-secondary-400 italic text-[11px]">
                  {message.route.reason}
                </span>
              )}
            </div>
          )}

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

          {/* Thinking dots — visible throughout streaming until agent finishes */}
          {message.isStreaming && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-secondary-400">
                {!message.content && (!message.toolCalls || message.toolCalls.length === 0)
                  ? 'Thinking...'
                  : 'Generating...'}
              </span>
              {stopwatch && (
                <span className="text-xs font-mono text-secondary-400 tabular-nums">
                  {stopwatch}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Name + Timestamp row below bubble */}
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] font-medium text-secondary-500">
            {isUser ? userName : agent.name}
          </span>
          <span className="text-secondary-300">&middot;</span>
          <span className="text-[10px] text-secondary-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && message.isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] text-primary-500 font-medium ml-1">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              Streaming
            </span>
          )}
          {!isUser && !message.isStreaming && message.elapsedMs != null && (
            <>
              <span className="text-secondary-300">&middot;</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-secondary-400 font-mono tabular-nums">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatElapsed(message.elapsedMs)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
