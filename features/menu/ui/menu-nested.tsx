import { NestedMenuItem } from '@/features/menu/ui/menu-nested-item';

import type { MenuProps } from '@/features/menu/model/types';

/**
 * MenuNested component.
 * @param props - Component props.
 * @param props.items
 */
export function MenuNested({ items }: { items: MenuProps[] }) {
  return items.map((item) => {
    return <NestedMenuItem key={item.id} item={item} level={0} />;
  });
}
