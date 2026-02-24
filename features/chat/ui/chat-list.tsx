'use client';

import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { toast } from 'react-toastify';

import { createChat, getChats } from '@/features/chat/api/chats';
import { ChatListItem } from '@/features/chat/ui/chat-list-item';
import { ROUTES } from '@/shared/lib/routes';

import type { Chat } from '@/features/chat/types';

interface ChatListProps {
  initialChats: Chat[];
  totalCount: number;
  activeChatId?: number;
}

const PAGE_SIZE = 20;

export function ChatList({
  initialChats,
  totalCount,
  activeChatId,
}: ChatListProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [offset, setOffset] = useState(initialChats.length);
  const [hasMore, setHasMore] = useState(initialChats.length < totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, startCreateTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const { chats: more, totalCount: total } = await getChats(
        offset,
        PAGE_SIZE,
      );
      setChats(prev => [...prev, ...more]);
      setOffset(prev => prev + more.length);
      setHasMore(offset + more.length < total);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) void loadMore();
      },
      { rootMargin: '20px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const handleCreateChat = () => {
    startCreateTransition(async () => {
      try {
        const chat = await createChat(null);
        setChats(prev => [chat, ...prev]);
        router.push(`${ROUTES.DASHBOARD.CHAT}/${chat.id}`);
      } catch (error) {
        toast.error((error as Error).message);
      }
    });
  };

  const handleUpdate = (updated: Chat) => {
    setChats(prev => prev.map(c => (c.id === updated.id ? updated : c)));
  };

  return (
    <div className='flex flex-col h-full w-[260px] flex-shrink-0 border-r border-border bg-sidebar'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-border'>
        <span className='text-sm font-semibold text-foreground'>Chats</span>
        <button
          onClick={handleCreateChat}
          disabled={isCreating}
          className='flex items-center gap-1 text-xs text-primary hover:opacity-70 disabled:opacity-40 transition-opacity'
          aria-label='New chat'
        >
          {isCreating ? (
            <Loader2 className='w-3.5 h-3.5 animate-spin' />
          ) : (
            <Plus className='w-3.5 h-3.5' />
          )}
          New
        </button>
      </div>

      {/* List */}
      <div className='flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5'>
        {chats.length === 0 && !isLoading && (
          <p className='text-xs text-muted-foreground text-center py-8'>
            No chats yet. Create your first one!
          </p>
        )}

        {chats.map(chat => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={chat.id === activeChatId}
            onUpdate={handleUpdate}
          />
        ))}

        {/* Bottom sentinel for pagination */}
        <div ref={sentinelRef} />

        {isLoading && (
          <div className='flex justify-center py-2'>
            <Loader2 className='w-4 h-4 text-primary animate-spin' />
          </div>
        )}
      </div>
    </div>
  );
}
