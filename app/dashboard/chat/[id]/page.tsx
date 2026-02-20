import { notFound } from 'next/navigation';

import { getChats, getMessages, ChatList, ChatWindow } from '@/features/chat';

import type { PageProps } from '@/shared/types/common';

export default async function ChatRoomPage({ params }: PageProps) {
  const { id } = await params;
  const chatId = Number(id);

  if (!Number.isFinite(chatId) || chatId <= 0) notFound();

  const [{ chats, totalCount }, { messages, totalCount: msgTotal }] =
    await Promise.all([
      getChats(0, 20),
      getMessages(chatId, 0, 50),
    ]);

  // The API returns messages newest-first; reverse to show oldest at top
  const chronological = messages.toReversed();

  return (
    <div className='flex h-full rounded-2xl overflow-hidden border-primary bg-white shadow-primary'>
      <ChatList
        initialChats={chats}
        totalCount={totalCount}
        activeChatId={chatId}
      />

      <ChatWindow
        chatId={chatId}
        initialMessages={chronological}
        totalCount={msgTotal}
      />
    </div>
  );
}
