import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full text-sm border-collapse border border-secondary-200">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-secondary-200 bg-secondary-50 px-3 py-1.5 text-left font-semibold text-secondary-700">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-secondary-200 px-3 py-1.5 text-secondary-600">
            {children}
          </td>
        ),
        code: ({ className: codeClassName, children, ...props }) => {
          const isInline = !codeClassName;
          if (isInline) {
            return (
              <code className="bg-secondary-100 text-secondary-800 px-1 py-0.5 rounded text-xs" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className={`block bg-secondary-900 text-secondary-100 p-3 rounded-lg text-xs overflow-x-auto ${codeClassName || ''}`} {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-secondary-900">{children}</strong>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mt-3 mb-1">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mt-3 mb-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
