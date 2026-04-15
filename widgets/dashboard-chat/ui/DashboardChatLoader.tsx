import { getChats } from '@/features/chat/api/chats';
import { getMessages } from '@/features/chat/api/messages';
import { DashboardChatPanel } from '@/widgets/dashboard-chat/ui/DashboardChatPanel';

import type { Message } from '@/features/chat/types';

const INITIAL_MESSAGES_LIMIT = 20;

/**
 * DashboardChatLoader — server component that fetches initial chat data
 * and renders the DashboardChatPanel client component.
 * @returns JSX element.
 */
export async function DashboardChatLoader() {
  const { chats } = await getChats(0, 20);

  const firstChat = chats[0] ?? null;
  let initialMessages: Message[] = [];
  let totalMessagesCount = 0;
  let startOffset = 0;

  if (firstChat) {
    try {
      const { messages: oldest, totalCount: msgTotal } = await getMessages(
        firstChat.id,
        0,
        INITIAL_MESSAGES_LIMIT,
      );

      totalMessagesCount = msgTotal;

      if (msgTotal > INITIAL_MESSAGES_LIMIT) {
        startOffset = msgTotal - INITIAL_MESSAGES_LIMIT;
        const { messages: newest } = await getMessages(
          firstChat.id,
          startOffset,
          INITIAL_MESSAGES_LIMIT,
        );

        initialMessages = newest;
      } else {
        initialMessages = oldest;
      }
    } catch {
      // silently fail — panel will show empty state
    }
  }

  return (
    <DashboardChatPanel
      initialChat={firstChat}
      initialMessages={initialMessages}
      totalMessagesCount={totalMessagesCount}
      startOffset={startOffset}
    />
  );
}
