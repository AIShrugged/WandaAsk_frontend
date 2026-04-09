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
      className='flex flex-col items-center justify-center gap-3 py-16 text-center'
    >
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <Icon className='h-6 w-6' />
      </div>
      <div className='flex flex-col gap-1'>
        <p className='text-sm font-medium text-foreground'>{title}</p>
        {description && (
          <p className='text-xs text-muted-foreground'>{description}</p>
        )}
      </div>
    </div>
  );
}
