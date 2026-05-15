export interface TelegramWorkspaceChatCreatePayload {
  telegram_chat_id: number;
  organization_id: number;
  team_id: number | null;
  name: string | null;
}
