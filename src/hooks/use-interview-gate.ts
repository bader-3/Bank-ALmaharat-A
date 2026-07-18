"use client";

import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import { useAuth } from "@/providers/auth-provider";

/**
 * AppRouteGate already enforces login + interview unlock for (app) routes.
 * This hook exposes the authenticated user for screens that need it.
 */
export function useInterviewGate() {
  const { user, isLoading: authLoading } = useAuth();
  const interviewComplete = user ? isInterviewCompleteForUser(user) : false;
  const interviewReady = Boolean(user) && !authLoading && interviewComplete;

  return {
    user,
    authLoading,
    interviewReady,
    isInterviewComplete: interviewComplete,
  };
}
