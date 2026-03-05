'use client';

import React, { useRef } from 'react';

import { usePopup } from '@/shared/hooks/use-popup';
import Avatar from '@/shared/ui/common/avatar';

import { UserMenuPopup } from './user-menu-popup';

import type { UserProps } from '@/entities/user';

interface UserInfoProps {
  user: UserProps;
}

/**
 * UserInfo component.
 * @param props - Component props.
 * @param props.user
 */
export default function UserInfo({ user }: UserInfoProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  const { open, close } = usePopup();

  /**
   * handleOpen.
   * @param e - e.
   * @returns Result.
   */
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!anchorRef.current) return;

    open(anchorRef.current, {
      width: 200,
      preferredPosition: 'bottom',
      offset: 6,
      content: <UserMenuPopup close={close} />,
    });
  };

  return (
    <div className='flex gap-2 items-center justify-end'>
      <div ref={anchorRef} className='hidden xs:flex flex-col text-right'>
        <p className='text-foreground font-medium'>{user.name}</p>
        <p className='text-muted-foreground text-sm'>{user.email}</p>
      </div>

      <button
        onClick={handleOpen}
        className='cursor-pointer rounded-full hover:ring-2 hover:ring-primary/20 transition-all flex items-center justify-center min-w-[44px] min-h-[44px]'
        aria-label='Open user menu'
      >
        <Avatar>{user.name[0]}</Avatar>
      </button>
    </div>
  );
}
