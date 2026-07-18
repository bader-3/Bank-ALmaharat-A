"use client";

import { routeKeyFromPath, type PageKey } from "@/lib/ai/arabic-page-labels";
import {
  getPageTourCopy,
  PAGE_TOUR_EXCLUDED_KEYS,
} from "@/lib/onboarding/page-tour-copy";
import {
  readSeenPagesStore,
  writeSeenPagesStore,
} from "@/lib/onboarding/storage";
import { useAuth } from "@/providers/auth-provider";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type PageTourBubble = {
  pageKey: PageKey;
  text: string;
};

function hasSeenPage(userId: string, pageKey: PageKey): boolean {
  const store = readSeenPagesStore();
  return (store[userId] ?? []).includes(pageKey);
}

function markPageSeen(userId: string, pageKey: PageKey) {
  const store = readSeenPagesStore();
  const seen = new Set(store[userId] ?? []);
  seen.add(pageKey);
  store[userId] = Array.from(seen);
  writeSeenPagesStore(store);
}

/**
 * فقاعة جولة تعريفية لكل صفحة — مرة واحدة لكل صفحة لكل مستخدم (تخزين دائم).
 * مهلة الإغلاق التلقائي تُدار من المكوّن العارض حتى لا تُسجَّل مشاهدة
 * والصفحة مخفية خلف فقاعة أعلى أولوية.
 * منفصلة عن use-noor-proactive-nudge.
 */
export function usePageTourBubble() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [tour, setTour] = useState<PageTourBubble | null>(null);

  const dismiss = useCallback(() => {
    if (!user || !tour) {
      setTour(null);
      return;
    }
    markPageSeen(user.id, tour.pageKey);
    setTour(null);
  }, [tour, user]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) {
      setTour(null);
      return;
    }

    const pageKey = routeKeyFromPath(pathname);
    if (!pageKey || PAGE_TOUR_EXCLUDED_KEYS.has(pageKey)) {
      setTour(null);
      return;
    }

    const text = getPageTourCopy(pageKey);
    if (!text || hasSeenPage(user.id, pageKey)) {
      setTour(null);
      return;
    }

    setTour({ pageKey, text });
  }, [isAuthenticated, isLoading, pathname, user]);

  return { tour, dismiss };
}
