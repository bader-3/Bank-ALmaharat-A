"use client";

import { getAuthService } from "@/services/auth";
import type { AuthSession, LoginInput, OAuthProvider, RegisterInput, User } from "@/types/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  login: (input: LoginInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithGoogle: () => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithApple: () => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useMemo(() => getAuthService(), []);

  useEffect(() => {
    let active = true;

    auth.getSession().then((current) => {
      if (active) {
        setSession(current);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [auth]);

  const refreshSession = useCallback(async () => {
    const current = await auth.refreshSession();
    setSession(current);
  }, [auth]);

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await auth.register(input);
      if (!result.success) return { ok: false as const, error: result.error };
      setSession(result.data);
      return { ok: true as const };
    },
    [auth],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await auth.login(input);
      if (!result.success) return { ok: false as const, error: result.error };
      setSession(result.data);
      return { ok: true as const };
    },
    [auth],
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      const result = await auth.signInWithOAuth(provider);
      if (!result.success) return { ok: false as const, error: result.error };
      setSession(result.data);
      return { ok: true as const };
    },
    [auth],
  );

  const signInWithGoogle = useCallback(() => signInWithOAuth("google"), [signInWithOAuth]);
  const signInWithApple = useCallback(() => signInWithOAuth("apple"), [signInWithOAuth]);

  const logout = useCallback(async () => {
    await auth.logout();
    setSession(null);
  }, [auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: Boolean(session?.user),
      register,
      login,
      signInWithGoogle,
      signInWithApple,
      logout,
      refreshSession,
    }),
    [session, isLoading, register, login, signInWithGoogle, signInWithApple, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
