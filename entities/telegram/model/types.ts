export interface TelegramChatRegistration {
  id: number;
  channel_conversation_id: string | null;
  user_id: number | null;
  telegram_chat_id: string | number;
  message_thread_id: string | number | null;
  chat_type: string | null;
  chat_title: string | null;
  organization_id: number | null;
  team_id: number | null;
  attach_code: string | null;
  attach_command: string | null;
  attach_code_expires_at: string | null;
  attach_code_used_at: string | null;
  bound_at: string | null;
  created_at: string;
  updated_at: string;
}
