import { useRouter } from 'next/navigation';
import React, { type ReactNode, useTransition } from 'react';

import { USER_MENU } from '@/features/user/lib/options';
import { logout } from '@/shared/api/session';
import { ROUTES } from '@/shared/lib/routes';

import type { UserProps } from '@/entities/user';

interface MenuItem {
  id: string;
  title: string;
  icon?: ReactNode;
  action: string;
}
/**
 * UserMenuPopup component.
 * @param props - Component props.
 * @param props.user
 * @param props.close
 */
export function UserMenuPopup({
  user,
  close,
}: {
  close: () => void;
  user: UserProps;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  /**
   * handleAction.
   * @param action - action.
   * @returns Result.
   */
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

          case 'profile': {
            router.push(ROUTES.DASHBOARD.PROFILE);
            close();
            break;
          }
        }
      } catch {
        // silently fail — action errors should not crash the UI
      }
    });
  };

  return (
    <div className='bg-popover rounded-[var(--radius-card)] border border-border overflow-hidden'>
      <div className='py-1'>
        <div className='px-4 py-2 hidden lg:flex flex-col text-left border-b border-border'>
          <p className='text-foreground font-medium'>{user?.name}</p>
          <p className='text-muted-foreground text-sm'>{user?.email}</p>
        </div>
        {USER_MENU.map((menu) => {
          return (
            <button
              key={menu.id}
              onClick={() => {
                return handleAction(menu.action);
              }}
              disabled={isPending}
              className='cursor-pointer w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {menu.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
