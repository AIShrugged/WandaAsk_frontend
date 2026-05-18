import type { MethodologyCriteriaBlock } from '@/entities/artifact/model/types';

function assertNever(x: never): never {
  throw new Error(
    `Unexpected methodology_criteria block type: ${String((x as { type: string }).type)}`,
  );
}

function HeaderBlock({
  block,
}: {
  block: Extract<MethodologyCriteriaBlock, { type: 'header' }>;
}) {
  return (
    <h4 className='text-sm font-semibold text-foreground mt-3 mb-1 first:mt-0'>
      {block.text}
    </h4>
  );
}

function ScoringTableBlock({
  block,
}: {
  block: Extract<MethodologyCriteriaBlock, { type: 'scoring_table' }>;
}) {
  return (
    <div className='overflow-x-auto rounded-md border border-border mb-2'>
      <table className='w-full text-xs'>
        <thead>
          <tr className='bg-muted/50'>
            {block.columns.map((col) => {
              return (
                <th
                  key={col}
                  className='px-3 py-2 text-left font-medium text-muted-foreground'
                >
                  {col}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIdx) => {
            return (
              <tr key={rowIdx} className='border-t border-border/50'>
                {row.map((cell, cellIdx) => {
                  return (
                    <td key={cellIdx} className='px-3 py-2 text-foreground'>
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

function ProgressSummaryBlock({
  block,
}: {
  block: Extract<MethodologyCriteriaBlock, { type: 'progress_summary' }>;
}) {
  return (
    <div className='space-y-2 mb-2'>
      {block.items.map((item) => {
        const pct =
          item.max != null && item.max > 0
            ? Math.round((item.value / item.max) * 100)
            : 0;
        return (
          <div key={item.label}>
            <div className='flex justify-between text-xs mb-1'>
              <span className='text-muted-foreground'>{item.label}</span>
              <span className='font-medium text-foreground tabular-nums'>
                {item.value}
                {item.max == null ? '' : ` / ${item.max}`}
              </span>
            </div>
            {item.max != null && (
              <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
                <div
                  className='h-full rounded-full bg-primary transition-all'
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ScaleBlock({
  block,
}: {
  block: Extract<MethodologyCriteriaBlock, { type: 'scale' }>;
}) {
  return (
    <div className='mb-2'>
      <p className='text-xs font-medium text-muted-foreground mb-1'>
        {block.title}
      </p>
      <div className='flex flex-wrap gap-1.5'>
        {block.items.map((item) => {
          return (
            <span
              key={item.score}
              className='inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs'
            >
              <span className='font-semibold tabular-nums text-foreground'>
                {item.score}
              </span>
              <span className='text-muted-foreground'>{item.label}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TextListBlock({
  block,
}: {
  block: Extract<MethodologyCriteriaBlock, { type: 'text_list' }>;
}) {
  return (
    <div className='mb-2'>
      <p className='text-xs font-medium text-muted-foreground mb-1'>
        {block.title}
      </p>
      <ul className='space-y-0.5'>
        {block.items.map((item, i) => {
          return (
            <li key={i} className='flex gap-2 text-xs text-foreground'>
              <span className='text-muted-foreground flex-shrink-0'>•</span>
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MethodologyCriteriaBlock({
  block,
}: {
  block: MethodologyCriteriaBlock;
}) {
  switch (block.type) {
    case 'header': {
      return <HeaderBlock block={block} />;
    }
    case 'scoring_table': {
      return <ScoringTableBlock block={block} />;
    }
    case 'progress_summary': {
      return <ProgressSummaryBlock block={block} />;
    }
    case 'scale': {
      return <ScaleBlock block={block} />;
    }
    case 'text_list': {
      return <TextListBlock block={block} />;
    }
    default: {
      return assertNever(block);
    }
  }
}

export function MethodologyCriteriaArtifactView({
  data,
}: {
  data: { blocks: MethodologyCriteriaBlock[] };
}) {
  if (data.blocks.length === 0) {
    return (
      <p className='text-xs text-muted-foreground text-center py-4'>
        No criteria blocks
      </p>
    );
  }

  return (
    <div className='space-y-0.5'>
      {data.blocks.map((block, i) => {
        return <MethodologyCriteriaBlock key={i} block={block} />;
      })}
    </div>
  );
}
