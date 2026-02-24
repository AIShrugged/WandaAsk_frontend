'use client';

import { Check, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'react-toastify';

import { updateChatTitle } from '@/features/chat/api/chats';
import { ROUTES } from '@/shared/lib/routes';

import type { Chat } from '@/features/chat/types';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onUpdate: (updated: Chat) => void;
}

export function ChatListItem({ chat, isActive, onUpdate }: ChatListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.title ?? '');
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditValue(chat.title ?? '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue(chat.title ?? '');
  };

  const saveTitle = () => {
    const title = editValue.trim();
    if (!title || title === chat.title) {
      cancelEditing();
      return;
    }

    startTransition(async () => {
      try {
        await updateChatTitle(chat.id, title);
        onUpdate({ ...chat, title });
        setIsEditing(false);
      } catch (error) {
        toast.error((error as Error).message);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') cancelEditing();
  };

  const href = `${ROUTES.DASHBOARD.CHAT}/${chat.id}`;
  const displayTitle = chat.title ?? 'Untitled chat';

  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'
      }`}
    >
      {isEditing ? (
        <div className='flex items-center gap-1 flex-1 min-w-0'>
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isPending}
            className='flex-1 min-w-0 text-sm bg-transparent outline-none border-b border-border text-foreground'
          />
          <button
            onClick={saveTitle}
            disabled={isPending}
            className='p-0.5 text-primary hover:opacity-70 disabled:opacity-40'
            aria-label='Save'
          >
            <Check className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={cancelEditing}
            className='p-0.5 text-muted-foreground hover:text-destructive'
            aria-label='Cancel'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
      ) : (
        <>
          <Link
            href={href}
            className='flex-1 min-w-0 text-sm text-foreground truncate'
          >
            {displayTitle}
          </Link>
          <button
            onClick={startEditing}
            className='hidden group-hover:flex p-0.5 text-muted-foreground hover:text-primary flex-shrink-0'
            aria-label='Edit title'
          >
            <Pencil className='w-3.5 h-3.5' />
          </button>
        </>
      )}
    </div>
  );
}
