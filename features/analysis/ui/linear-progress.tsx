import type { MetricItem } from '@/features/analysis/model/types';

/**
 * LinearProgress component.
 * @param root0
 * @param root0.current_value
 * @param root0.max_value
 */
export default function LinearProgress({
  current_value,
  max_value,
  ...props
}: MetricItem) {
  const normalized =
    (Math.max(0, Math.min(max_value, current_value)) / max_value) * 100;

  const height = 10;

  return (
    <div
      className={`relative w-full bg-muted rounded-full overflow-hidden`}
      style={{ height }}
      {...props}
    >
      <div
        className='h-full bg-primary  transition-all duration-1000 ease-out'
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
