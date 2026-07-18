import { createPlanDraft } from "@/lib/ai/plan-draft";
import { reviewSessionKey } from "@/lib/ai/review-flow";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { getLessonHours, getLessonsForCourse } from "@/lib/learning/lessons";
import { getRecommendedPackageId } from "@/lib/wallet/packages";
import {
  createSessionForUser,
  createUser,
  findUserByEmail,
  getUserById,
  markInterviewCompleted,
} from "@/services/auth/mock-storage";
import { isFavorite, toggleFavorite } from "@/services/favorites/mock-favorites-storage";
import { toDateKey } from "@/services/goals";
import {
  replaceGoalPlanGoals,
  replaceWithAcceptedPlan,
} from "@/services/goals/mock-goals-storage";
import { saveAiLearningProfile } from "@/services/interview/mock-profile-storage";
import {
  completeLesson,
  createEnrollmentWithLessons,
  getEnrollmentsForUser,
  replaceUserEnrollments,
} from "@/services/learning/mock-enrollment-storage";
import { writePlanningSession } from "@/services/noor/mock-noor-storage";
import { writeReviewSession } from "@/services/review/mock-review-storage";
import { addHours, getWalletBalance, reconcileWalletWithEnrollments } from "@/services/wallet/mock-wallet-storage";
import { clearOnboardingTourStorage } from "@/lib/onboarding/storage";
import type { Course } from "@/types/course";
import type { LearningGoal } from "@/types/goals";
import type { LearningProfile } from "@/types/interview";
import type { Lesson } from "@/types/learning";
import type { CourseSelection, PlanningPreferences, PlanningSession } from "@/types/noor";
import type { LessonReviewSession } from "@/types/review";

export const DEMO_ACCOUNT = {
  email: "demo@skillsbank.local",
  password: "Demo1234!",
  fullName: "نورة العتيبي",
} as const;

const DEMO_WALLET_HOURS = 32;
const SEED_VERSION = "rich-v3";
const STREAK_DAYS = 7;

const COMPLETED_COURSE_SLUG = "learning-habits";
const ACTIVE_COURSE_SLUG = "english-for-work";
const SECOND_ACTIVE_SLUG = "public-speaking";

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

function buildDemoProfile(userId: string): LearningProfile {
  const primary = getCourseBySlug(ACTIVE_COURSE_SLUG);
  const habits = getCourseBySlug(COMPLETED_COURSE_SLUG);
  const speaking = getCourseBySlug(SECOND_ACTIVE_SLUG);
  const now = new Date().toISOString();

  return {
    userId,
    answers: {
      goal: "skill_upgrade",
      specialtyId: "languages",
      learningTopic: "الإنجليزية المهنية",
      learningFocus: "التواصل في بيئة العمل",
      learningFocusSlug: ACTIVE_COURSE_SLUG,
      currentLevel: "intermediate",
      priorExperience: "some",
      weeklyHours: "6 ساعات",
      weeklyHoursNumeric: 6,
      availableDays: ["السبت", "الأحد", "الثلاثاء", "الخميس"],
      hoursPerDay: 1.5,
      preferredStudyTime: "مساءً",
      learningPreference: "both",
      budgetOrHours: "20+h",
    },
    summary:
      "نورة تطوّر الإنجليزية المهنية وعادات التعلّم، بمستوى متوسط ومسار نشط يظهر إنجازات حقيقية للعرض أمام اللجنة.",
    suggestedSkills: ["محادثة مهنية", "عادات تعلّم", "إلقاء وعرض"],
    suggestedPath: "مسار التواصل المهني مع عادات مستدامة",
    completedAt: now,
    aiGenerated: true,
    learningPlan: {
      totalWeeks: 5,
      totalHours: (primary?.hours ?? 16) + (habits?.hours ?? 5),
      suggestedPackageId: getRecommendedPackageId({
        goal: "skill_upgrade",
        currentLevel: "intermediate",
        priorExperience: "some",
        weeklyHours: "6 ساعات",
        weeklyHoursNumeric: 6,
        learningPreference: "both",
        budgetOrHours: "20+h",
      }),
      packageReason: "رصيد يكفي لإكمال دورة قصيرة ومواصلة مسار الإنجليزية.",
      weeks: [
        {
          week: 1,
          title: habits?.title ?? "عادات التعلّم",
          courseSlug: COMPLETED_COURSE_SLUG,
          hours: 3,
          focus: "بناء عادة يومية",
        },
        {
          week: 2,
          title: habits?.title ?? "عادات التعلّم",
          courseSlug: COMPLETED_COURSE_SLUG,
          hours: 2,
          focus: "مراجعة وترسيخ",
        },
        {
          week: 3,
          title: primary?.title ?? "إنجليزي مهني",
          courseSlug: ACTIVE_COURSE_SLUG,
          hours: 4,
          focus: "التواصل المهني",
        },
        {
          week: 4,
          title: primary?.title ?? "إنجليزي مهني",
          courseSlug: ACTIVE_COURSE_SLUG,
          hours: 4,
          focus: "البريد والاجتماعات",
        },
        {
          week: 5,
          title: speaking?.title ?? "فن الإلقاء",
          courseSlug: SECOND_ACTIVE_SLUG,
          hours: 3,
          focus: "الثقة أمام الجمهور",
        },
      ],
    },
    courseRecommendations: [
      { slug: ACTIVE_COURSE_SLUG, reason: "يطابق هدف التواصل المهني." },
      { slug: COMPLETED_COURSE_SLUG, reason: "أساس لاستمرارية التعلّم." },
      { slug: SECOND_ACTIVE_SLUG, reason: "يكمل مهارات العرض والمقابلات." },
    ],
  };
}

function ensureWallet(userId: string) {
  const balance = getWalletBalance(userId);
  if (balance >= DEMO_WALLET_HOURS) return;
  addHours(userId, DEMO_WALLET_HOURS - balance, {
    packageName: "باقة التركيز — عرض تجريبي",
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

function seedEnrollments(userId: string) {
  // Wipe prior demo enrollments so re-entry always looks full
  replaceUserEnrollments(userId, []);

  const habits = getCourseBySlug(COMPLETED_COURSE_SLUG);
  const english = getCourseBySlug(ACTIVE_COURSE_SLUG);
  const speaking = getCourseBySlug(SECOND_ACTIVE_SLUG);
  if (!habits || !english || !speaking) {
    throw new Error("DEMO_COURSE_MISSING");
  }

  const completed = enrollCourse(userId, habits, {
    completeCount: getLessonsForCourse(habits).length,
    startedDaysAgo: 18,
  });

  const active = enrollCourse(userId, english, {
    purchaseCount: Math.max(4, Math.ceil(getLessonsForCourse(english).length * 0.75)),
    completeCount: Math.max(3, Math.ceil(getLessonsForCourse(english).length * 0.5)),
    startedDaysAgo: 10,
  });

  const second = enrollCourse(userId, speaking, {
    purchaseCount: Math.max(3, Math.ceil(getLessonsForCourse(speaking).length * 0.5)),
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
            text: `أحسنتِ بعد درس «${lesson.title}». هل تودين ملخصًا سريعًا أم اختبارًا قصيرًا؟`,
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
            text: `ملخص: ركّزي على تطبيق فكرة الدرس في موقف عمل حقيقي. أنهيتِ المراجعة بنجاح.`,
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
  courses: { slug: string; lessons: Lesson[] }[],
) {
  const now = new Date().toISOString();
  const preferences: PlanningPreferences = {
    goal: "تطوير الإنجليزية المهنية وعادات التعلّم",
    specialtyId: "languages",
    domain: "لغات وتطوير ذاتي",
    currentLevel: "intermediate",
    priorExperience: "خبرة محدودة في التواصل المهني",
    weeklyHours: 6,
    durationWeeks: 5,
    availableDays: ["السبت", "الأحد", "الثلاثاء", "الخميس"],
    preferredTimes: ["مساءً"],
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
    reason: "مدرج في العرض التجريبي من الكتالوج الحقيقي",
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
        note: "خطة العرض التجريبي الغنية",
      },
    ],
    createdAt: now,
    updatedAt: now,
    acceptedAt: now,
  };
  writePlanningSession(session);

  // Flatten lessons for a realistic calendar + streak
  const lessonQueue = courses.flatMap((entry) =>
    entry.lessons.map((lesson) => ({
      courseSlug: entry.slug,
      lesson,
    })),
  );

  const goalPool: LearningGoal[] = [];
  const times = ["18:00", "19:00", "20:30"];

  // Last STREAK_DAYS (including today): every day fully completed → سلسلة إنجاز
  for (let dayAgo = STREAK_DAYS - 1; dayAgo >= 0; dayAgo -= 1) {
    const scheduledDate = daysAgoKey(dayAgo);
    const primary = lessonQueue[(STREAK_DAYS - 1 - dayAgo) % lessonQueue.length];
    const secondaryTitle =
      dayAgo === 0
        ? "مراجعة سريعة لمحادثة مهنية"
        : dayAgo === 1
          ? "تمرين تنفّس قبل عرض قصير"
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
      courseSlug: dayAgo <= 1 ? SECOND_ACTIVE_SLUG : ACTIVE_COURSE_SLUG,
      durationMinutes: dayAgo === 0 ? 25 : 15,
      source: "ai",
      originalDate: scheduledDate,
      scheduledDate,
      startTime: "21:00",
      createdAt: isoDaysAgo(dayAgo + 1, 10),
      completedAt: isoDaysAgo(dayAgo, 21),
    });
  }

  // Tomorrow: open goals so التقويم/أهدافي still show work ahead
  const tomorrow = daysAgoKey(-1);
  goalPool.push({
    id: `ai_next_email_${userId}`,
    title: "كتابة بريد مهني واحد",
    description: "هدف الغد — عادة لدعم مسار الإنجليزية",
    courseSlug: ACTIVE_COURSE_SLUG,
    durationMinutes: 15,
    source: "ai",
    originalDate: tomorrow,
    scheduledDate: tomorrow,
    startTime: "19:30",
    createdAt: now,
  });

  goalPool.push({
    id: `ai_next_speaking_${userId}`,
    title: "تمرين افتتاحية عرض لمدة دقيقة",
    description: "تحضير لدورة فن الإلقاء",
    courseSlug: SECOND_ACTIVE_SLUG,
    durationMinutes: 20,
    source: "ai",
    originalDate: tomorrow,
    scheduledDate: tomorrow,
    startTime: "20:30",
    createdAt: now,
  });

  // Force refresh on every demo login (acceptedPlanKey is unique per seed)
  replaceGoalPlanGoals(userId, []);
  replaceWithAcceptedPlan(
    userId,
    `demo:${userId}:${SEED_VERSION}:${Date.now()}`,
    now,
    goalPool,
  );
}

function seedFavorites(userId: string) {
  for (const slug of [ACTIVE_COURSE_SLUG, SECOND_ACTIVE_SLUG, "data-analysis-intro"]) {
    if (!isFavorite(userId, slug) && getCourseBySlug(slug)) {
      toggleFavorite(userId, slug);
    }
  }
}

/**
 * Creates (or refreshes) a full demo learner for hackathon judging:
 * completed + active courses, reviews, goals with streak, favorites, wallet, plan.
 * Clears onboarding tour storage so welcome + page tips appear like a first visit.
 */
export function seedDemoAccount(): {
  email: string;
  password: string;
  userId: string;
} {
  // جولة تعريفية كاملة عند كل دخول تجريبي (ترحيب + فقاعات الصفحات)
  clearOnboardingTourStorage();

  const existing = findUserByEmail(DEMO_ACCOUNT.email);
  let userId: string;

  if (existing) {
    userId = existing.id;
    const publicUser = getUserById(userId) ?? {
      id: existing.id,
      fullName: DEMO_ACCOUNT.fullName,
      email: existing.email,
      createdAt: existing.createdAt,
      provider: existing.provider,
      interviewCompleted: true,
    };
    createSessionForUser({
      ...publicUser,
      fullName: DEMO_ACCOUNT.fullName,
      interviewCompleted: true,
    });
  } else {
    const created = createUser({
      fullName: DEMO_ACCOUNT.fullName,
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
    });
    userId = created.id;
    createSessionForUser(created);
  }

  markInterviewCompleted(userId);
  saveAiLearningProfile(buildDemoProfile(userId));
  ensureWallet(userId);

  const { completed, active, second } = seedEnrollments(userId);

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
  seedGoalsAndPlan(userId, [
    { slug: completed.course.slug, lessons: completed.purchased },
    { slug: active.course.slug, lessons: active.purchased },
    { slug: second.course.slug, lessons: second.purchased },
  ]);
  seedFavorites(userId);

  const finalUser = getUserById(userId);
  if (finalUser) {
    createSessionForUser({
      ...finalUser,
      fullName: DEMO_ACCOUNT.fullName,
      interviewCompleted: true,
    });
  }

  return {
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    userId,
  };
}
