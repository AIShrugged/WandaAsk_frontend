import { stringifyJson } from '@/features/agents/lib/json';

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.value
 * @param root0.emptyLabel
 */
export function AgentJsonPreview({
  title,
  value,
  emptyLabel = 'No data',
}: {
  title: string;
  value: unknown;
  emptyLabel?: string;
}) {
  const content = stringifyJson(value);

  return (
    <section className='flex flex-col gap-2'>
      <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
      {content ? (
        <pre className='overflow-x-auto rounded-[var(--radius-card)] border border-border bg-background/60 p-4 text-xs leading-6 text-muted-foreground'>
          {content}
        </pre>
      ) : (
        <p className='text-sm text-muted-foreground'>{emptyLabel}</p>
      )}
    </section>
  );
}
