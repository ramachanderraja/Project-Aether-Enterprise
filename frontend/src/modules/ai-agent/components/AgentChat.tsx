import { useRef, useEffect, useState } from 'react';
import type { AgentConfig } from '../services/agent-api';
import { useAgentStream } from '../hooks/useAgentStream';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { AgentAvatar } from './AgentSelector';
import ChatMessage from './ChatMessage';

function useStopwatch(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now();
      setElapsed(0);
      const tick = () => {
        setElapsed(Date.now() - (startRef.current ?? Date.now()));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const secs = Math.floor(elapsed / 1000);
  const mins = Math.floor(secs / 60);
  const display = mins > 0
    ? `${mins}:${String(secs % 60).padStart(2, '0')}`
    : `${secs}.${String(Math.floor((elapsed % 1000) / 100))}s`;

  return { elapsed, display };
}

interface AgentChatProps {
  agent: AgentConfig;
  onBack: () => void;
}

export default function AgentChat({ agent, onBack }: AgentChatProps) {
  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages } =
    useAgentStream();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const user = useAuthStore((s) => s.user);
  const userName = user?.name || 'You';
  const { display: stopwatchDisplay } = useStopwatch(isStreaming);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;
    setInput('');
    sendMessage(agent.key, messageText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-secondary-100 mb-3 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
          title="Back to agent selection"
        >
          <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <AgentAvatar icon={agent.icon} size="sm" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary-900 text-sm truncate">
            {agent.name}
          </h3>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
          Online
        </span>
        <button
          onClick={clearMessages}
          className="text-xs text-secondary-400 hover:text-secondary-600 px-2 py-1 rounded hover:bg-secondary-100 transition-colors"
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pb-2 px-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <AgentAvatar icon={agent.icon} size="lg" />
            <h3 className="text-secondary-800 font-semibold text-base mt-4 mb-1">
              {agent.name}
            </h3>
            <p className="text-secondary-500 text-sm mb-6">
              Pick a question below or type your own
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {agent.suggestedQueries.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(query)}
                  className="text-left px-4 py-3 text-sm bg-white border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 text-secondary-700 rounded-lg transition-all group"
                >
                  <span className="text-primary-500 mr-2 group-hover:text-primary-600">&#8594;</span>
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            agent={agent}
            userName={userName}
            stopwatch={message.isStreaming ? stopwatchDisplay : undefined}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-secondary-100 pt-3 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a question...`}
            className="flex-1 resize-none rounded-xl border border-secondary-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 text-sm bg-secondary-50/50 placeholder:text-secondary-400"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              title="Stop streaming"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim()}
              className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-[10px] text-secondary-400 mt-1 ml-1">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
