import { NestedMenuItem } from '@/features/menu/ui/menu-nested-item';

import type { MenuProps } from '@/features/menu/model/types';

/**
 * MenuNested component.
 * @param props - Component props.
 * @param props.items
 */
export function MenuNested({ items }: { items: MenuProps[] }) {
  const separatorThreshold = 10;

  return items.map((item, index) => {
    const showSeparator =
      index > 0 &&
      item.position >= separatorThreshold &&
      items[index - 1].position < separatorThreshold;

    return (
      <div key={item.id}>
        {showSeparator && (
          <div className='my-2 mx-4 border-t border-sidebar-border/50' />
        )}
        <NestedMenuItem item={item} level={0} />
      </div>
    );
  });
}
