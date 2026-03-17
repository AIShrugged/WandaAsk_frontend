interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}

/**
 * KpiCard component.
 * @param root0 - Component props.
 * @param root0.label - Metric label.
 * @param root0.value - Numeric value to display.
 * @param root0.icon - Icon element.
 * @param root0.accent - Highlight value in primary color.
 * @returns JSX element.
 */
export function KpiCard({ label, value, icon, accent = false }: KpiCardProps) {
  return (
    <div className='flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-card'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-muted-foreground'>
          {label}
        </span>
        <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary'>
          {icon}
        </div>
      </div>
      <p
        className={
          accent
            ? 'text-3xl font-bold text-primary tabular-nums'
            : 'text-3xl font-bold text-foreground tabular-nums'
        }
      >
        {value}
      </p>
    </div>
  );
}
