import { useRef, useEffect, useState } from 'react';
import type { AgentConfig } from '../services/agent-api';
import { useAgentStream } from '../hooks/useAgentStream';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { AgentAvatar } from './AgentSelector';
import ChatMessage from './ChatMessage';

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
      <div className="flex items-center gap-3 pb-3 border-b border-secondary-200 mb-3 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
          title="Back to agent selection"
        >
          <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <AgentAvatar icon={agent.icon} size="sm" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary-900 text-sm truncate">
            {agent.name}
          </h3>
          <p className="text-xs text-secondary-500 truncate">
            {agent.description}
          </p>
        </div>
        <button
          onClick={clearMessages}
          className="text-xs text-secondary-400 hover:text-secondary-600 px-2 py-1 rounded hover:bg-secondary-100 transition-colors"
          title="Clear chat"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pb-2 px-1">
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
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-secondary-200 pt-3 shrink-0">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${agent.name}...`}
            className="flex-1 resize-none rounded-lg border border-secondary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-secondary-400 mt-1.5">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
