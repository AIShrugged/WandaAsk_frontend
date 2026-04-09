export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  status?: number;
  message?: string;
}

export interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export type RequestID = string | null;

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
}
