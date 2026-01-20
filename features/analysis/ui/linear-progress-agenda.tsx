import MinMax from '@/features/analysis/ui/min-max';

import type { MetricItem } from '@/features/analysis/model/types';

export default function LinearProgressAgenda(metric: MetricItem) {
  return (
    <div className={'mb-2'}>
      <div className={'flex flex-row justify-between'}>
        <p className={'text-[14px]'}>{metric.display_name}</p>
        <MinMax {...metric} />
      </div>
    </div>
  );
}
