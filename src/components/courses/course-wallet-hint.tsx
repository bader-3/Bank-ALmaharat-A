"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes, hasEnoughHours } from "@/lib/format/duration";
import {
  getFirstLesson,
  getLessonHours,
  getNextUnpurchasedLesson,
  getRemainingCourseHours,
  getUnpurchasedLessons,
} from "@/lib/learning/lessons";
import { getLearningService } from "@/services/learning";
import { cn } from "@/lib/cn";
import Link from "next/link";
import type { Course } from "@/types/course";
import type { Enrollment } from "@/types/learning";

interface CourseWalletHintProps {
  course: Course;
  requiredHours: number;
  className?: string;
}

export function CourseWalletHint({ course, requiredHours, className }: CourseWalletHintProps) {
  const { isAuthenticated, user } = useAuth();
  const { balance, isLoading } = useWallet();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const loadEnrollment = useCallback(async () => {
    if (!user) {
      setEnrollment(null);
      return;
    }
    const data = await getLearningService().getEnrollment(user.id, course.slug);
    setEnrollment(data);
  }, [user, course.slug]);

  useEffect(() => {
    void loadEnrollment();
  }, [loadEnrollment]);

  if (!isAuthenticated || !user?.interviewCompleted) return null;

  const unpurchased = getUnpurchasedLessons(course, enrollment);
  const remainingHours = getRemainingCourseHours(course, enrollment);
  const nextLesson = enrollment
    ? getNextUnpurchasedLesson(course, enrollment)
    : getFirstLesson(course);
  const nextLessonHours = nextLesson ? getLessonHours(nextLesson) : requiredHours;
  const allPurchased = enrollment !== null && unpurchased.length === 0;

  if (allPurchased) return null;
  if (enrollment && !nextLesson && unpurchased.length > 0) return null;

  const enoughForNext = hasEnoughHours(balance, nextLessonHours);
  const enoughForRemaining = hasEnoughHours(balance, remainingHours);
  const isContinuing = enrollment !== null && nextLesson !== null;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 type-small",
        enoughForNext
          ? "border-sage-200/60 bg-sage-50/50 text-sage-800"
          : "border-gold-200/60 bg-gold-50/50 text-gold-900",
        className,
      )}
    >
      {isLoading ? (
        "جاري تحميل رصيدك…"
      ) : isContinuing && enoughForRemaining && unpurchased.length > 1 ? (
        <>
          رصيدك {formatHoursAndMinutes(balance)} — يكفي لشراء باقي الدورة (
          {formatHoursAndMinutes(remainingHours)})، أو يمكنك شراء الدرس التالي فقط (
          {formatHoursAndMinutes(nextLessonHours)}).
        </>
      ) : isContinuing && enoughForNext ? (
        <>
          رصيدك {formatHoursAndMinutes(balance)} — يكفي لشراء الدرس التالي (
          {formatHoursAndMinutes(nextLessonHours)}).
        </>
      ) : !enrollment && enoughForRemaining ? (
        <>
          رصيدك {formatHoursAndMinutes(balance)} — يكفي لشراء الدورة كاملة (
          {formatHoursAndMinutes(remainingHours)})، أو يمكنك البدء بدرس واحد (
          {formatHoursAndMinutes(nextLessonHours)}).
        </>
      ) : enoughForNext ? (
        <>
          رصيدك {formatHoursAndMinutes(balance)} — يكفي لشراء الدرس{" "}
          {enrollment ? "التالي" : "الأول"}.
        </>
      ) : (
        <>
          تحتاج {formatHoursAndMinutes(nextLessonHours)} للدرس {enrollment ? "التالي" : "الأول"}{" "}
          — رصيدك {formatHoursAndMinutes(balance)}.{" "}
          <Link href={ROUTES.wallet} className="font-medium underline-offset-2 hover:underline">
            اشترِ ساعات
          </Link>
        </>
      )}
    </div>
  );
}
