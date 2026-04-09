import { AlertCircle, CheckCircle, TrendingUp, XCircle } from 'lucide-react';

import type {
  MethodologyCriteriaArtifact,
  MethodologyCriteriaBlock,
} from '@/entities/artifact/model/types';

/**
 * Returns a color class based on percentage score.
 * @param pct - Percentage 0–100.
 * @returns Tailwind color class.
 */
function scoreColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-400';
  if (pct >= 75) return 'text-green-400';
  if (pct >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Returns a bar color class based on percentage score.
 * @param pct - Percentage 0–100.
 * @returns Tailwind background color class.
 */
function barColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Returns a CSS color string for the scale bar background.
 * @param pct - Percentage 0–100.
 * @returns CSS color string.
 */
function scaleBarBg(pct: number): string {
  if (pct >= 90) return 'rgb(52 211 153)';
  if (pct >= 75) return 'rgb(74 222 128)';
  if (pct >= 60) return 'rgb(250 204 21)';
  return 'rgb(248 113 113)';
}

/**
 * Returns an icon and label for the overall score.
 * @param pct - Percentage 0–100.
 * @returns Object with icon and label.
 */
function scoreStatus(pct: number) {
  if (pct >= 75) {
    return { Icon: CheckCircle, color: 'text-green-400', label: 'Good' };
  }
  if (pct >= 60) {
    return {
      Icon: AlertCircle,
      color: 'text-yellow-400',
      label: 'Satisfactory',
    };
  }
  return { Icon: XCircle, color: 'text-red-400', label: 'Needs improvement' };
}

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
        <h3 className='text-base font-semibold text-foreground flex items-center gap-2'>
          <TrendingUp className='w-4 h-4 text-primary flex-shrink-0' />
          {block.text}
        </h3>
      );
    }

    case 'scoring_table': {
      const scoreColIndex = block.columns.findIndex((c) => {
        return typeof c === 'string' && c.toLowerCase().includes('факт');
      });
      const maxColIndex = block.columns.findIndex((c) => {
        return typeof c === 'string' && c.toLowerCase().includes('макс');
      });

      return (
        <div className='overflow-x-auto rounded-lg border border-border/50'>
          <table className='w-full text-xs'>
            <thead>
              <tr className='border-b border-border bg-accent/20'>
                {block.columns.map((col, i) => {
                  return (
                    <th
                      key={i}
                      className={`px-3 py-2.5 font-semibold text-muted-foreground ${
                        i === 0 ? 'text-left' : 'text-center'
                      }`}
                    >
                      {col}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => {
                const factVal =
                  scoreColIndex === -1 ? null : Number(row[scoreColIndex]);
                const maxVal =
                  maxColIndex === -1 ? null : Number(row[maxColIndex]);
                const pct =
                  factVal != null && maxVal != null && maxVal > 0
                    ? (factVal / maxVal) * 100
                    : null;

                return (
                  <tr
                    key={i}
                    className='border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors'
                  >
                    {row.map((cell, j) => {
                      const isScore = j === scoreColIndex && pct != null;
                      const isMax = j === maxColIndex;

                      let cellClass =
                        j === 0
                          ? 'text-left text-foreground'
                          : 'text-center text-foreground/80';

                      if (isScore) {
                        cellClass = `text-center font-bold ${scoreColor(pct!)}`;
                      } else if (isMax) {
                        cellClass = 'text-center text-muted-foreground';
                      }

                      return (
                        <td key={j} className={`px-3 py-2.5 ${cellClass}`}>
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
        <div className='flex flex-col gap-4'>
          {block.items.map((item, i) => {
            const pct =
              item.max != null && item.max > 0
                ? Math.min((item.value / item.max) * 100, 100)
                : null;
            const status =
              pct == null
                ? { Icon: TrendingUp, color: 'text-primary', label: '' }
                : scoreStatus(pct);

            return (
              <div
                key={i}
                className='rounded-xl border border-border/50 bg-accent/10 p-4 flex flex-col gap-3'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-semibold text-foreground'>
                    {item.label}
                  </span>
                  <div className='flex items-center gap-2'>
                    {pct != null && (
                      <span className={`text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                    <span
                      className={`text-2xl font-bold ${pct == null ? 'text-foreground' : scoreColor(pct)}`}
                    >
                      {item.max == null ? (
                        item.value
                      ) : (
                        <>
                          {item.value}
                          <span className='text-base font-normal text-muted-foreground'>
                            /{item.max}
                          </span>
                        </>
                      )}
                    </span>
                    <status.Icon className={`w-5 h-5 ${status.color}`} />
                  </div>
                </div>
                {pct != null && (
                  <div>
                    <div className='h-2.5 rounded-full bg-accent/50 overflow-hidden'>
                      <div
                        className={`h-full rounded-full transition-all ${barColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className='flex justify-between mt-1 text-xs text-muted-foreground'>
                      <span>0</span>
                      <span>{pct.toFixed(0)}%</span>
                      <span>{item.max}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case 'scale': {
      const thresholds = block.items.toSorted((a, b) => {
        return b.score - a.score;
      });

      return (
        <div className='rounded-xl border border-border/50 bg-accent/10 p-4 flex flex-col gap-3'>
          <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            {block.title}
          </p>
          <div className='flex flex-col gap-1.5'>
            {thresholds.map((item, i) => {
              const pct = item.score;
              const barBg = scaleBarBg(pct);

              return (
                <div key={i} className='flex items-center gap-3 text-xs'>
                  <div
                    className={`w-10 text-center font-bold tabular-nums flex-shrink-0 ${scoreColor(pct)}`}
                  >
                    {item.score}+
                  </div>
                  <div
                    className='h-1.5 rounded-full flex-shrink-0'
                    style={{
                      width: `${pct}px`,
                      maxWidth: '80px',
                      background: barBg,
                    }}
                  />
                  <span className='text-foreground/80'>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'text_list': {
      return (
        <div className='rounded-xl border border-border/50 bg-accent/10 p-4 flex flex-col gap-3'>
          <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
            {block.title}
          </p>
          <ul className='flex flex-col gap-2'>
            {block.items.map((item, i) => {
              return (
                <li
                  key={i}
                  className='flex items-start gap-2 text-sm text-foreground/90'
                >
                  <span className='mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0' />
                  <span className='leading-relaxed'>{item}</span>
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
    <div className='flex flex-col gap-5'>
      {blocks.map((block, i) => {
        return <MethodologyBlock key={i} block={block} />;
      })}
    </div>
  );
}
