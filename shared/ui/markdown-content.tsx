import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <p className='font-semibold text-sm text-foreground mt-3 mb-1'>{children}</p>
        ),
        h2: ({ children }) => (
          <p className='font-semibold text-sm text-foreground mt-3 mb-1'>{children}</p>
        ),
        h3: ({ children }) => (
          <p className='font-semibold text-sm text-foreground mt-2 mb-1'>{children}</p>
        ),
        p: ({ children }) => (
          <p className='text-sm text-foreground mb-2'>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className='flex flex-col gap-0.5 mb-2'>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className='flex flex-col gap-0.5 mb-2 list-decimal list-inside'>{children}</ol>
        ),
        li: ({ children }) => (
          <li className='flex items-start gap-2 text-sm text-foreground'>
            <span className='w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0' />
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => (
          <strong className='font-semibold'>{children}</strong>
        ),
        em: ({ children }) => <em className='italic'>{children}</em>,
        table: ({ children }) => (
          <div className='overflow-x-auto mb-2'>
            <table className='w-full text-sm border-collapse'>{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        th: ({ children }) => (
          <th className='text-left text-xs font-medium uppercase tracking-wide text-muted-foreground pb-1 pr-4'>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className='text-sm text-foreground pb-1 pr-4 align-top'>{children}</td>
        ),
        tr: ({ children }) => (
          <tr className='border-b border-border/30'>{children}</tr>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
