import ComponentCard from '@/features/analysis/ui/component-card';
import LinearProgress from '@/features/analysis/ui/linear-progress';
import LinearProgressAgenda from '@/features/analysis/ui/linear-progress-agenda';
import LinearProgressTitle from '@/features/analysis/ui/linear-progress-title';

import type { MetricGroup } from '@/features/analysis/model/types';

export default function Linear({
  display_name,
  current_value,
  submetrics,
}: MetricGroup) {
  return (
    <div className={'flex flex-col gap-2'}>
      <LinearProgressTitle title={display_name} />

      <div
        className='grid gap-4'
        style={{
          gridTemplateColumns: `repeat(${Math.min(submetrics.length, 4)}, minmax(0, 1fr))`,
        }}
      >
        {submetrics.map(v => (
          <ComponentCard key={v.display_name}>
            <LinearProgressAgenda {...v} />
            <LinearProgress {...v} />
          </ComponentCard>
        ))}
      </div>
    </div>
  );
}
