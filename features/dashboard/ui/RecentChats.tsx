import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

import { ROUTES } from '@/shared/lib/routes';

import type { Chat } from '@/features/chat';

interface RecentChatsProps {
  chats: Chat[];
}

/**
 * RecentChats component.
 * @param props - Component props.
 * @param props.chats
 * @returns JSX element.
 */
export function RecentChats({ chats }: RecentChatsProps) {
  if (chats.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-muted-foreground gap-2'>
        <MessageSquare className='h-8 w-8 opacity-40' />
        <p className='text-sm'>No chats yet. Start your first conversation!</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col divide-y divide-border'>
      {chats.map((chat) => {
        return (
          <Link
            key={chat.id}
            href={`${ROUTES.DASHBOARD.CHAT}/${chat.id}`}
            className='group flex items-center justify-between gap-3 px-1 py-3 hover:bg-accent/50 rounded-md transition-colors'
          >
            <div className='flex items-center gap-3 min-w-0'>
              <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10'>
                <MessageSquare className='h-3.5 w-3.5 text-primary' />
              </div>
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium text-foreground'>
                  {chat.title ?? 'Untitled chat'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {formatDistanceToNow(new Date(chat.updated_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <ChevronRight className='h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
          </Link>
        );
      })}
    </div>
  );
}
