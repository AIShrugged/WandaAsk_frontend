export interface EventProps {
  id: number;
  platform: string;
  url: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  creator_user_id: number;
  required_bot: boolean;
  has_summary: boolean;
}
