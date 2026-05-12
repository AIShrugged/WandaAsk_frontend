import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

/**
 * EmptyState component — shown when a list has no items.
 * @param root0 - Component props.
 * @param root0.icon - LucideIcon to display.
 * @param root0.title - Primary message.
 * @param root0.description - Optional secondary message.
 * @returns JSX element.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div
      role='status'
      className='flex flex-col items-center justify-center gap-[var(--sp-4)] py-16 text-center'
    >
      <div
        className='flex h-12 w-12 items-center justify-center rounded-full text-[var(--primary)]'
        style={{
          background: 'color-mix(in oklab, var(--primary) 12%, transparent)',
        }}
      >
        <Icon className='h-6 w-6' />
      </div>
      <div className='flex flex-col gap-1'>
        <p className='text-[length:var(--fs-sm)] font-medium text-[var(--foreground)]'>
          {title}
        </p>
        {description && (
          <p className='text-[length:var(--fs-xs)] text-[var(--muted-foreground)]'>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
