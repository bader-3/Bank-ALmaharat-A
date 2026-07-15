export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  /** إجمالي ساعات الدورة الكاملة (للعرض) */
  totalHours: number;
  /** الساعات المخصومة فعلياً من المحفظة */
  hoursUsed: number;
  /** الدروس التي اشتراها المتعلّم */
  purchasedLessons: string[];
  completedLessons: string[];
  progress: number;
  startedAt: string;
  lastActiveAt: string;
};

export type Lesson = {
  id: string;
  title: string;
  durationMinutes: number;
};

export type StartLearningResult =
  | { success: true; enrollment: Enrollment; resumed: boolean }
  | { success: false; error: string; code: "NO_BALANCE" | "NOT_FOUND" | "UNKNOWN" };

export type PurchaseLessonResult =
  | { success: true; enrollment: Enrollment }
  | {
      success: false;
      error: string;
      code: "NO_BALANCE" | "NOT_FOUND" | "ALREADY_PURCHASED" | "NOT_AVAILABLE" | "UNKNOWN";
    };
