/** Matches backend SourceResource */
export interface Source {
  readonly id: number;
  readonly user_id: number;
  readonly external_id: string;
  readonly identity: string;
  readonly type: string;
  readonly auth_type: string;
  /** Backend returns "0" or "1" as a string. Use isSourceConnected() to check. */
  readonly is_connected: '0' | '1' | boolean;
  readonly detached_at: string | null;
}
