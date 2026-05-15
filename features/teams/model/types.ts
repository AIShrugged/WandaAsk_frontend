export type {
  TeamProps,
  TeamCreateDTO,
  TeamAddMemberDTO,
  TeamActionType,
} from '@/entities/team';

import type { TelegramChatRegistration } from '@/entities/telegram';

export interface TeamNotificationSetting {
  id: number;
  team_id: number;
  event_type: string;
  channel_type: string;
  notifiable: {
    type: string;
    id: number;
    data: TelegramChatRegistration | null;
  } | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamNotificationSettingCreateDTO {
  event_type: string;
  channel_type: string;
  telegram_chat_registration_id?: number | null;
  enabled?: boolean;
}
