import { createPlanDraft } from "@/lib/ai/plan-draft";
import { reviewSessionKey } from "@/lib/ai/review-flow";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { getLessonHours, getLessonsForCourse } from "@/lib/learning/lessons";
import { clearOnboardingTourStorage } from "@/lib/onboarding/storage";
import {
  createSessionForUser,
  createUser,
  findUserByEmail,
  getUserById,
  resetInterviewCompletion,
} from "@/services/auth/mock-storage";
import { getFavoriteSlugs, isFavorite, removeFavorite, toggleFavorite } from "@/services/favorites/mock-favorites-storage";
import { toDateKey } from "@/services/goals";
import {
  replaceGoalPlanGoals,
  replaceWithAcceptedPlan,
} from "@/services/goals/mock-goals-storage";
import {
  clearInterviewConversation,
  clearLearningProfile,
  readLearningProfile,
} from "@/services/interview/mock-profile-storage";
import {
  completeLesson,
  createEnrollmentWithLessons,
  getEnrollmentsForUser,
  replaceUserEnrollments,
} from "@/services/learning/mock-enrollment-storage";
import {
  deleteNoorConversation,
  deletePlanningSession,
  writePlanningSession,
} from "@/services/noor/mock-noor-storage";
import { writeReviewSession } from "@/services/review/mock-review-storage";
import { addHours, getWalletBalance, reconcileWalletWithEnrollments } from "@/services/wallet/mock-wallet-storage";
import type { Course, CourseLevel } from "@/types/course";
import type { LearningGoal } from "@/types/goals";
import type { LearningProfile } from "@/types/interview";
import type { Lesson } from "@/types/learning";
import type { CourseSelection, PlanningPreferences, PlanningSession } from "@/types/noor";
import type { LessonReviewSession } from "@/types/review";

export const DEMO_ACCOUNT = {
  email: "demo@skillsbank.local",
  password: "Demo1234!",
  fullName: "بدر الهذلي",
} as const;

const DEMO_WALLET_HOURS = 32;
const STREAK_DAYS = 7;

const FALLBACK_SLUGS = ["learning-habits", "english-for-work", "public-speaking"] as const;

function toCourseLevel(value: string | undefined): CourseLevel {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }
  return "intermediate";
}

function daysAgoKey(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return toDateKey(date);
}

function isoDaysAgo(daysAgo: number, hour = 18) {
  const date = new Date();
  date.setHours(hour, 30, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function ensureWallet(userId: string) {
  const balance = getWalletBalance(userId);
  if (balance >= DEMO_WALLET_HOURS) return;
  addHours(userId, DEMO_WALLET_HOURS - balance, {
    packageName: "باقة العرض التجريبي",
    price: 0,
  });
}

function patchEnrollmentDates(
  userId: string,
  courseSlug: string,
  startedAt: string,
  lastActiveAt: string,
) {
  const items = getEnrollmentsForUser(userId).map((item) =>
    item.courseSlug === courseSlug ? { ...item, startedAt, lastActiveAt } : item,
  );
  replaceUserEnrollments(userId, items);
}

function enrollCourse(
  userId: string,
  course: Course,
  options: { purchaseCount?: number; completeCount: number; startedDaysAgo: number },
): { course: Course; purchased: Lesson[]; completed: Lesson[] } {
  const lessons = getLessonsForCourse(course);
  if (lessons.length === 0) return { course, purchased: [], completed: [] };

  const purchaseCount = Math.min(options.purchaseCount ?? lessons.length, lessons.length);
  const purchased = lessons.slice(0, purchaseCount);
  const hoursUsed = purchased.reduce((sum, lesson) => sum + getLessonHours(lesson), 0);

  createEnrollmentWithLessons(
    userId,
    course,
    purchased.map((lesson) => lesson.id),
    hoursUsed,
  );

  const completeCount = Math.min(options.completeCount, purchased.length);
  for (let i = 0; i < completeCount; i += 1) {
    completeLesson(userId, course.slug, purchased[i].id);
  }

  patchEnrollmentDates(
    userId,
    course.slug,
    isoDaysAgo(options.startedDaysAgo, 10),
    isoDaysAgo(Math.min(1, options.startedDaysAgo), 19),
  );

  return {
    course,
    purchased,
    completed: purchased.slice(0, completeCount),
  };
}

/** يختار دورات العرض من ملف المقابلة الحقيقي، مع احتياطي من الكتالوج. */
function resolveDemoCourseSlugs(profile: LearningProfile | null): [string, string, string] {
  const fromProfile: string[] = [];

  if (profile?.answers.learningFocusSlug) {
    fromProfile.push(profile.answers.learningFocusSlug);
  }
  for (const rec of profile?.courseRecommendations ?? []) {
    if (rec.slug) fromProfile.push(rec.slug);
  }
  for (const week of profile?.learningPlan?.weeks ?? []) {
    if (week.courseSlug) fromProfile.push(week.courseSlug);
  }

  const unique = Array.from(new Set(fromProfile)).filter((slug) => Boolean(getCourseBySlug(slug)));
  const merged = [...unique, ...FALLBACK_SLUGS].filter(
    (slug, index, arr) => arr.indexOf(slug) === index && Boolean(getCourseBySlug(slug)),
  );

  return [merged[0], merged[1] ?? merged[0], merged[2] ?? merged[1] ?? merged[0]];
}

function seedEnrollments(userId: string, slugs: [string, string, string]) {
  replaceUserEnrollments(userId, []);

  const completedCourse = getCourseBySlug(slugs[0]);
  const activeCourse = getCourseBySlug(slugs[1]);
  const secondCourse = getCourseBySlug(slugs[2]);
  if (!completedCourse || !activeCourse || !secondCourse) {
    throw new Error("DEMO_COURSE_MISSING");
  }

  const completed = enrollCourse(userId, completedCourse, {
    completeCount: getLessonsForCourse(completedCourse).length,
    startedDaysAgo: 18,
  });

  const active = enrollCourse(userId, activeCourse, {
    purchaseCount: Math.max(4, Math.ceil(getLessonsForCourse(activeCourse).length * 0.75)),
    completeCount: Math.max(3, Math.ceil(getLessonsForCourse(activeCourse).length * 0.5)),
    startedDaysAgo: 10,
  });

  const second = enrollCourse(userId, secondCourse, {
    purchaseCount: Math.max(3, Math.ceil(getLessonsForCourse(secondCourse).length * 0.5)),
    completeCount: 2,
    startedDaysAgo: 4,
  });

  return { completed, active, second };
}

function seedReviews(
  userId: string,
  bundles: Array<{ course: Course; completed: Lesson[] }>,
) {
  let offset = 2;
  for (const bundle of bundles) {
    for (const lesson of bundle.completed.slice(0, 3)) {
      const startedAt = isoDaysAgo(offset, 20);
      const completedAt = isoDaysAgo(offset, 20);
      const session: LessonReviewSession = {
        schemaVersion: 1,
        id: reviewSessionKey(userId, bundle.course.slug, lesson.id),
        ownerId: userId,
        courseSlug: bundle.course.slug,
        lessonId: lesson.id,
        courseTitle: bundle.course.title,
        lessonTitle: lesson.title,
        stage: "closing",
        status: "completed",
        messages: [
          {
            id: `rm_${lesson.id}_1`,
            role: "ai",
            text: `أحسنت بعد درس «${lesson.title}». هل تود ملخصًا سريعًا أم اختبارًا قصيرًا؟`,
            createdAt: startedAt,
          },
          {
            id: `rm_${lesson.id}_2`,
            role: "user",
            text: "ملخص سريع ثم اختبار",
            createdAt: startedAt,
          },
          {
            id: `rm_${lesson.id}_3`,
            role: "ai",
            text: `ملخص: ركّز على تطبيق فكرة الدرس في موقف عمل حقيقي. أنهيت المراجعة بنجاح.`,
            createdAt: completedAt,
          },
        ],
        aiHistory: [],
        quiz: {
          questions: [
            {
              id: "q1",
              question: `ما الهدف الرئيسي من درس «${lesson.title}»؟`,
              options: ["فهم المفهوم وتطبيقه", "حفظ التعريفات فقط", "تخطّي التطبيق", "إنهاء الدورة فورًا"],
              correctIndex: 0,
              explanation: "الدرس يهدف لبناء فهم قابل للتطبيق.",
            },
          ],
          answers: [0],
          score: 100,
        },
        startedAt,
        updatedAt: completedAt,
        completedAt,
      };
      writeReviewSession(session);
      offset += 1;
    }
  }
}

function seedGoalsAndPlan(
  userId: string,
  profile: LearningProfile | null,
  courses: { slug: string; lessons: Lesson[] }[],
) {
  const now = new Date().toISOString();
  const preferences: PlanningPreferences = {
    goal: profile?.summary?.slice(0, 80) || "مسار تعلّم من مقابلة نور",
    specialtyId: profile?.answers.specialtyId ?? "languages",
    domain: profile?.answers.learningTopic ?? "تطوير مهارات",
    currentLevel: toCourseLevel(profile?.answers.currentLevel),
    priorExperience: String(profile?.answers.priorExperience ?? "some"),
    weeklyHours: profile?.answers.weeklyHoursNumeric ?? 6,
    durationWeeks: profile?.learningPlan?.totalWeeks ?? 5,
    availableDays: profile?.answers.availableDays ?? ["السبت", "الأحد", "الثلاثاء", "الخميس"],
    preferredTimes: [profile?.answers.preferredStudyTime ?? "مساءً"],
    deliveryModes: ["live", "recorded"],
    pace: "balanced",
    budgetHours: DEMO_WALLET_HOURS,
    walletBalanceHours: DEMO_WALLET_HOURS,
    preferredLanguage: "العربية",
  };

  const selections: CourseSelection[] = courses.map((entry, index) => ({
    courseSlug: entry.slug,
    status: "selected" as const,
    selectedLessonIds: entry.lessons.map((lesson) => lesson.id),
    order: index + 1,
    reason: "من ملف المقابلة في العرض التجريبي",
    updatedAt: now,
  }));

  const draft = createPlanDraft(preferences, selections);
  const session: PlanningSession = {
    id: `demo-plan-${userId}`,
    ownerId: userId,
    status: "accepted",
    stage: "draft_approval",
    preferences,
    courseSelections: selections,
    draft,
    versions: [
      {
        id: `demo-version-${userId}`,
        version: 1,
        draft,
        createdAt: now,
        note: "خطة بعد مقابلة العرض التجريبي",
      },
    ],
    createdAt: now,
    updatedAt: now,
    acceptedAt: now,
  };
  writePlanningSession(session);

  const lessonQueue = courses.flatMap((entry) =>
    entry.lessons.map((lesson) => ({
      courseSlug: entry.slug,
      lesson,
    })),
  );

  if (lessonQueue.length === 0) return;

  const goalPool: LearningGoal[] = [];
  const times = ["18:00", "19:00", "20:30"];
  const activeSlug = courses[1]?.slug ?? courses[0].slug;
  const secondSlug = courses[2]?.slug ?? activeSlug;

  for (let dayAgo = STREAK_DAYS - 1; dayAgo >= 0; dayAgo -= 1) {
    const scheduledDate = daysAgoKey(dayAgo);
    const primary = lessonQueue[(STREAK_DAYS - 1 - dayAgo) % lessonQueue.length];
    const secondaryTitle =
      dayAgo === 0
        ? "مراجعة سريعة لما تعلّمته اليوم"
        : dayAgo === 1
          ? "تمرين قصير قبل الدرس التالي"
          : "تلخيص ما تعلّمته اليوم";

    goalPool.push({
      id: `ai_streak_${dayAgo}_${primary.lesson.id}`,
      title: primary.lesson.title,
      description: `درس من مسار العرض · ${primary.courseSlug}`,
      courseSlug: primary.courseSlug,
      lessonId: primary.lesson.id,
      durationMinutes: primary.lesson.durationMinutes,
      source: "ai",
      originalDate: scheduledDate,
      scheduledDate,
      startTime: times[dayAgo % times.length],
      createdAt: isoDaysAgo(dayAgo + 1, 9),
      completedAt: isoDaysAgo(dayAgo, 20),
    });

    goalPool.push({
      id: `ai_habit_${dayAgo}_${userId}`,
      title: secondaryTitle,
      description: "عادة يومية تدعم الاستمرارية",
      courseSlug: dayAgo <= 1 ? secondSlug : activeSlug,
      durationMinutes: dayAgo === 0 ? 25 : 15,
      source: "ai",
      originalDate: scheduledDate,
      scheduledDate,
      startTime: "21:00",
      createdAt: isoDaysAgo(dayAgo + 1, 10),
      completedAt: isoDaysAgo(dayAgo, 21),
    });
  }

  const tomorrow = daysAgoKey(-1);
  goalPool.push({
    id: `ai_next_review_${userId}`,
    title: "مراجعة هدف الغد",
    description: "هدف مفتوح بعد اكتمال المقابلة",
    courseSlug: activeSlug,
    durationMinutes: 15,
    source: "ai",
    originalDate: tomorrow,
    scheduledDate: tomorrow,
    startTime: "19:30",
    createdAt: now,
  });

  replaceGoalPlanGoals(userId, []);
  replaceWithAcceptedPlan(
    userId,
    `demo-after-interview:${userId}:${Date.now()}`,
    now,
    goalPool,
  );
}

function seedFavorites(userId: string, slugs: string[]) {
  for (const slug of slugs) {
    if (getCourseBySlug(slug) && !isFavorite(userId, slug)) {
      toggleFavorite(userId, slug);
    }
  }
}

export function isDemoAccountEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DEMO_ACCOUNT.email;
}

/**
 * المرحلة 1: حساب تجريبي على باب مقابلة نور (كأنه مستخدم جديد).
 */
export function seedDemoAccount(): {
  email: string;
  password: string;
  userId: string;
} {
  clearOnboardingTourStorage();

  const existing = findUserByEmail(DEMO_ACCOUNT.email);
  let userId: string;

  if (existing) {
    userId = existing.id;
    resetInterviewCompletion(userId, { fullName: DEMO_ACCOUNT.fullName });
  } else {
    const created = createUser({
      fullName: DEMO_ACCOUNT.fullName,
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
    });
    userId = created.id;
    createSessionForUser(created);
  }

  clearLearningProfile(userId);
  clearInterviewConversation(userId);
  replaceUserEnrollments(userId, []);
  replaceGoalPlanGoals(userId, []);
  deletePlanningSession(userId);
  deleteNoorConversation(userId);
  for (const slug of getFavoriteSlugs(userId)) {
    removeFavorite(userId, slug);
  }

  const finalUser = getUserById(userId);
  if (finalUser) {
    createSessionForUser({
      ...finalUser,
      fullName: DEMO_ACCOUNT.fullName,
      interviewCompleted: false,
    });
  }

  return {
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    userId,
  };
}

/**
 * المرحلة 2: بعد إنهاء المقابلة والضغط على «انتقل للموقع».
 * يبقي ملف نور كما بَنَته المقابلة، ويضيف فوقه تقدّمًا وإنجازات للعرض.
 */
export function enrichDemoAccountAfterInterview(userId: string): void {
  const profile = readLearningProfile(userId);
  const slugs = resolveDemoCourseSlugs(profile);

  ensureWallet(userId);

  const { completed, active, second } = seedEnrollments(userId, slugs);

  const enrolledHours = getEnrollmentsForUser(userId).reduce(
    (sum, enrollment) => sum + enrollment.hoursUsed,
    0,
  );
  reconcileWalletWithEnrollments(userId, enrolledHours);

  seedReviews(userId, [
    { course: completed.course, completed: completed.completed },
    { course: active.course, completed: active.completed },
    { course: second.course, completed: second.completed },
  ]);

  seedGoalsAndPlan(userId, profile, [
    { slug: completed.course.slug, lessons: completed.purchased },
    { slug: active.course.slug, lessons: active.purchased },
    { slug: second.course.slug, lessons: second.purchased },
  ]);

  seedFavorites(userId, slugs);

  // يبقى الترحيب والجولة التعريفية لأول دخول بعد المقابلة
  clearOnboardingTourStorage();
}
