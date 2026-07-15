"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  IconCheck,
  IconClock,
  IconCompass,
  IconFlame,
  IconTarget,
} from "@/components/ui/icons";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { computeStreak } from "@/lib/goals/streak";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { getAdaptationService } from "@/services/adaptation";
import { getGoalsService, toDateKey } from "@/services/goals";
import { getLearningService } from "@/services/learning";
import type { ProgressSummary } from "@/types/adaptation";
import type { Enrollment } from "@/types/learning";
import type { GoalPlan } from "@/types/goals";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export function ProgressScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isAuthenticated } = useRequireAuth();
  const { stats: walletStats } = useWallet();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<GoalPlan>({ goals: [] });
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);

  const today = toDateKey(new Date());

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [goalPlan, userEnrollments, adaptation] = await Promise.all([
      getGoalsService().getPlan(user.id),
      getLearningService().getEnrollments(user.id),
      getAdaptationService().getState(user.id),
    ]);
    setPlan(goalPlan);
    setEnrollments(userEnrollments);
    setSummary(adaptation.summary);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!user.interviewCompleted) {
      router.replace(ROUTES.interview);
      return;
    }
    void load();
  }, [user, router, load]);

  const streakDays = useMemo(() => computeStreak(plan.goals, today), [plan.goals, today]);
  const todayGoals = plan.goals.filter((g) => g.scheduledDate === today);
  const todayDone = todayGoals.filter((g) => g.completedAt).length;
  const completedCourses = enrollments.filter((e) => e.progress >= 100).length;
  const activeCourses = enrollments.filter((e) => e.progress < 100).length;

  if (authLoading || !isAuthenticated || !user || loading) {
    return (
      <Container className="py-24">
        <p className="type-body text-center text-foreground-muted">جاري تحميل إنجازاتك…</p>
      </Container>
    );
  }

  return (
    <Container className="py-10 lg:py-14">
      <div>
        <div className="flex items-center gap-2">
          <IconFlame size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">تقدّمك واستمرارك</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">إنجازاتي</h1>
        <p className="mt-2 max-w-2xl text-pretty text-foreground-secondary">
          سلسلة إنجازك، أهدافك، ودوراتك المكتملة — تقدّمك التعليمي في مكان واحد.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="سلسلة الإنجاز"
          value={streakDays.toLocaleString("ar-SA")}
          unit={streakDays === 1 ? "يوم" : "أيام"}
          icon={<IconFlame size={20} />}
          accent="orange"
        />
        <MetricCard
          label="أهداف اليوم"
          value={`${todayDone}/${todayGoals.length || 0}`}
          unit="مكتمل"
          icon={<IconTarget size={20} />}
          accent="green"
        />
        <MetricCard
          label="دورات مكتملة"
          value={completedCourses.toLocaleString("ar-SA")}
          unit="دورة"
          icon={<IconCheck size={20} />}
          accent="blue"
        />
        <MetricCard
          label="ساعات تعلّم مستخدمة"
          value={(walletStats?.totalUsed ?? 0).toLocaleString("ar-SA")}
          unit="ساعة"
          icon={<IconClock size={20} />}
          accent="gold"
        />
      </div>

      {summary && (
        <Card padding="md" className="mt-5">
          <h2 className="text-lg font-semibold text-navy-900">ملخّص الالتزام</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="إنجاز الأهداف" value={`${summary.goals.percent}٪`} />
            <MiniStat label="الدروس المخططة" value={`${summary.lessons.percent}٪`} />
            <MiniStat label="الالتزام بالخطة" value={`${summary.adherencePercent}٪`} />
            <MiniStat label="دورات قيد التعلّم" value={activeCourses.toLocaleString("ar-SA")} />
          </div>
          {summary.stalledCourses.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-navy-900">دورات تحتاج متابعة</p>
              <ul className="mt-3 space-y-2">
                {summary.stalledCourses.map((item) => (
                  <li
                    key={item.courseSlug}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold-200/60 bg-gold-50/30 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-navy-900">{item.courseTitle}</span>
                    <Badge variant="gold">{item.overdueGoals} هدف متأخر</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <Card padding="md" className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">آخر الإنجازات</h2>
            <p className="mt-1 text-sm text-foreground-secondary">أهداف أكملتها مؤخرًا</p>
          </div>
          <Button href={ROUTES.goals} variant="secondary" size="sm">
            كل الأهداف
          </Button>
        </div>
        <ul className="mt-4 space-y-2">
          {plan.goals
            .filter((g) => g.completedAt)
            .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
            .slice(0, 6)
            .map((goal) => (
              <li
                key={goal.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-900">{goal.title}</p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {goal.completedAt &&
                      new Date(goal.completedAt).toLocaleDateString("ar-SA")}
                    {goal.courseSlug && ` · ${getCourseBySlug(goal.courseSlug)?.title ?? goal.courseSlug}`}
                  </p>
                </div>
                <IconCheck size={16} className="shrink-0 text-sage-600" />
              </li>
            ))}
          {!plan.goals.some((g) => g.completedAt) && (
            <li className="py-6 text-center text-sm text-foreground-muted">
              أكمل هدفًا اليوم ليبدأ سجل إنجازاتك هنا.
            </li>
          )}
        </ul>
      </Card>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button href={ROUTES.path} variant="secondary" size="sm">
          <IconCompass size={16} />
          مساري
        </Button>
        <Button href={ROUTES.activity} variant="secondary" size="sm">
          سجل التعلّم
        </Button>
      </div>
    </Container>
  );
}

type MetricAccent = "gold" | "blue" | "green" | "orange";

const metricStyles: Record<MetricAccent, { card: string; icon: string }> = {
  gold: { card: "border-gold-100 bg-gold-50/60", icon: "bg-gold-100 text-gold-700" },
  blue: { card: "border-accent-blue-100 bg-accent-blue-50/60", icon: "bg-accent-blue-100 text-accent-blue-600" },
  green: { card: "border-sage-100 bg-sage-50/60", icon: "bg-sage-100 text-sage-700" },
  orange: { card: "border-accent-orange-100 bg-accent-orange-50/60", icon: "bg-accent-orange-100 text-accent-orange-600" },
};

function MetricCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  icon: ReactNode;
  accent: MetricAccent;
}) {
  const styles = metricStyles[accent];
  return (
    <Card padding="md" className={styles.card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground-muted">{label}</p>
          <p className="mt-2 text-xl font-bold text-navy-900">
            {value}{" "}
            <span className="text-sm font-normal text-foreground-muted">{unit}</span>
          </p>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", styles.icon)}>
          {icon}
        </span>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background-subtle px-4 py-3">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-navy-900">{value}</p>
    </div>
  );
}
