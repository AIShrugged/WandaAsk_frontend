import ComponentCard from '@/features/analysis/ui/component-card';
import LinearProgress from '@/features/analysis/ui/linear-progress';
import LinearProgressAgenda from '@/features/analysis/ui/linear-progress-agenda';
import LinearProgressTitle from '@/features/analysis/ui/linear-progress-title';

import type { MetricGroup } from '@/features/analysis/model/types';

/**
 * Linear component.
 * @param root0
 * @param root0.display_name
 * @param root0.submetrics
 */
export default function Linear({ display_name, submetrics }: MetricGroup) {
  const lgCols = (
    [
      'lg:grid-cols-1',
      'lg:grid-cols-2',
      'lg:grid-cols-3',
      'lg:grid-cols-4',
    ] as const
  )[Math.min(submetrics.length, 4) - 1];

  return (
    <div className={'flex flex-col gap-2'}>
      <LinearProgressTitle title={display_name} />

      <div className={`grid gap-4 grid-cols-1 phone:grid-cols-2 ${lgCols}`}>
        {submetrics.map((v) => {
          return (
            <ComponentCard key={v.display_name}>
              <LinearProgressAgenda {...v} />
              <LinearProgress {...v} />
            </ComponentCard>
          );
        })}
      </div>
    </div>
  );
}
