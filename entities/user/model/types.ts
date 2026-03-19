export interface UserProps {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly email_verified_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly is_demo: boolean;
}
