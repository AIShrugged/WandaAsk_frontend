import { getTelegramChats } from '@/features/chat';
import { TelegramChatsManagement } from '@/features/chat/ui/telegram-chats-management';
import { getOrganizations } from '@/features/organization/api/organization';

/**
 * TelegramChatsPage component.
 * @returns JSX element.
 */
export default async function TelegramChatsPage() {
  const [telegramChats, { data: organizations }] = await Promise.all([
    getTelegramChats(),
    getOrganizations(),
  ]);

  return (
    <TelegramChatsManagement
      initialChats={telegramChats}
      organizations={organizations ?? []}
    />
  );
}
