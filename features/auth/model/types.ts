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
  success: boolean;
  user: {
    token: string;
  };
}
