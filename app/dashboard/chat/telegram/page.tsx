import { getTelegramChats, TelegramChatsManagement } from '@/features/chat';
import { getOrganizations } from '@/features/organization';

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
