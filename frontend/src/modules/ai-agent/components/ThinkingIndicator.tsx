interface ThinkingIndicatorProps {
  thoughts?: string;
}

export default function ThinkingIndicator({ thoughts }: ThinkingIndicatorProps) {
  if (!thoughts) return null;

  return (
    <details className="mb-2 group">
      <summary className="cursor-pointer text-xs text-secondary-400 hover:text-secondary-600 flex items-center gap-1">
        <svg
          className="w-3 h-3 transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Thinking...
      </summary>
      <div className="mt-1 pl-4 border-l-2 border-secondary-200 text-xs text-secondary-400 italic whitespace-pre-wrap">
        {thoughts}
      </div>
    </details>
  );
}
