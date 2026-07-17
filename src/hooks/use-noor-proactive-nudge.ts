"use client";

import { ROUTES } from "@/lib/constants";
import { toDateKey } from "@/services/goals";
import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import { useAuth } from "@/providers/auth-provider";
import { getGoalsService } from "@/services/goals";
import { getInterviewService } from "@/services/interview";
import { getLearningService } from "@/services/learning";
import { getNoorService } from "@/services/noor";
import { getWalletService } from "@/services/wallet";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type NoorNudgeId =
  | "stale-goals"
  | "no-plan-after-interview"
  | "wallet-idle";

export type NoorProactiveNudge = {
  id: NoorNudgeId;
  text: string;
  href: string;
  ctaLabel: string;
};

const DISMISS_KEY = "asb-noor-nudge-dismissed";

type DismissStore = Record<string, string>; // nudgeId -> YYYY-MM-DD

function readDismissed(): DismissStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(DISMISS_KEY) ?? "{}") as DismissStore;
  } catch {
    return {};
  }
}

function isDismissedToday(nudgeId: NoorNudgeId) {
  const store = readDismissed();
  return store[nudgeId] === toDateKey(new Date());
}

export function dismissNoorNudge(nudgeId: NoorNudgeId) {
  if (typeof window === "undefined") return;
  const store = readDismissed();
  store[nudgeId] = toDateKey(new Date());
  window.localStorage.setItem(DISMISS_KEY, JSON.stringify(store));
}

function daysBetween(earlier: string, later: string) {
  const a = new Date(earlier);
  const b = new Date(later);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * اقتراحات استباقية غير مزعجة بجانب زر نور العائم.
 * تُخفى في مسارات الزر المستثناة (يتعامل معها المكوّن الأب).
 */
export function useNoorProactiveNudge() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const [nudge, setNudge] = useState<NoorProactiveNudge | null>(null);

  const refresh = useCallback(async () => {
    if (isLoading || !isAuthenticated || !user) {
      setNudge(null);
      return;
    }
    if (!isInterviewCompleteForUser(user)) {
      setNudge(null);
      return;
    }

    const today = toDateKey(new Date());
    const [goalsPlan, enrollments, wallet, planning, profile] = await Promise.all([
      getGoalsService().getPlan(user.id, false),
      getLearningService().getEnrollments(user.id),
      getWalletService().getStats(user.id),
      getNoorService().getPlanningSession(user.id),
      getInterviewService().getProfile(user.id),
    ]);

    const candidates: NoorProactiveNudge[] = [];

    // توقف عن إنجاز الأهداف لعدة أيام
    const aiGoals = goalsPlan.goals.filter((goal) => goal.source === "ai");
    if (aiGoals.length > 0) {
      const overdueIncomplete = aiGoals.filter(
        (goal) => !goal.completedAt && goal.scheduledDate < today,
      );
      const oldestOverdue = overdueIncomplete
        .map((goal) => goal.scheduledDate)
        .sort()[0];
      if (oldestOverdue && daysBetween(oldestOverdue, today) >= 2 && !isDismissedToday("stale-goals")) {
        candidates.push({
          id: "stale-goals",
          text: "لاحظت أهدافًا متأخرة — أساعدك تعيد ترتيب يومك؟",
          href: ROUTES.goals,
          ctaLabel: "افتح",
        });
      }
    }

    // أنهى المقابلة ولم يبدأ خطة بعد
    const hasAcceptedPlan =
      planning?.status === "accepted" || Boolean(goalsPlan.acceptedPlanKey);
    if (
      profile &&
      !hasAcceptedPlan &&
      !isDismissedToday("no-plan-after-interview")
    ) {
      candidates.push({
        id: "no-plan-after-interview",
        text: "ملفك جاهز — نبني معًا خطة تعلّم مناسبة؟",
        href: ROUTES.noor,
        ctaLabel: "افتح",
      });
    }

    // رصيد محفظة كافٍ بدون شراء دورة
    if (
      wallet.balance >= 1 &&
      enrollments.every((item) => item.purchasedLessons.length === 0) &&
      enrollments.length === 0 &&
      !isDismissedToday("wallet-idle")
    ) {
      candidates.push({
        id: "wallet-idle",
        text: "عندك ساعات في المحفظة — نختار دورة مناسبة معًا؟",
        href: ROUTES.courses,
        ctaLabel: "افتح",
      });
    }

    // أولوية: أهداف متأخرة ثم خطة ثم محفظة
    setNudge(candidates[0] ?? null);
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  const dismiss = useCallback(() => {
    if (!nudge) return;
    dismissNoorNudge(nudge.id);
    setNudge(null);
  }, [nudge]);

  return { nudge, dismiss, refresh };
}
