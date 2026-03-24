import type {
  MethodologyCriteriaArtifact,
  MethodologyCriteriaBlock,
} from '@/features/chat/types';

/**
 * MethodologyBlock component.
 * @param props - Component props.
 * @param props.block - A single methodology criteria block to render.
 * @returns JSX element.
 */
function MethodologyBlock({ block }: { block: MethodologyCriteriaBlock }) {
  switch (block.type) {
    case 'header': {
      return (
        <h3 className='text-sm font-semibold text-foreground'>{block.text}</h3>
      );
    }

    case 'scoring_table': {
      return (
        <div className='overflow-x-auto'>
          <table className='w-full text-xs'>
            <thead>
              <tr className='border-b border-border'>
                {block.columns.map((col, i) => {
                  const isLast = i === block.columns.length - 1;

                  return (
                    <th
                      key={i}
                      className={`px-3 py-2 font-semibold text-muted-foreground ${isLast ? 'text-right' : 'text-left'}`}
                    >
                      {col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => {
                return (
                  <tr
                    key={i}
                    className='border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors'
                  >
                    {row.map((cell, j) => {
                      const isLast = j === row.length - 1;

                      return (
                        <td
                          key={j}
                          className={`px-3 py-2 text-foreground ${isLast ? 'text-right font-medium' : ''}`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    case 'progress_summary': {
      return (
        <div className='flex flex-col gap-2'>
          {block.items.map((item, i) => {
            return (
              <div key={i} className='flex flex-col gap-1'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-foreground'>{item.label}</span>
                  <span className='text-muted-foreground font-medium'>
                    {item.max == null
                      ? item.value
                      : `${item.value}/${item.max}`}
                  </span>
                </div>
                {item.max != null && (
                  <div className='h-1.5 rounded-full bg-accent/50 overflow-hidden'>
                    <div
                      className='h-full rounded-full bg-primary transition-all'
                      style={{
                        width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case 'scale': {
      return (
        <div className='flex flex-col gap-1.5'>
          <p className='text-xs font-semibold text-muted-foreground'>
            {block.title}
          </p>
          <div className='flex flex-col gap-1'>
            {block.items.map((item, i) => {
              return (
                <div key={i} className='flex items-baseline gap-2 text-xs'>
                  <span className='inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex-shrink-0'>
                    {item.score}
                  </span>
                  <span className='text-foreground'>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'text_list': {
      return (
        <div className='flex flex-col gap-1.5'>
          <p className='text-xs font-semibold text-muted-foreground'>
            {block.title}
          </p>
          <ul className='flex flex-col gap-1 list-disc list-inside'>
            {block.items.map((item, i) => {
              return (
                <li key={i} className='text-xs text-foreground leading-relaxed'>
                  {item}
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }
}

/**
 * MethodologyCriteria component.
 * @param props - Component props.
 * @param props.data - Methodology criteria artifact data.
 * @returns JSX element.
 */
export function MethodologyCriteria({
  data,
}: {
  data: MethodologyCriteriaArtifact['data'];
}) {
  const blocks = data.blocks ?? [];

  if (blocks.length === 0) {
    return (
      <p className='text-sm text-muted-foreground text-center py-6'>
        No content
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {blocks.map((block, i) => {
        return <MethodologyBlock key={i} block={block} />;
      })}
    </div>
  );
}
