"use client";

import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
}

export function useGuestOnly(redirectTo?: string) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const destination =
      redirectTo ??
      (isInterviewCompleteForUser(user) ? ROUTES.platformHome : ROUTES.welcome);
    router.replace(destination);
  }, [isAuthenticated, isLoading, redirectTo, router, user]);

  return { isAuthenticated, isLoading };
}
