import { useRouter } from 'next/navigation';
import { type ReactNode, useTransition } from 'react';

import { logout } from '@/app/actions/auth';
import { USER_MENU } from '@/features/user/lib/options';
import { ROUTES } from '@/shared/lib/routes';

interface MenuItem {
  id: string;
  title: string;
  icon?: ReactNode;
  action: string;
}
export function UserMenuPopup({ close }: { close: () => void }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = (action: MenuItem['action']) => {
    startTransition(async () => {
      try {
        switch (action) {
          case 'logout': {
            close();
            await logout();
            router.push(ROUTES.AUTH.LOGIN);
            break;
          }

          case 'settings': {
            router.push('/settings');
            close();
            break;
          }
        }
      } catch (error) {
        console.error('Action failed:', error);
      }
    });
  };

  return (
    <div className='bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden'>
      <div className='py-1'>
        {USER_MENU.map(menu => (
          <button
            key={menu.id}
            onClick={() => handleAction(menu.action)}
            disabled={isPending}
            className='cursor-pointer w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {menu.title}
          </button>
        ))}
      </div>
    </div>
  );
}
