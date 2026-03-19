/** Matches backend SourceResource */
export interface Source {
  readonly id: number;
  readonly user_id: number;
  readonly external_id: string;
  readonly identity: string;
  readonly type: string;
  readonly auth_type: string;
  readonly is_connected: boolean;
}
