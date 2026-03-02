import { notFound } from 'next/navigation';

import {
  ChatLayout,
  getArtifacts,
  getChats,
  getMessages,
} from '@/features/chat';

import type { PageProps } from '@/shared/types/common';

export default async function ChatRoomPage({ params }: PageProps) {
  const { id } = await params;
  const chatId = Number(id);

  if (!Number.isFinite(chatId) || chatId <= 0) notFound();

  const INITIAL_LIMIT = 20;

  const [{ chats, totalCount }, { messages: oldest, totalCount: msgTotal }, artifacts] =
    await Promise.all([
      getChats(0, 20),
      getMessages(chatId, 0, INITIAL_LIMIT),
      getArtifacts(chatId).catch(() => null),
    ]);

  // API returns messages oldest-first (ASC by created_at).
  // If there are more messages than INITIAL_LIMIT, fetch from the end
  // so the user sees the newest messages on open.
  let initialMessages = oldest;
  let startOffset = 0;
  if (msgTotal > INITIAL_LIMIT) {
    startOffset = msgTotal - INITIAL_LIMIT;
    const { messages: newest } = await getMessages(chatId, startOffset, INITIAL_LIMIT);
    initialMessages = newest;
  }

  return (
    <ChatLayout
      initialChats={chats}
      totalCount={totalCount}
      activeChatId={chatId}
      chatId={chatId}
      initialArtifacts={artifacts}
      initialMessages={initialMessages}
      totalMessagesCount={msgTotal}
      startOffset={startOffset}
    />
  );
}
