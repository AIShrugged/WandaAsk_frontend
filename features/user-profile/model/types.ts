export interface Identity {
  id: number;
  channel: string;
  channel_identifier: string;
  user_id: number;
}

export interface UserIdentityProps {
  id: number;
  channel: string;
  channel_identifier: string;
  user_id: number;
}

export interface TelegramLinkData {
  link_url: string;
  expires_at: string;
}
