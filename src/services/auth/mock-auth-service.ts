import type { AuthResult, AuthSession, LoginInput, RegisterInput } from "@/types/auth";
import type { AuthService } from "@/services/auth/types";
import {
  clearSession,
  createSessionForUser,
  createUser,
  getUserById,
  persistSession,
  readSession,
  signInOrCreateOAuthUser,
  verifyCredentials,
} from "@/services/auth/mock-storage";
import type { OAuthProvider } from "@/types/auth";
import { mockWriteDelay } from "@/lib/mock-delay";

function toSession(stored: {
  user: {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    provider?: OAuthProvider | "email";
    interviewCompleted?: boolean;
  };
  token: string;
}): AuthSession {
  return {
    user: {
      id: stored.user.id,
      fullName: stored.user.fullName,
      email: stored.user.email,
      createdAt: stored.user.createdAt,
      provider: stored.user.provider,
      interviewCompleted: stored.user.interviewCompleted ?? false,
    },
    token: stored.token,
  };
}

/** Mock auth — swap this implementation for a real API later. */
export class MockAuthService implements AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    await mockWriteDelay(200);

    try {
      const user = createUser({
        fullName: input.fullName,
        email: input.email,
        password: input.password,
      });
      const session = createSessionForUser(user);
      return { success: true, data: toSession(session) };
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_EXISTS") {
        return { success: false, error: "هذا البريد الإلكتروني مسجّل مسبقًا" };
      }
      return { success: false, error: "تعذّر إنشاء الحساب. حاول مرة أخرى." };
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    await mockWriteDelay(150);

    const user = verifyCredentials(input.email, input.password);
    if (!user) {
      return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }

    const session = createSessionForUser(user);
    return { success: true, data: toSession(session) };
  }

  async signInWithOAuth(provider: OAuthProvider): Promise<AuthResult> {
    await mockWriteDelay(200);

    try {
      const user = signInOrCreateOAuthUser(provider);
      const session = createSessionForUser(user);
      return { success: true, data: toSession(session) };
    } catch {
      return { success: false, error: "تعذّر تسجيل الدخول. حاول مرة أخرى." };
    }
  }

  async logout(): Promise<void> {
    clearSession();
  }

  async getSession(): Promise<AuthSession | null> {
    return this.refreshSession();
  }

  async refreshSession(): Promise<AuthSession | null> {
    const stored = readSession();
    if (!stored) return null;

    const freshUser = getUserById(stored.user.id);
    if (!freshUser) {
      return toSession(stored);
    }

    const interviewCompletedChanged =
      freshUser.interviewCompleted !== stored.user.interviewCompleted;

    const session = { user: freshUser, token: stored.token };

    if (interviewCompletedChanged) {
      persistSession(session);
    }

    return toSession(session);
  }
}

let instance: MockAuthService | null = null;

export function getAuthService(): AuthService {
  if (!instance) instance = new MockAuthService();
  return instance;
}
