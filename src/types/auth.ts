export type OAuthProvider = "google" | "apple";

export type User = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  provider?: OAuthProvider | "email";
  interviewCompleted: boolean;
};

export type AuthSession = {
  user: User;
  token: string;
};

export type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult<T = AuthSession> =
  | { success: true; data: T }
  | { success: false; error: string };
