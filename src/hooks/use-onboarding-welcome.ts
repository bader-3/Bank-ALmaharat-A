"use client";

import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import { ROUTES } from "@/lib/constants";
import {
  readWelcomeShownStore,
  writeWelcomeShownStore,
} from "@/lib/onboarding/storage";
import { useAuth } from "@/providers/auth-provider";
import { useCallback, useEffect, useState } from "react";

export type OnboardingWelcomeBubble = {
  text: string;
  href: string;
  ctaLabel: string;
};

const WELCOME_TEXT =
  "أنا نور، هنا لمساعدتك. خلّنا نستكشف المنصة سوا — ابدأ من الدورات أو اسألني في أي وقت.";

function hasShownWelcome(userId: string): boolean {
  return Boolean(readWelcomeShownStore()[userId]);
}

function markWelcomeShown(userId: string) {
  const store = readWelcomeShownStore();
  store[userId] = true;
  writeWelcomeShownStore(store);
}

/**
 * فقاعة ترحيب مرة واحدة بعد إكمال المقابلة.
 * تظهر لأول مستخدم مكتمل المقابلة لم تُعرض له بعد (تخزين دائم لكل userId).
 */
export function useOnboardingWelcome() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [welcome, setWelcome] = useState<OnboardingWelcomeBubble | null>(null);

  const dismiss = useCallback(() => {
    if (user) {
      markWelcomeShown(user.id);
    }
    setWelcome(null);
  }, [user]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) {
      setWelcome(null);
      return;
    }

    if (!isInterviewCompleteForUser(user) || hasShownWelcome(user.id)) {
      setWelcome(null);
      return;
    }

    setWelcome({
      text: WELCOME_TEXT,
      href: ROUTES.courses,
      ctaLabel: "يلا نبدأ",
    });
  }, [isAuthenticated, isLoading, user]);

  return { welcome, dismiss };
}
