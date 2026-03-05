import type { InsightCardArtifact } from '@/features/chat/types';

/**
 * formatKey.
 * @param key - key.
 * @returns Result.
 */
function formatKey(key: string): string {
  return key.replaceAll('_', ' ');
}

/**
 * InsightSection component.
 * @param root0
 * @param root0.category
 * @param root0.content
 */
function InsightSection({
  category,
  content,
}: {
  category: string;
  content: Record<string, unknown>;
}) {
  const entries = Object.entries(content);

  return (
    <div className='flex flex-col gap-2'>
      <p className='text-xs font-semibold text-muted-foreground'>{category}</p>

      {entries.map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div key={key} className='flex flex-wrap gap-1.5'>
              {(value as string[]).map((item, i) => {
                return (
                  <span
                    key={i}
                    className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary'
                  >
                    {item}
                  </span>
                );
              })}
            </div>
          );
        }

        if (typeof value === 'string' && value.length > 0) {
          return (
            <div key={key} className='flex flex-col gap-0.5'>
              <span className='text-xs text-muted-foreground capitalize'>
                {formatKey(key)}
              </span>
              <p className='text-sm text-foreground bg-accent/40 rounded-[var(--radius-button)] px-3 py-2'>
                {value}
              </p>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

/**
 * InsightCard component.
 * @param props - Component props.
 * @param props.data
 */
export function InsightCard({ data }: { data: InsightCardArtifact['data'] }) {
  const insights = data.insights ?? [];

  return (
    <div className='flex flex-col gap-4'>
      {data.person && (
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary'>
            {data.person.name
              .split(' ')
              .slice(0, 2)
              .map((w) => {
                return w[0];
              })
              .join('')
              .toUpperCase()}
          </div>
          <p className='text-sm font-semibold text-foreground'>
            {data.person.name}
          </p>
        </div>
      )}

      {insights.map((insight, i) => {
        return (
          <InsightSection
            key={i}
            category={insight.category}
            content={insight.content}
          />
        );
      })}
    </div>
  );
}
