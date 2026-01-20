import { Minus } from 'lucide-react';
import { memo, useMemo } from 'react';

import { selectMinMaxMetric } from '@/features/analysis/lib/select-min-max-metrics';
import ComponentCard from '@/features/analysis/ui/component-card';
import MinMax from '@/features/analysis/ui/min-max';

import type { AnalysisProps } from '@/features/analysis/model/types';

const Summary = memo(function Summary({
  metrics,
}: Pick<AnalysisProps, 'metrics'>) {
  const { minItem, maxItem } = useMemo(
    () => selectMinMaxMetric(metrics),
    [metrics],
  );

  if (!metrics?.length) {
    return null;
  }

  return (
    <div className='grid grid-cols-2 gap-4'>
      {maxItem && (
        <ComponentCard>
          <p className='font-medium text-[20px] mb-2'>Maximum contribution</p>
          <div className='flex flex-row items-center'>
            <p className='font-medium text-[20px]'>{maxItem.display_name}</p>
            <Minus />
            <MinMax {...maxItem} />
          </div>
        </ComponentCard>
      )}

      {minItem && (
        <ComponentCard>
          <p className='font-medium text-[20px] mb-2'>
            The main focus is on growth
          </p>
          <div className='flex flex-row items-center'>
            <p className='font-medium text-[20px]'>{minItem.display_name}</p>
            <Minus />
            <MinMax {...minItem} />
          </div>
        </ComponentCard>
      )}
    </div>
  );
});

Summary.displayName = 'Summary';

export default Summary;
