/** Single chat conversation as returned by GET /api/v1/chats and related endpoints */
export interface Chat {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

/** A single message within a chat as returned by the messages sub-resource */
export interface Message {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  /** Present in some response variants; not part of the core API spec */
  followup_data?: unknown;
}

/** Envelope returned by paginated list endpoints */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  message: string;
  status: number;
  /** Total item count comes from the Items-Count response header */
  meta?: Record<string, unknown>;
}

/** Envelope returned by single-resource endpoints */
export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message: string;
  status: number;
}
