import { getMenuItems } from '@/features/menu/lib/options';
import { applyMenuPreferences } from '@/features/menu/model/apply-preferences';
import { MenuNested } from '@/features/menu/ui/menu-nested';
import { getUser } from '@/features/user/api/user';

export default async function MenuSidebar() {
  const { data: user } = await getUser();
  const allItems = getMenuItems();
  const { primary, secondary } = applyMenuPreferences(
    allItems,
    user?.preferences?.menu,
  );

  return (
    <nav className='flex flex-col gap-1'>
      <MenuNested items={primary} />
      {secondary.length > 0 && (
        <>
          <hr className='border-white/10 my-1' />
          <MenuNested items={secondary} />
        </>
      )}
    </nav>
  );
}
