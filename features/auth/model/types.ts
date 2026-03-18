export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  token: string;
  email_verification_sent: boolean;
  invite_accepted?: true;
  team_id?: number | null;
  organization_id?: number | null;
}

export interface LoginResponse {
  token: string;
}
