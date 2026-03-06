'use client';

import { Check, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteChat, updateChatTitle } from '@/features/chat/api/chats';
import { ROUTES } from '@/shared/lib/routes';

import type { Chat } from '@/features/chat/types';

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onUpdate: (updated: Chat) => void;
  onDelete: (id: number) => void;
}

/**
 * ChatListItem component.
 * @param props - Component props.
 * @param props.chat - The chat data to display.
 * @param props.isActive - Whether this item is currently selected.
 * @param props.onUpdate - Callback when the chat title is updated.
 * @param props.onDelete - Callback when the chat is deleted.
 * @returns Result.
 */
export function ChatListItem({
  chat,
  isActive,
  onUpdate,
  onDelete,
}: ChatListItemProps) {
  const [mode, setMode] = useState<'idle' | 'editing' | 'confirming-delete'>(
    'idle',
  );

  const [editValue, setEditValue] = useState(chat.title ?? '');

  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Edit handlers ──────────────────────────────────────────────────────────

  /**
   * startEditing.
   * @param e - e.
   * @returns Result.
   */
  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditValue(chat.title ?? '');
    setMode('editing');
    setTimeout(() => {
      return inputRef.current?.focus();
    }, 0);
  };

  /**
   * cancelEditing.
   * @returns Result.
   */
  const cancelEditing = () => {
    setMode('idle');
    setEditValue(chat.title ?? '');
  };

  /**
   * saveTitle.
   * @returns Result.
   */
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
        setMode('idle');
      } catch (error) {
        toast.error((error as Error).message);
      }
    });
  };

  /**
   * handleEditKeyDown.
   * @param e - e.
   * @returns Result.
   */
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveTitle();

    if (e.key === 'Escape') cancelEditing();
  };

  // ── Delete handlers ────────────────────────────────────────────────────────

  /**
   * handleDeleteClick.
   * @param e - e.
   * @returns Result.
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMode('confirming-delete');
  };

  /**
   * cancelDelete.
   * @returns Result.
   */
  const cancelDelete = () => {
    return setMode('idle');
  };

  /**
   * confirmDelete.
   * @returns Result.
   */
  const confirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteChat(chat.id);
        onDelete(chat.id);
      } catch (error) {
        toast.error((error as Error).message);
        setMode('idle');
      }
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const href = `${ROUTES.DASHBOARD.CHAT}/${chat.id}`;

  const displayTitle = chat.title ?? 'Untitled chat';

  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'hover:bg-sidebar-accent/50'
      }`}
    >
      {/* ── Editing title ── */}
      {mode === 'editing' && (
        <div className='flex items-center gap-1 flex-1 min-w-0'>
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => {
              return setEditValue(e.target.value);
            }}
            onKeyDown={handleEditKeyDown}
            disabled={isPending}
            className='flex-1 min-w-0 text-sm bg-transparent outline-none border-b border-border text-foreground'
          />
          <button
            onClick={saveTitle}
            disabled={isPending}
            className='p-0.5 text-primary hover:opacity-70 disabled:opacity-40 cursor-pointer disabled:cursor-default'
            aria-label='Save'
          >
            <Check className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={cancelEditing}
            className='p-0.5 text-muted-foreground hover:text-destructive cursor-pointer'
            aria-label='Cancel'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {mode === 'confirming-delete' && (
        <div className='flex items-center gap-1 flex-1 min-w-0'>
          <span className='flex-1 min-w-0 text-xs text-destructive truncate'>
            Delete?
          </span>
          <button
            onClick={confirmDelete}
            disabled={isPending}
            className='p-0.5 text-destructive hover:opacity-70 disabled:opacity-40 cursor-pointer disabled:cursor-default'
            aria-label='Confirm delete'
          >
            <Check className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={cancelDelete}
            className='p-0.5 text-muted-foreground hover:text-foreground cursor-pointer'
            aria-label='Cancel delete'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        </div>
      )}

      {/* ── Idle ── */}
      {mode === 'idle' && (
        <>
          <Link
            href={href}
            className='flex-1 min-w-0 text-sm text-foreground truncate'
          >
            {displayTitle}
          </Link>
          <div className='hidden group-hover:flex items-center gap-0.5 flex-shrink-0'>
            <button
              onClick={startEditing}
              className='p-0.5 text-muted-foreground hover:text-primary cursor-pointer'
              aria-label='Edit title'
            >
              <Pencil className='w-3.5 h-3.5' />
            </button>
            <button
              onClick={handleDeleteClick}
              className='p-0.5 text-muted-foreground hover:text-destructive cursor-pointer'
              aria-label='Delete chat'
            >
              <Trash2 className='w-3.5 h-3.5' />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
