import { Badge } from '@/shared/ui/badge/Badge';

import type { TabHealth } from '../../model/dashboard-types';

const STATUS_VARIANT = {
  healthy: 'success',
  warning: 'warning',
  risk: 'destructive',
} as const;

const STATUS_LABEL = {
  healthy: 'Healthy',
  warning: 'Warning',
  risk: 'At Risk',
} as const;

interface TeamDashboardTabHealthProps {
  data: TabHealth;
}

/**
 * TeamDashboardTabHealth — team health score and indicators.
 * @param props - Component props.
 * @param props.data
 */
export default function TeamDashboardTabHealth({
  data,
}: TeamDashboardTabHealthProps) {
  let barColor = 'bg-red-400';
  if (data.score >= 80) barColor = 'bg-emerald-400';
  else if (data.score >= 50) barColor = 'bg-yellow-300';

  return (
    <div className='flex flex-col gap-6'>
      {/* Score */}
      <div className='flex items-end gap-3'>
        <span className='text-6xl font-bold text-foreground'>{data.score}</span>
        <div className='pb-2 flex flex-col gap-1'>
          <span className='text-sm text-muted-foreground'>/ 100</span>
          <Badge variant={STATUS_VARIANT[data.status]}>
            {STATUS_LABEL[data.status]}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Indicators */}
      {data.indicators.length > 0 && (
        <div className='flex flex-col'>
          {data.indicators.map((indicator, i) => {
            return (
              <div
                key={indicator.key}
                className={`flex items-center justify-between py-2.5 text-sm ${i < data.indicators.length - 1 ? 'border-b border-border/50' : ''}`}
              >
                <span className='text-muted-foreground'>{indicator.label}</span>
                <span className='font-medium text-foreground'>
                  {indicator.value}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
