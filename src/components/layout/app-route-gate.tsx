"use client";

import { Container } from "@/components/ui/container";
import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * App shell access:
 * - Guests → login
 * - Logged in without platform unlock → interview
 * - Unlocked → full platform
 */
export function AppRouteGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const userId = user?.id;
  const unlocked = user ? isInterviewCompleteForUser(user) : false;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !userId) {
      router.replace(ROUTES.login);
      return;
    }

    if (!unlocked) {
      router.replace(ROUTES.interview);
    }
  }, [isAuthenticated, isLoading, router, unlocked, userId]);

  if (isLoading) {
    return (
      <Container className="flex min-h-screen items-center justify-center py-24">
        <p className="text-foreground-muted">جاري تحميل حسابك…</p>
      </Container>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Container className="flex min-h-screen items-center justify-center py-24">
        <p className="text-foreground-muted">جاري التحويل لتسجيل الدخول…</p>
      </Container>
    );
  }

  if (!unlocked) {
    return (
      <Container className="flex min-h-screen items-center justify-center py-24">
        <p className="text-foreground-muted">أكمل المقابلة أولًا لفتح المنصة…</p>
      </Container>
    );
  }

  return children;
}
