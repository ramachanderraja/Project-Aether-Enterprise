import { useState } from 'react';
import type { ToolCall } from '../hooks/useAgentStream';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

const statusColors: Record<string, string> = {
  calling: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const statusIcons: Record<string, string> = {
  calling: '\u2699\uFE0F',
  completed: '\u2705',
  failed: '\u274C',
};

function formatToolName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-1.5 border border-secondary-200 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary-50 transition-colors text-left"
      >
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[toolCall.status] || 'bg-secondary-100 text-secondary-600'}`}
        >
          {statusIcons[toolCall.status] || ''}{' '}
          {toolCall.status === 'calling' ? 'Running' : toolCall.status}
        </span>
        <span className="font-medium text-secondary-700">
          {formatToolName(toolCall.name)}
        </span>
        {toolCall.status === 'calling' && (
          <span className="ml-auto">
            <svg
              className="animate-spin h-3 w-3 text-blue-500"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        <svg
          className={`ml-auto w-3 h-3 transition-transform text-secondary-400 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-secondary-200 px-3 py-2 bg-secondary-50">
          {toolCall.input && (
            <div className="mb-2">
              <span className="font-medium text-secondary-500">Input:</span>
              <pre className="mt-0.5 bg-white p-2 rounded border border-secondary-200 overflow-x-auto whitespace-pre-wrap text-[11px]">
                {typeof toolCall.input === 'string'
                  ? toolCall.input
                  : JSON.stringify(toolCall.input, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.output && (
            <div>
              <span className="font-medium text-secondary-500">Output:</span>
              <pre className="mt-0.5 bg-white p-2 rounded border border-secondary-200 overflow-x-auto whitespace-pre-wrap text-[11px] max-h-48 overflow-y-auto">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(toolCall.output), null, 2);
                  } catch {
                    return toolCall.output;
                  }
                })()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
