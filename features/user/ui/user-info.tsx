'use client';

import React, { useRef } from 'react';

import { usePopup } from '@/shared/hooks/use-popup';
import Avatar from '@/shared/ui/common/avatar';

import { UserMenuPopup } from './user-menu-popup';

import type { UserProps } from '@/features/user/model/types';

interface UserInfoProps {
  user: UserProps;
}

export default function UserInfo({ user }: UserInfoProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const { open, close } = usePopup();

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
      <div ref={anchorRef} className='flex flex-col text-right'>
        <p className='text-accent font-medium'>{user.name}</p>
        <p className='text-secondary text-sm'>{user.email}</p>
      </div>

      <button
        onClick={handleOpen}
        className='cursor-pointer rounded-full hover:ring-2 hover:ring-accent/20 transition-all'
        aria-label='Open user menu'
      >
        <Avatar>{user.name[0]}</Avatar>
      </button>
    </div>
  );
}
