import type { Enrollment, PurchaseLessonResult, StartLearningResult } from "@/types/learning";
import { mockWriteDelay } from "@/lib/mock-delay";
import {
  completeLesson as completeLessonStorage,
  createEnrollment,
  createEnrollmentWithLessons,
  getEnrollmentBySlug,
  getEnrollmentsForUser,
  purchaseLessonInEnrollment,
  purchaseLessonsInEnrollment,
} from "@/services/learning/mock-enrollment-storage";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import {
  canPurchaseLesson,
  getFirstLesson,
  getLessonHours,
  getLessonsForCourse,
  getRemainingCourseHours,
  getUnpurchasedLessons,
  isLessonPurchased,
} from "@/lib/learning/lessons";
import { deductHours, getWalletBalance, hasEnoughHours } from "@/services/wallet/mock-wallet-storage";
import {
  clearAiGoals,
  completeGoalByLesson,
  upsertAiGoals,
} from "@/services/goals/mock-goals-storage";
import { readLearningProfile } from "@/services/interview/mock-profile-storage";
import { toDateKey } from "@/services/goals";
import { scheduleOnAvailableDays } from "@/lib/goals/weekdays";
import type { LearningGoal } from "@/types/goals";

export interface LearningService {
  getEnrollments(userId: string): Promise<Enrollment[]>;
  getEnrollment(userId: string, courseSlug: string): Promise<Enrollment | null>;
  startLearning(userId: string, courseSlug: string): Promise<StartLearningResult>;
  purchaseLesson(userId: string, courseSlug: string, lessonId: string): Promise<PurchaseLessonResult>;
  purchaseAllRemaining(userId: string, courseSlug: string): Promise<PurchaseLessonResult>;
  completeLesson(userId: string, courseSlug: string, lessonId: string): Promise<Enrollment | null>;
}

function toWesternDigits(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function getPreferredStartTime(preferredStudyTime?: string) {
  if (!preferredStudyTime) return "18:00";

  const normalized = toWesternDigits(preferredStudyTime);
  const hour = Number(normalized.match(/\d+/)?.[0]);
  if (!Number.isFinite(hour) || hour < 1 || hour > 12) return "18:00";

  const isEvening = preferredStudyTime.includes("مساء");
  const normalizedHour = isEvening && hour < 12 ? hour + 12 : hour === 12 && !isEvening ? 0 : hour;
  return `${String(normalizedHour).padStart(2, "0")}:00`;
}

function getScheduledDate(index: number, availableDays?: string[]) {
  return toDateKey(scheduleOnAvailableDays(index, availableDays));
}

function syncPurchasedLessonsToGoals(userId: string) {
  const enrollments = getEnrollmentsForUser(userId);
  const profile = readLearningProfile(userId);
  const startTime = getPreferredStartTime(profile?.answers.preferredStudyTime);
  const createdAt = new Date().toISOString();
  let lessonIndex = 0;

  const goals = enrollments.flatMap((enrollment) => {
    const course = getCourseBySlug(enrollment.courseSlug);
    if (!course) return [];

    const lessons = getLessonsForCourse(course);
    return enrollment.purchasedLessons.flatMap((lessonId): LearningGoal[] => {
      const lesson = lessons.find((item) => item.id === lessonId);
      if (!lesson) return [];

      const scheduledDate = getScheduledDate(lessonIndex++, profile?.answers.availableDays);
      return [
        {
          id: `ai_${enrollment.courseSlug}_${lesson.id}`,
          title: lesson.title,
          description: `من دورة «${course.title}» — رتبتها نور حسب ملفك التعليمي.`,
          courseSlug: enrollment.courseSlug,
          lessonId: lesson.id,
          durationMinutes: lesson.durationMinutes,
          source: "ai",
          originalDate: scheduledDate,
          scheduledDate,
          startTime,
          createdAt,
          completedAt: enrollment.completedLessons.includes(lesson.id) ? enrollment.lastActiveAt : undefined,
        },
      ];
    });
  });

  if (goals.length === 0) {
    // لا تبقِ أهداف مسار قديمة من «اعتماد الخطة» بدون شراء فعلي
    clearAiGoals(userId);
    return;
  }

  const acceptedPlanKey = JSON.stringify({
    kind: "purchased-lessons",
    lessons: enrollments.map((enrollment) => ({
      courseSlug: enrollment.courseSlug,
      purchasedLessons: enrollment.purchasedLessons,
      completedLessons: enrollment.completedLessons,
    })),
    availableDays: profile?.answers.availableDays ?? [],
    preferredStudyTime: profile?.answers.preferredStudyTime ?? "",
  });

  upsertAiGoals(userId, acceptedPlanKey, createdAt, goals);
}

export class MockLearningService implements LearningService {
  async getEnrollments(userId: string): Promise<Enrollment[]> {
    syncPurchasedLessonsToGoals(userId);
    return getEnrollmentsForUser(userId);
  }

  async getEnrollment(userId: string, courseSlug: string): Promise<Enrollment | null> {
    return getEnrollmentBySlug(userId, courseSlug);
  }

  async startLearning(userId: string, courseSlug: string): Promise<StartLearningResult> {
    await mockWriteDelay(80);

    const course = getCourseBySlug(courseSlug);
    if (!course) {
      return { success: false, error: "الدورة غير موجودة.", code: "NOT_FOUND" };
    }

    const existing = getEnrollmentBySlug(userId, courseSlug);
    if (existing) {
      syncPurchasedLessonsToGoals(userId);
      return { success: true, enrollment: existing, resumed: true };
    }

    const firstLesson = getFirstLesson(course);
    if (!firstLesson) {
      return { success: false, error: "لا توجد دروس في هذه الدورة.", code: "NOT_FOUND" };
    }

    const firstLessonHours = getLessonHours(firstLesson);

    if (!hasEnoughHours(userId, firstLessonHours)) {
      return {
        success: false,
        error: `تحتاج ${firstLessonHours} ساعة لشراء الدرس الأول. رصيدك ${getWalletBalance(userId)} ساعة.`,
        code: "NO_BALANCE",
      };
    }

    const deducted = deductHours(userId, firstLessonHours);
    if (deducted === null) {
      return { success: false, error: "رصيد غير كافٍ.", code: "NO_BALANCE" };
    }

    const enrollment = createEnrollment(userId, course, firstLesson.id, firstLessonHours);
    syncPurchasedLessonsToGoals(userId);
    return { success: true, enrollment, resumed: false };
  }

  async purchaseLesson(
    userId: string,
    courseSlug: string,
    lessonId: string,
  ): Promise<PurchaseLessonResult> {
    await mockWriteDelay(80);

    const course = getCourseBySlug(courseSlug);
    if (!course) {
      return { success: false, error: "الدورة غير موجودة.", code: "NOT_FOUND" };
    }

    const enrollment = getEnrollmentBySlug(userId, courseSlug);
    if (!enrollment) {
      return { success: false, error: "لم تسجّل في هذه الدورة بعد.", code: "NOT_FOUND" };
    }

    const lessons = getLessonsForCourse(course);
    const lesson = lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      return { success: false, error: "الدرس غير موجود.", code: "NOT_FOUND" };
    }

    if (isLessonPurchased(enrollment, lessonId)) {
      return { success: false, error: "اشتريت هذا الدرس مسبقًا.", code: "ALREADY_PURCHASED" };
    }

    if (!canPurchaseLesson(enrollment, lessons, lessonId)) {
      return {
        success: false,
        error: "أكمل الدرس السابق أولًا قبل شراء هذا الدرس.",
        code: "NOT_AVAILABLE",
      };
    }

    const lessonHours = getLessonHours(lesson);

    if (!hasEnoughHours(userId, lessonHours)) {
      return {
        success: false,
        error: `تحتاج ${lessonHours} ساعة. رصيدك ${getWalletBalance(userId)} ساعة.`,
        code: "NO_BALANCE",
      };
    }

    const deducted = deductHours(userId, lessonHours);
    if (deducted === null) {
      return { success: false, error: "رصيد غير كافٍ.", code: "NO_BALANCE" };
    }

    const updated = purchaseLessonInEnrollment(userId, courseSlug, lessonId, lessonHours);
    if (!updated) {
      return { success: false, error: "تعذّر إتمام الشراء.", code: "UNKNOWN" };
    }

    syncPurchasedLessonsToGoals(userId);
    return { success: true, enrollment: updated };
  }

  async purchaseAllRemaining(
    userId: string,
    courseSlug: string,
  ): Promise<PurchaseLessonResult> {
    await mockWriteDelay(80);

    const course = getCourseBySlug(courseSlug);
    if (!course) {
      return { success: false, error: "الدورة غير موجودة.", code: "NOT_FOUND" };
    }

    const enrollment = getEnrollmentBySlug(userId, courseSlug);
    const unpurchased = getUnpurchasedLessons(course, enrollment);

    if (unpurchased.length === 0) {
      return {
        success: false,
        error: "اشتريت جميع دروس هذه الدورة.",
        code: "ALREADY_PURCHASED",
      };
    }

    const totalHours = getRemainingCourseHours(course, enrollment);

    if (!hasEnoughHours(userId, totalHours)) {
      return {
        success: false,
        error: `تحتاج ${totalHours} ساعة. رصيدك ${getWalletBalance(userId)} ساعة.`,
        code: "NO_BALANCE",
      };
    }

    const deducted = deductHours(userId, totalHours);
    if (deducted === null) {
      return { success: false, error: "رصيد غير كافٍ.", code: "NO_BALANCE" };
    }

    const lessonIds = unpurchased.map((lesson) => lesson.id);
    let updated: Enrollment | null;

    if (!enrollment) {
      updated = createEnrollmentWithLessons(userId, course, lessonIds, totalHours);
    } else {
      updated = purchaseLessonsInEnrollment(userId, courseSlug, lessonIds, totalHours);
    }

    if (!updated) {
      return { success: false, error: "تعذّر إتمام الشراء.", code: "UNKNOWN" };
    }

    syncPurchasedLessonsToGoals(userId);
    return { success: true, enrollment: updated };
  }

  async completeLesson(userId: string, courseSlug: string, lessonId: string): Promise<Enrollment | null> {
    await mockWriteDelay(60);
    const enrollment = completeLessonStorage(userId, courseSlug, lessonId);
    if (enrollment?.completedLessons.includes(lessonId)) {
      completeGoalByLesson(userId, courseSlug, lessonId, enrollment.lastActiveAt);
    }
    return enrollment;
  }
}

let instance: MockLearningService | null = null;

export function getLearningService(): LearningService {
  if (!instance) instance = new MockLearningService();
  return instance;
}
