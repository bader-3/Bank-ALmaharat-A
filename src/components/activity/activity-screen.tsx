"use client";

import { EnrollmentList } from "@/components/learning/enrollment-list";
import { ReviewSessionList } from "@/components/review/review-session-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconArrow, IconBook, IconCheck, IconSparkle } from "@/components/ui/icons";
import { useInterviewGate } from "@/hooks/use-interview-gate";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { ROUTES } from "@/lib/constants";
import { getLearningService } from "@/services/learning";
import { getReviewService } from "@/services/review";
import type { Enrollment } from "@/types/learning";
import type { LessonReviewSession } from "@/types/review";
import { useCallback, useEffect, useMemo, useState } from "react";

export function ActivityScreen() {
  const { user, authLoading, interviewReady } = useInterviewGate();
  const { isAuthenticated } = useRequireAuth();
  const learning = useMemo(() => getLearningService(), []);
  const reviewService = useMemo(() => getReviewService(), []);
  const [inProgress, setInProgress] = useState<Enrollment[]>([]);
  const [completed, setCompleted] = useState<Enrollment[]>([]);
  const [reviewSessions, setReviewSessions] = useState<LessonReviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [enrollments, sessions] = await Promise.all([
      learning.getEnrollments(user.id),
      reviewService.listSessions(user.id),
    ]);
    setInProgress(
      enrollments
        .filter((e) => e.progress < 100)
        .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt)),
    );
    setCompleted(
      enrollments
        .filter((e) => e.progress >= 100)
        .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt)),
    );
    setReviewSessions(sessions);
    setLoading(false);
  }, [user, learning, reviewService]);

  useEffect(() => {
    if (!interviewReady || !user) return;
    void load();
  }, [interviewReady, user, load]);

  if (authLoading || !isAuthenticated || !user || !interviewReady || loading) {
    return (
      <Container className="py-24">
        <p className="type-body text-center text-foreground-muted">جاري تحميل سجل التعلّم…</p>
      </Container>
    );
  }

  const isEmpty =
    inProgress.length === 0 && completed.length === 0 && reviewSessions.length === 0;
  const pendingReviews = reviewSessions.filter((s) => s.status === "in_progress");
  const doneReviews = reviewSessions.filter((s) => s.status !== "in_progress");

  return (
    <Container className="py-10 lg:py-14">
      <div>
        <div className="flex items-center gap-2">
          <IconBook size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">رحلتك التعليمية</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">سجل التعلّم</h1>
        <p className="mt-2 max-w-2xl text-pretty text-foreground-secondary">
          الدورات التي تتعلّمها، جلسات مراجعة نور بعد كل درس، والدورات المنجزة.
        </p>
      </div>

      {isEmpty ? (
        <Card padding="lg" className="mt-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500/15 text-sage-600">
            <IconSparkle size={24} />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-navy-900">لا يوجد سجل تعلّم بعد</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground-secondary">
            اشترِ ساعات في محفظتك، جرّب درسًا من أي دورة، وستظهر تقدّمك هنا.
          </p>
          <Button href={ROUTES.courses} size="lg" className="mt-6">
            استكشف الدورات
            <IconArrow />
          </Button>
        </Card>
      ) : (
        <div className="mt-8 space-y-10">
          {pendingReviews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-navy-900">جلسات مراجعة معلّقة</h2>
              <p className="mt-1 text-sm text-foreground-secondary">
                أكملت دروسًا ولم تنهِ جلسة المراجعة بعد.
              </p>
              <div className="mt-4">
                <ReviewSessionList sessions={pendingReviews} />
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-navy-900">قيد التعلّم</h2>
            {inProgress.length ? (
              <div className="mt-4">
                <EnrollmentList enrollments={inProgress} completed={false} />
              </div>
            ) : (
              <Card padding="md" className="mt-4">
                <p className="text-sm text-foreground-secondary">لا توجد دورات قيد التعلّم حاليًا.</p>
              </Card>
            )}
          </section>

          {doneReviews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-navy-900">جلسات مراجعة سابقة</h2>
              <div className="mt-4">
                <ReviewSessionList sessions={doneReviews} />
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2">
              <IconCheck size={18} className="text-sage-600" />
              <h2 className="text-lg font-semibold text-navy-900">منجزة</h2>
            </div>
            {completed.length ? (
              <div className="mt-4">
                <EnrollmentList enrollments={completed} completed />
              </div>
            ) : (
              <Card padding="md" className="mt-4">
                <p className="text-sm text-foreground-secondary">لم تُكمل أي دورة بعد.</p>
              </Card>
            )}
          </section>
        </div>
      )}
    </Container>
  );
}
