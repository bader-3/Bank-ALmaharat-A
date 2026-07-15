"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconArrow } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import {
  canCompleteLesson,
  canPurchaseLesson,
  formatLessonHours,
  getLessonHours,
  getLessonsForCourse,
  isLessonPurchased,
} from "@/lib/learning/lessons";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes, hasEnoughHours } from "@/lib/format/duration";
import { getCourseBySlug, getTrainerById } from "@/lib/courses/mock-data";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { getLearningService } from "@/services/learning";
import type { Enrollment } from "@/types/learning";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface LearnScreenProps {
  slug: string;
}

export function LearnScreen({ slug }: LearnScreenProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { balance, refreshWallet } = useWallet();
  useRequireAuth();

  const [enrollment, setEnrollment] = useState<Enrollment | null | undefined>(undefined);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [purchaseModal, setPurchaseModal] = useState<{
    lessonId: string;
    title: string;
    hours: number;
  } | null>(null);

  const course = getCourseBySlug(slug);

  const loadEnrollment = useCallback(async () => {
    if (!user) return;
    const data = await getLearningService().getEnrollment(user.id, slug);
    setEnrollment(data);
  }, [user, slug]);

  useEffect(() => {
    if (!user) return;
    if (!user.interviewCompleted) {
      router.replace(ROUTES.interview);
      return;
    }
    void loadEnrollment();
  }, [user, router, loadEnrollment]);

  if (!course) notFound();

  if (isLoading || !user || enrollment === undefined) {
    return (
      <Container className="py-24">
        <p className="type-body text-center text-foreground-muted">جاري التحميل…</p>
      </Container>
    );
  }

  if (!enrollment) {
    return (
      <Container className="py-16">
        <Card padding="lg" className="mx-auto max-w-lg text-center">
          <p className="type-body text-foreground-secondary">
            لم تشتري أي درس من هذه الدورة بعد. اشترِ الدرس الأول من صفحة الدورة.
          </p>
          <Button href={`${ROUTES.courses}/${slug}`} size="lg" className="mt-6">
            الذهاب للدورة
          </Button>
        </Card>
      </Container>
    );
  }

  const lessons = getLessonsForCourse(course);
  const activeLesson =
    lessons.find(
      (lesson) =>
        isLessonPurchased(enrollment, lesson.id) &&
        !enrollment.completedLessons.includes(lesson.id),
    ) ?? lessons.find((lesson) => isLessonPurchased(enrollment, lesson.id)) ?? lessons[0];
  const trainer = getTrainerById(course.trainerId);

  async function handleCompleteLesson(lessonId: string) {
    if (!user || !enrollment || !canCompleteLesson(enrollment, lessons, lessonId)) return;
    setCompletingId(lessonId);
    const updated = await getLearningService().completeLesson(user.id, slug, lessonId);
    setCompletingId(null);
    if (updated) {
      setEnrollment(updated);
      router.push(ROUTES.review(slug, lessonId));
    }
  }

  function openPurchaseModal(lessonId: string, title: string, hours: number) {
    if (!hasEnoughHours(balance, hours)) {
      setPurchaseModal({ lessonId, title, hours });
      return;
    }
    void handlePurchaseLesson(lessonId);
  }

  async function handlePurchaseLesson(lessonId: string) {
    if (!user) return;
    setPurchasingId(lessonId);
    const result = await getLearningService().purchaseLesson(user.id, slug, lessonId);
    await refreshWallet();
    setPurchasingId(null);
    setPurchaseModal(null);

    if (result.success) {
      setEnrollment(result.enrollment);
      return;
    }

    if (result.code === "NO_BALANCE") {
      const lesson = lessons.find((item) => item.id === lessonId);
      if (lesson) {
        setPurchaseModal({
          lessonId,
          title: lesson.title,
          hours: getLessonHours(lesson),
        });
      }
    }
  }

  return (
    <Container className="py-12 lg:py-16">
      <Link
        href={ROUTES.account}
        className="type-small inline-flex items-center gap-1 text-foreground-secondary transition-colors hover:text-foreground"
      >
        <IconArrow className="rotate-180" />
        العودة للوحة التعلّم
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <Badge variant="sage">جلسة تعلّم</Badge>
          <h1 className="type-section mt-4 text-balance text-foreground">{course.title}</h1>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="type-label text-foreground-muted">تقدّمك</span>
              <span className="type-small tabular-nums">{enrollment.progress}٪</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background-muted">
              <div
                className="h-full rounded-full bg-sage-500 transition-all duration-500"
                style={{ width: `${enrollment.progress}%` }}
              />
            </div>
          </div>

          <ul className="mt-8 space-y-3">
            {lessons.map((lesson) => {
              const purchased = isLessonPurchased(enrollment, lesson.id);
              const done = enrollment.completedLessons.includes(lesson.id);
              const canComplete = canCompleteLesson(enrollment, lessons, lesson.id);
              const canPurchase = canPurchaseLesson(enrollment, lessons, lesson.id);
              const lessonHours = getLessonHours(lesson);

              return (
                <li key={lesson.id}>
                  <Card
                    padding="md"
                    className={cn(
                      "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                      done && "border-sage-200/50 bg-sage-50/30",
                      !purchased && "opacity-80",
                    )}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="type-card-title text-foreground">{lesson.title}</p>
                        {!purchased && <Badge variant="neutral">غير مشترى</Badge>}
                        {purchased && !done && <Badge variant="gold">مشترى</Badge>}
                      </div>
                      <p className="type-small mt-1 text-foreground-muted">
                        {formatLessonHours(lesson, false)}
                      </p>
                    </div>
                    {done ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="sage">مكتمل</Badge>
                        <Button
                          href={ROUTES.review(slug, lesson.id)}
                          size="sm"
                          variant="secondary"
                        >
                          جلسة المراجعة
                        </Button>
                      </div>
                    ) : purchased ? (
                      <Button
                        size="sm"
                        variant={canComplete ? "primary" : "secondary"}
                        disabled={!canComplete || completingId === lesson.id}
                        onClick={() => handleCompleteLesson(lesson.id)}
                      >
                        {completingId === lesson.id ? "…" : canComplete ? "إكمال" : "أكمل السابق"}
                      </Button>
                    ) : canPurchase ? (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={purchasingId === lesson.id}
                        onClick={() => openPurchaseModal(lesson.id, lesson.title, lessonHours)}
                      >
                        {purchasingId === lesson.id
                          ? "…"
                          : `شراء (${formatLessonHours(lesson)})`}
                      </Button>
                    ) : (
                      <Badge variant="neutral">قريبًا</Badge>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>

          {enrollment.progress >= 100 && (
            <Card padding="md" variant="tint" className="mt-8 text-center">
              <p className="type-card-title text-foreground">أكملت هذه الدورة!</p>
              <p className="type-body mt-2 text-foreground-secondary">
                {course.hasCertificate
                  ? "حصلت على الشهادة — استكشف مدربين ودورات أخرى بساعاتك المتبقية."
                  : "أكملت الدورة — استكشف مدربين ودورات أخرى بساعاتك المتبقية."}
              </p>
              <Button href={ROUTES.courses} size="lg" className="mt-5">
                استكشف دورات أخرى
              </Button>
            </Card>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {isLessonPurchased(enrollment, activeLesson.id) && trainer && (
            <Card padding="md" className="space-y-3">
              <p className="type-label text-sage-600">مدرب الدورة</p>
              <Link
                href={ROUTES.trainer(trainer.id)}
                className="type-card-title text-sage-700 transition-colors hover:text-sage-800 hover:underline"
              >
                {trainer.name}
              </Link>
              <p className="type-small text-foreground-secondary">{trainer.title}</p>
              <p className="type-small text-foreground-muted">
                بعد كل درس تُفتح جلسة مراجعة مع نور — أسئلة واختبار قصير.
              </p>
              <Button href={ROUTES.trainer(trainer.id)} variant="secondary" fullWidth size="sm">
                ملف المدرب
              </Button>
              <Button href={ROUTES.activity} variant="ghost" fullWidth size="sm">
                سجل التعلّم
              </Button>
            </Card>
          )}

          <Card padding="lg" className="space-y-4">
            <div>
              <p className="type-label text-foreground-muted">الساعات المستخدمة</p>
              <p className="type-card-title mt-1 text-foreground">
                {formatHoursAndMinutes(enrollment.hoursUsed, true)} من{" "}
                {formatHoursAndMinutes(enrollment.totalHours, true)}
              </p>
            </div>
            <p className="type-small text-foreground-muted">
              تُخصم ساعات كل درس عند شرائه. الشهادة — إن وُجدت — بعد إكمال جميع الدروس.
            </p>
            <Button href={`${ROUTES.courses}/${slug}`} variant="secondary" fullWidth>
              تفاصيل الدورة
            </Button>
          </Card>
        </aside>
      </div>

      <Modal
        isOpen={Boolean(purchaseModal)}
        onClose={() => setPurchaseModal(null)}
        title="محفظتك تحتاج ساعات"
        description={
          purchaseModal
            ? `لشراء «${purchaseModal.title}» تحتاج ${formatHoursAndMinutes(purchaseModal.hours)}. رصيدك ${formatHoursAndMinutes(balance)}.`
            : ""
        }
      >
        <Button
          variant="secondary"
          fullWidth
          href={`${ROUTES.wallet}?return=${encodeURIComponent(ROUTES.learn(slug))}`}
        >
          شراء ساعات تعليمية
        </Button>
      </Modal>
    </Container>
  );
}
