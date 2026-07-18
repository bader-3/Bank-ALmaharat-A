"use client";

import { getAuthService } from "@/services/auth";
import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import type { AuthSession, LoginInput, OAuthProvider, RegisterInput, User } from "@/types/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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

function sessionsEqual(a: AuthSession | null, b: AuthSession | null) {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.token === b.token &&
    a.user.id === b.user.id &&
    a.user.email === b.user.email &&
    a.user.fullName === b.user.fullName &&
    a.user.createdAt === b.user.createdAt &&
    a.user.provider === b.user.provider &&
    a.user.interviewCompleted === b.user.interviewCompleted
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = useMemo(() => getAuthService(), []);

  useLayoutEffect(() => {
    let active = true;

    void auth
      .getSession()
      .then((current) => {
        if (!active) return;
        setSession(current);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
      })
      .finally(() => {
        // Only finish loading for the active effect — Strict Mode cleanup
        // must not flip isLoading=false while session is still null.
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [auth]);

  const refreshSession = useCallback(async () => {
    const current = await auth.refreshSession();
    setSession((prev) => {
      if (!current) return null;
      if (prev?.user.interviewCompleted !== current.user.interviewCompleted) {
        return current;
      }
      return sessionsEqual(prev, current) ? prev : current;
    });
  }, [auth]);

  useEffect(() => {
    function resyncSession() {
      if (document.visibilityState === "visible") {
        void refreshSession();
      }
    }

    window.addEventListener("focus", resyncSession);
    document.addEventListener("visibilitychange", resyncSession);
    return () => {
      window.removeEventListener("focus", resyncSession);
      document.removeEventListener("visibilitychange", resyncSession);
    };
  }, [refreshSession]);

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

  const resolvedUser = useMemo(() => {
    if (!session?.user) return null;
    return {
      ...session.user,
      interviewCompleted: isInterviewCompleteForUser(session.user),
    };
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: resolvedUser,
      isLoading,
      isAuthenticated: Boolean(resolvedUser),
      register,
      login,
      signInWithGoogle,
      signInWithApple,
      logout,
      refreshSession,
    }),
    [resolvedUser, isLoading, register, login, signInWithGoogle, signInWithApple, logout, refreshSession],
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
