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
import { completeGoalByLesson } from "@/services/goals/mock-goals-storage";

export interface LearningService {
  getEnrollments(userId: string): Promise<Enrollment[]>;
  getEnrollment(userId: string, courseSlug: string): Promise<Enrollment | null>;
  startLearning(userId: string, courseSlug: string): Promise<StartLearningResult>;
  purchaseLesson(userId: string, courseSlug: string, lessonId: string): Promise<PurchaseLessonResult>;
  purchaseAllRemaining(userId: string, courseSlug: string): Promise<PurchaseLessonResult>;
  completeLesson(userId: string, courseSlug: string, lessonId: string): Promise<Enrollment | null>;
}

export class MockLearningService implements LearningService {
  async getEnrollments(userId: string): Promise<Enrollment[]> {
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
