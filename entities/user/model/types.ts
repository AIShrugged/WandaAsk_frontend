export interface UserProps {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly email_verified_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly is_demo: boolean;
  readonly onboarding_completed?: boolean;
  readonly onboarding_last_step?: number;
}

/** Minimal user shape returned by UserResource (id/name/email only) */
export interface UserBasicProps {
  id: number;
  name: string;
  email: string;
}
