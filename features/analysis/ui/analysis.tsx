import Conclusion from '@/features/analysis/widgets/conclusion';
import Linear from '@/features/analysis/widgets/linear';
import Summary from '@/features/analysis/widgets/summary';
import Total from '@/features/analysis/widgets/total';

import type { AnalysisProps } from '@/features/analysis/model/types';

/**
 * Analysis component.
 * @param props - Component props.
 * @param props.data
 */
export default async function Analysis({ data }: { data: string }) {
  let parsed: AnalysisProps;
  try {
    parsed = JSON.parse(data) as AnalysisProps;
  } catch {
    return <div>Error in JSON</div>;
  }

  if (!parsed) return;

  return (
    <div className={'flex flex-col gap-10'}>
      {parsed.total && <Total total={parsed.total} />}
      <Summary metrics={parsed.metrics} />
      {parsed.metrics.map((item, index) => {
        return <Linear key={index} {...item} />;
      })}
      {parsed.conclusion && <Conclusion conclusion={parsed.conclusion} />}
    </div>
  );
}
