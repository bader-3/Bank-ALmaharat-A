"use client";

import { useAuth } from "@/providers/auth-provider";
import { ROUTES } from "@/lib/constants";

export function usePrimaryCta() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return { href: ROUTES.register, label: "ابدأ رحلتك", ready: false };
  }

  if (!isAuthenticated) {
    return { href: ROUTES.register, label: "ابدأ رحلتك", ready: true };
  }

  if (!user?.interviewCompleted) {
    return { href: ROUTES.interview, label: "أكمل ملفك", ready: true };
  }

  return { href: ROUTES.account, label: "حسابي", ready: true };
}
