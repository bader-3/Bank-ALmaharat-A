"use client";

import { LearningPlanCard } from "@/components/ai/learning-plan-card";
import { ApprovedPathCard } from "@/components/path/approved-path-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconPath, IconSparkle } from "@/components/ui/icons";
import { useInterviewGate } from "@/hooks/use-interview-gate";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { ROUTES } from "@/lib/constants";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { loadPlanningSessionLocalFirst } from "@/lib/noor/load-planning-session";
import { getGoalsService } from "@/services/goals";
import { getInterviewService } from "@/services/interview";
import { getLearningService } from "@/services/learning";
import type { Enrollment } from "@/types/learning";
import type { LearningProfile } from "@/types/interview";
import type { GoalPlan } from "@/types/goals";
import type { PlanningSession } from "@/types/noor";
import { useCallback, useEffect, useMemo, useState } from "react";

export function PathScreen() {
  const { user, authLoading, interviewReady } = useInterviewGate();
  const { isAuthenticated } = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<PlanningSession | null>(null);
  const [goalPlan, setGoalPlan] = useState<GoalPlan>({ goals: [] });
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [planningSession, plan, userProfile, userEnrollments] = await Promise.all([
      loadPlanningSessionLocalFirst(user.id),
      getGoalsService().getPlan(user.id, false),
      getInterviewService().getProfile(user.id),
      getLearningService().getEnrollments(user.id),
    ]);
    setSession(planningSession?.status === "accepted" ? planningSession : null);
    setGoalPlan(plan);
    setProfile(userProfile);
    setEnrollments(userEnrollments);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!interviewReady || !user) return;
    void load();
  }, [interviewReady, user, load]);

  const aiGoalsByCourse = useMemo(() => {
    const aiGoals = goalPlan.goals.filter((g) => g.source === "ai" && g.courseSlug);
    const map = new Map<string, typeof aiGoals>();
    aiGoals.forEach((goal) => {
      const slug = goal.courseSlug!;
      const list = map.get(slug) ?? [];
      list.push(goal);
      map.set(slug, list);
    });
    return map;
  }, [goalPlan.goals]);

  if (authLoading || !isAuthenticated || !user || !interviewReady || loading) {
    return (
      <Container className="py-24">
        <p className="type-body text-center text-foreground-muted">جاري تحميل مسارك…</p>
      </Container>
    );
  }

  const hasAcceptedGoals = Boolean(goalPlan.acceptedPlanKey && goalPlan.goals.length);

  return (
    <Container className="py-10 lg:py-14">
      <div>
        <div className="flex items-center gap-2">
          <IconPath size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">خطتك المعتمدة</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">مساري</h1>
        <p className="mt-2 max-w-2xl text-pretty text-foreground-secondary">
          دوراتك وترتيبها وتقدّمك — من المقابلة مع نور أو الخطة التي اعتمدتها.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {session?.draft ? (
          <ApprovedPathCard session={session} enrollments={enrollments} />
        ) : hasAcceptedGoals ? (
          <Card padding="lg">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="sage">أهداف من الخطة</Badge>
              {goalPlan.acceptedAt && (
                <span className="text-xs text-foreground-muted">
                  اعتُمدت {new Date(goalPlan.acceptedAt).toLocaleDateString("ar-SA")}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-navy-900">مسارك الحالي</h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              {goalPlan.goals.filter((g) => g.completedAt).length} من {goalPlan.goals.length} هدف
              مكتمل
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {[...aiGoalsByCourse.entries()].map(([slug, goals], index) => {
                const course = getCourseBySlug(slug);
                const enrollment = enrollments.find((e) => e.courseSlug === slug);
                const done = goals.filter((g) => g.completedAt).length;
                return (
                  <li
                    key={slug}
                    className="rounded-xl border border-border/60 bg-surface p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-bold text-sage-700">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-navy-900">
                          {course?.title ?? slug}
                        </p>
                        <p className="mt-1 text-xs text-foreground-muted">
                          {done}/{goals.length} هدف ·{" "}
                          {enrollment ? `${enrollment.progress}٪ تقدّم` : "لم تبدأ بعد"}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href={ROUTES.goals} size="sm">
                أهدافي اليومية
              </Button>
              <Button href={ROUTES.noor} variant="secondary" size="sm">
                بناء مسار جديد مع نور
              </Button>
            </div>
          </Card>
        ) : profile?.learningPlan ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground-secondary">
              لديك خطة من المقابلة الذكية — اعتمدها لتفعيل مسارك وأهدافك اليومية.
            </p>
            <LearningPlanCard plan={profile.learningPlan} />
          </div>
        ) : (
          <Card padding="lg" className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500/15 text-sage-600">
              <IconSparkle size={24} />
            </span>
            <h2 className="mt-5 text-lg font-semibold text-navy-900">لا يوجد مسار معتمد بعد</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground-secondary">
              أكمل المقابلة الذكية أو اطلب من نور بناء خطة، ثم اعتمدها لتظهر هنا.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button href={ROUTES.noor}>ابدأ مع نور</Button>
              <Button href={ROUTES.courses} variant="secondary">
                استكشف الدورات
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}
