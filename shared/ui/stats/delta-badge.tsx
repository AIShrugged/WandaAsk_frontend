import { TrendingDown, TrendingUp } from 'lucide-react';

interface DeltaBadgeProps {
  delta: number;
  label: string;
  polarity?: 'positive-good' | 'negative-good';
}

export function DeltaBadge({
  delta,
  label,
  polarity = 'positive-good',
}: DeltaBadgeProps) {
  if (delta === 0) {
    return (
      <span className='text-xs text-muted-foreground'>No change {label}</span>
    );
  }

  const isGood = polarity === 'positive-good' ? delta > 0 : delta < 0;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${isGood ? 'text-emerald-400' : 'text-red-400'}`}
    >
      {delta > 0 ? (
        <TrendingUp className='h-3 w-3' />
      ) : (
        <TrendingDown className='h-3 w-3' />
      )}
      {delta > 0 ? '+' : ''}
      {delta} {label}
    </span>
  );
}
