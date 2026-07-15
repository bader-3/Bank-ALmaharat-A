"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes, hasEnoughHours } from "@/lib/format/duration";
import {
  getFirstLesson,
  getLessonHours,
  getNextUnpurchasedLesson,
  getRemainingCourseHours,
  getUnpurchasedLessons,
} from "@/lib/learning/lessons";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { getLearningService } from "@/services/learning";
import { useRouter } from "next/navigation";
import type { Course } from "@/types/course";
import type { Enrollment } from "@/types/learning";

interface CoursePurchaseActionsProps {
  course: Course;
  firstLessonHours: number;
}

type PurchaseMode = "first-lesson" | "next-lesson" | "all-remaining";

export function CoursePurchaseActions({ course, firstLessonHours }: CoursePurchaseActionsProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { balance, refreshWallet } = useWallet();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);
  const [busyMode, setBusyMode] = useState<PurchaseMode | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContext, setModalContext] = useState<{
    mode: PurchaseMode;
    hours: number;
    label: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const coursePath = `${ROUTES.courses}/${course.slug}`;
  const walletPath = `${ROUTES.wallet}?return=${encodeURIComponent(coursePath)}`;
  const firstLesson = getFirstLesson(course);
  const unpurchased = getUnpurchasedLessons(course, enrollment);
  const remainingHours = getRemainingCourseHours(course, enrollment);
  const nextLesson = enrollment
    ? getNextUnpurchasedLesson(course, enrollment)
    : firstLesson;
  const allPurchased = enrollment !== null && unpurchased.length === 0;
  const canBuyNext = Boolean(nextLesson);

  const loadEnrollment = useCallback(async () => {
    if (!user) {
      setEnrollment(null);
      setLoadingEnrollment(false);
      return;
    }
    setLoadingEnrollment(true);
    const data = await getLearningService().getEnrollment(user.id, course.slug);
    setEnrollment(data);
    setLoadingEnrollment(false);
  }, [user, course.slug]);

  useEffect(() => {
    void loadEnrollment();
  }, [loadEnrollment]);

  function requireAuth(): boolean {
    if (!isAuthenticated) {
      router.push(ROUTES.register);
      return false;
    }
    if (!user?.interviewCompleted) {
      router.push(ROUTES.interview);
      return false;
    }
    return true;
  }

  function openInsufficientModal(mode: PurchaseMode, hours: number, label: string) {
    setModalContext({ mode, hours, label });
    setShowModal(true);
  }

  async function handleFirstLesson() {
    if (!requireAuth() || !user || !firstLesson) return;

    if (!hasEnoughHours(balance, firstLessonHours)) {
      openInsufficientModal("first-lesson", firstLessonHours, "الدرس الأول");
      return;
    }

    setBusyMode("first-lesson");
    setErrorMessage("");
    const result = await getLearningService().startLearning(user.id, course.slug);
    await refreshWallet();
    setBusyMode(null);

    if (!result.success) {
      if (result.code === "NO_BALANCE") {
        openInsufficientModal("first-lesson", firstLessonHours, "الدرس الأول");
        return;
      }
      setErrorMessage(result.error);
      return;
    }

    router.push(ROUTES.learn(course.slug));
  }

  async function handleNextLesson() {
    if (!requireAuth() || !user || !nextLesson) return;

    const hours = getLessonHours(nextLesson);
    if (!hasEnoughHours(balance, hours)) {
      openInsufficientModal("next-lesson", hours, nextLesson.title);
      return;
    }

    setBusyMode("next-lesson");
    setErrorMessage("");

    if (!enrollment) {
      await handleFirstLesson();
      return;
    }

    const result = await getLearningService().purchaseLesson(user.id, course.slug, nextLesson.id);
    await refreshWallet();
    setBusyMode(null);

    if (!result.success) {
      if (result.code === "NO_BALANCE") {
        openInsufficientModal("next-lesson", hours, nextLesson.title);
        return;
      }
      setErrorMessage(result.error);
      return;
    }

    setEnrollment(result.enrollment);
    router.push(ROUTES.learn(course.slug));
  }

  async function handleAllRemaining() {
    if (!requireAuth() || !user) return;

    if (!hasEnoughHours(balance, remainingHours)) {
      openInsufficientModal(
        "all-remaining",
        remainingHours,
        enrollment ? "باقي الدورة" : "الدورة كاملة",
      );
      return;
    }

    setBusyMode("all-remaining");
    setErrorMessage("");
    const result = await getLearningService().purchaseAllRemaining(user.id, course.slug);
    await refreshWallet();
    setBusyMode(null);

    if (!result.success) {
      if (result.code === "NO_BALANCE") {
        openInsufficientModal(
          "all-remaining",
          remainingHours,
          enrollment ? "باقي الدورة" : "الدورة كاملة",
        );
        return;
      }
      setErrorMessage(result.error);
      return;
    }

    setEnrollment(result.enrollment);
    router.push(ROUTES.learn(course.slug));
  }

  if (loadingEnrollment) {
    return (
      <Button size="lg" fullWidth disabled>
        جاري التحميل…
      </Button>
    );
  }

  if (allPurchased || (enrollment && !canBuyNext)) {
    return (
      <Button size="lg" fullWidth href={ROUTES.learn(course.slug)}>
        متابعة التعلّم
      </Button>
    );
  }

  const nextHours = nextLesson ? getLessonHours(nextLesson) : firstLessonHours;
  const isFirstPurchase = !enrollment;
  const singleRemaining = unpurchased.length === 1;

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        fullWidth
        disabled={busyMode !== null}
        onClick={isFirstPurchase ? handleFirstLesson : handleNextLesson}
      >
        {busyMode === "first-lesson" || busyMode === "next-lesson"
          ? "جاري الشراء…"
          : isFirstPurchase
            ? `شراء الدرس الأول (${formatHoursAndMinutes(firstLessonHours)})`
            : `شراء الدرس التالي (${formatHoursAndMinutes(nextHours)})`}
      </Button>

      {!singleRemaining && (
        <Button
          size="lg"
          fullWidth
          variant="secondary"
          disabled={busyMode !== null}
          onClick={handleAllRemaining}
        >
          {busyMode === "all-remaining"
            ? "جاري الشراء…"
            : isFirstPurchase
              ? `شراء الدورة كاملة (${formatHoursAndMinutes(remainingHours)})`
              : `شراء باقي الدورة (${formatHoursAndMinutes(remainingHours)})`}
        </Button>
      )}

      {enrollment && (
        <Button size="sm" fullWidth variant="ghost" href={ROUTES.learn(course.slug)}>
          متابعة التعلّم دون شراء
        </Button>
      )}

      {errorMessage && (
        <p className="type-small text-center text-red-600">{errorMessage}</p>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="محفظتك تحتاج ساعات"
        description={
          modalContext
            ? `لشراء ${modalContext.label} من «${course.title}» تحتاج ${formatHoursAndMinutes(modalContext.hours)}. رصيدك الحالي ${formatHoursAndMinutes(balance)}.`
            : ""
        }
      >
        <Button variant="secondary" fullWidth href={walletPath}>
          شراء ساعات تعليمية
        </Button>
      </Modal>
    </div>
  );
}
