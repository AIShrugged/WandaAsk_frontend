import { MENU_ITEMS } from '@/features/menu/lib/options';
import { MenuNested } from '@/features/menu/ui/menu-nested';

/**
 * MenuSidebar component.
 */
export default function MenuSidebar() {
  return (
    <nav className='flex flex-col gap-1'>
      <MenuNested items={MENU_ITEMS} />
    </nav>
  );
}
