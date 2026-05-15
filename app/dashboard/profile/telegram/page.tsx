import { getOrganizations } from '@/features/organization';
import { TelegramChatsManagement } from '@/features/telegram';
import { getTelegramChats } from '@/features/telegram/api/telegram';

export default async function TelegramPage() {
  const [{ data: chats }, { data: organizations }] = await Promise.all([
    getTelegramChats(),
    getOrganizations(),
  ]);

  return (
    <TelegramChatsManagement
      initialChats={chats ?? []}
      organizations={organizations ?? []}
    />
  );
}
