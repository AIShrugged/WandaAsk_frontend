import React from 'react';

import { EmptyState } from '@/shared/ui/feedback/empty-state';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description?: string;
}

interface GenericListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyState: EmptyStateConfig;
  className?: string;
}

/**
 * GenericList — renders a list of items with an empty state fallback.
 * Use for simple flat lists without infinite scroll or complex state.
 * @param props - Component props.
 * @param props.items
 * @param props.renderItem
 * @param props.keyExtractor
 * @param props.emptyState
 * @param props.className
 * @returns JSX element.
 */
export function GenericList<T>({
  items,
  renderItem,
  keyExtractor,
  emptyState,
  className,
}: GenericListProps<T>) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
      />
    );
  }

  return (
    <div className={className}>
      {items.map((item) => {
        return (
          <React.Fragment key={keyExtractor(item)}>
            {renderItem(item)}
          </React.Fragment>
        );
      })}
    </div>
  );
}
