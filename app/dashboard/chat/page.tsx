import { MessageSquare } from 'lucide-react';

import { getChats, ChatList } from '@/features/chat';

/**
 * ChatPage component.
 */
export default async function ChatPage() {
  const { chats, totalCount } = await getChats(0, 20);

  return (
    <div className='flex h-full rounded-[var(--radius-card)] overflow-hidden border border-border bg-card shadow-card'>
      <ChatList initialChats={chats} totalCount={totalCount} />

      {/* Empty state */}
      <div className='flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground'>
        <MessageSquare className='w-12 h-12 text-muted-foreground/40' />
        <p className='text-sm'>Select a chat or create a new one</p>
      </div>
    </div>
  );
}
