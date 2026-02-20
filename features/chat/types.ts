export interface Chat {
  id: number;
  title: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  content: string;
  created_at: string;
  followup_data: null;
  role: 'user' | 'assistant';
}
