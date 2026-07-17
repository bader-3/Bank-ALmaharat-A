import { createPlanDraft } from "@/lib/ai/plan-draft";
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
import {
  getGoalPlan,
  replaceWithAcceptedPlan,
  toggleGoalComplete,
} from "@/services/goals/mock-goals-storage";
import { saveAiLearningProfile } from "@/services/interview/mock-profile-storage";
import {
  completeLesson,
  createEnrollmentWithLessons,
  getEnrollmentBySlug,
} from "@/services/learning/mock-enrollment-storage";
import { writePlanningSession } from "@/services/noor/mock-noor-storage";
import { addHours, getWalletBalance } from "@/services/wallet/mock-wallet-storage";
import type { LearningProfile } from "@/types/interview";
import type { CourseSelection, PlanningPreferences, PlanningSession } from "@/types/noor";

export const DEMO_ACCOUNT = {
  email: "demo@skillsbank.local",
  password: "Demo1234!",
  fullName: "متعلّم تجريبي",
} as const;

const DEMO_COURSE_SLUG = "english-for-work";
const DEMO_WALLET_HOURS = 20;
const PURCHASED_LESSON_COUNT = 4;
const COMPLETED_LESSON_COUNT = 2;

function buildDemoProfile(userId: string): LearningProfile {
  const course = getCourseBySlug(DEMO_COURSE_SLUG);
  const secondary = getCourseBySlug("learning-habits");
  const now = new Date().toISOString();

  return {
    userId,
    answers: {
      goal: "skill_upgrade",
      specialtyId: "languages",
      learningTopic: "الإنجليزية المهنية",
      learningFocus: "التواصل في بيئة العمل",
      learningFocusSlug: DEMO_COURSE_SLUG,
      currentLevel: "intermediate",
      priorExperience: "some",
      weeklyHours: "5 ساعات",
      weeklyHoursNumeric: 5,
      availableDays: ["السبت", "الأحد", "الثلاثاء", "الخميس"],
      hoursPerDay: 1.25,
      preferredStudyTime: "مساءً",
      learningPreference: "both",
      budgetOrHours: "20+h",
    },
    summary:
      "متعلّم يطوّر الإنجليزية المهنية للتواصل في الاجتماعات والبريد والمقابلات، بمستوى متوسط وجدول مرن أربعة أيام أسبوعيًا.",
    suggestedSkills: ["محادثة مهنية", "كتابة بريد احترافي", "تحضير مقابلات"],
    suggestedPath: "مسار الإنجليزية المهنية مع عادات تعلّم مستدامة",
    completedAt: now,
    aiGenerated: true,
    learningPlan: {
      totalWeeks: 4,
      totalHours: course?.hours ?? 16,
      suggestedPackageId: getRecommendedPackageId({
        goal: "skill_upgrade",
        currentLevel: "intermediate",
        priorExperience: "some",
        weeklyHours: "5 ساعات",
        weeklyHoursNumeric: 5,
        learningPreference: "both",
        budgetOrHours: "20+h",
      }),
      packageReason: "رصيد كافٍ لإكمال الدورة المختارة مع هامش للمراجعة.",
      weeks: [
        {
          week: 1,
          title: course?.title ?? "الإنجليزية المهنية",
          courseSlug: DEMO_COURSE_SLUG,
          hours: 4,
          focus: "أساسيات التواصل المهني",
        },
        {
          week: 2,
          title: course?.title ?? "الإنجليزية المهنية",
          courseSlug: DEMO_COURSE_SLUG,
          hours: 4,
          focus: "البريد والاجتماعات",
        },
        {
          week: 3,
          title: course?.title ?? "الإنجليزية المهنية",
          courseSlug: DEMO_COURSE_SLUG,
          hours: 4,
          focus: "المقابلات والعروض",
        },
        {
          week: 4,
          title: secondary?.title ?? "عادات التعلّم",
          courseSlug: secondary?.slug ?? "learning-habits",
          hours: 3,
          focus: "ترسيخ عادة الممارسة الأسبوعية",
        },
      ],
    },
    courseRecommendations: [
      {
        slug: DEMO_COURSE_SLUG,
        reason: "يطابق هدفك في الإنجليزية المهنية ومستواك المتوسط.",
      },
      ...(secondary
        ? [
            {
              slug: secondary.slug,
              reason: "يدعم استمرارية التعلّم بجانب المسار الرئيسي.",
            },
          ]
        : []),
    ],
  };
}

function ensureWallet(userId: string) {
  const balance = getWalletBalance(userId);
  if (balance >= DEMO_WALLET_HOURS) return;
  addHours(userId, DEMO_WALLET_HOURS - balance, {
    packageName: "باقة العرض التجريبي",
    price: 0,
  });
}

function ensureEnrollment(userId: string) {
  const course = getCourseBySlug(DEMO_COURSE_SLUG);
  if (!course) {
    throw new Error("DEMO_COURSE_MISSING");
  }

  const lessons = getLessonsForCourse(course);
  const purchased = lessons.slice(0, PURCHASED_LESSON_COUNT);
  if (purchased.length === 0) {
    throw new Error("DEMO_LESSONS_MISSING");
  }

  let enrollment = getEnrollmentBySlug(userId, DEMO_COURSE_SLUG);
  if (!enrollment) {
    const hoursUsed = purchased.reduce((sum, lesson) => sum + getLessonHours(lesson), 0);
    enrollment = createEnrollmentWithLessons(
      userId,
      course,
      purchased.map((lesson) => lesson.id),
      hoursUsed,
    );
  }

  const enrolledLessons = lessons.filter((lesson) =>
    enrollment!.purchasedLessons.includes(lesson.id),
  );
  const activeLessons = enrolledLessons.length > 0 ? enrolledLessons : purchased;

  for (const lesson of activeLessons.slice(0, COMPLETED_LESSON_COUNT)) {
    completeLesson(userId, DEMO_COURSE_SLUG, lesson.id);
  }

  return { course, lessons: activeLessons };
}

function ensureAcceptedPlan(
  userId: string,
  purchasedLessonIds: string[],
): { session: PlanningSession; draftId: string } {
  const now = new Date().toISOString();
  const preferences: PlanningPreferences = {
    goal: "تطوير الإنجليزية المهنية للتواصل في العمل",
    specialtyId: "languages",
    domain: "لغات",
    currentLevel: "intermediate",
    priorExperience: "خبرة محدودة في التواصل المهني",
    weeklyHours: 5,
    durationWeeks: 4,
    availableDays: ["السبت", "الأحد", "الثلاثاء", "الخميس"],
    preferredTimes: ["مساءً"],
    deliveryModes: ["live", "recorded"],
    pace: "balanced",
    budgetHours: DEMO_WALLET_HOURS,
    walletBalanceHours: DEMO_WALLET_HOURS,
    preferredLanguage: "العربية",
  };

  const selection: CourseSelection = {
    courseSlug: DEMO_COURSE_SLUG,
    status: "selected",
    selectedLessonIds: purchasedLessonIds,
    order: 1,
    reason: "دورة موجودة في الكتالوج وتطابق الملف التجريبي",
    updatedAt: now,
  };

  const draft = createPlanDraft(preferences, [selection]);
  const session: PlanningSession = {
    id: `demo-plan-${userId}`,
    ownerId: userId,
    status: "accepted",
    stage: "draft_approval",
    preferences,
    courseSelections: [selection],
    draft,
    versions: [
      {
        id: `demo-version-${userId}`,
        version: 1,
        draft,
        createdAt: now,
        note: "خطة العرض التجريبي",
      },
    ],
    createdAt: now,
    updatedAt: now,
    acceptedAt: now,
  };

  writePlanningSession(session);

  const acceptedPlanKey = `demo:${userId}:v1`;
  const existingPlan = getGoalPlan(userId);
  if (existingPlan.acceptedPlanKey !== acceptedPlanKey || existingPlan.goals.length === 0) {
    const goals = draft.schedule
      .filter((item) => purchasedLessonIds.includes(item.lessonId))
      .map((item) => ({
        id: `ai_${item.courseSlug}_${item.lessonId}`,
        title: item.title,
        description: `الأسبوع ${item.week} · ${item.day}`,
        courseSlug: item.courseSlug,
        lessonId: item.lessonId,
        durationMinutes: item.durationMinutes,
        source: "ai" as const,
        originalDate: item.scheduledDate,
        scheduledDate: item.scheduledDate,
        startTime: item.startTime,
        createdAt: now,
      }));

    replaceWithAcceptedPlan(userId, acceptedPlanKey, now, goals);
  }

  const plan = getGoalPlan(userId);
  const incomplete = plan.goals.filter((goal) => !goal.completedAt);
  const alreadyDone = plan.goals.some((goal) => goal.completedAt);
  if (!alreadyDone) {
    for (const goal of incomplete.slice(0, Math.min(2, incomplete.length))) {
      toggleGoalComplete(userId, goal.id);
    }
  }

  return { session, draftId: draft.id };
}

/**
 * Creates (or reuses) a fully seeded demo learner for hackathon demos:
 * registered + interview done, wallet balance, learning profile,
 * accepted Noor plan from real catalog courses, enrollments, and goals.
 */
export function seedDemoAccount(): {
  email: string;
  password: string;
  userId: string;
} {
  const existing = findUserByEmail(DEMO_ACCOUNT.email);
  let userId: string;

  if (existing) {
    userId = existing.id;
    const publicUser = getUserById(userId) ?? {
      id: existing.id,
      fullName: existing.fullName,
      email: existing.email,
      createdAt: existing.createdAt,
      provider: existing.provider,
      interviewCompleted: true,
    };
    createSessionForUser({ ...publicUser, interviewCompleted: true });
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
  const { lessons } = ensureEnrollment(userId);
  ensureAcceptedPlan(
    userId,
    lessons.map((lesson) => lesson.id),
  );

  const finalUser = getUserById(userId);
  if (finalUser) {
    createSessionForUser({ ...finalUser, interviewCompleted: true });
  }

  return {
    email: DEMO_ACCOUNT.email,
    password: DEMO_ACCOUNT.password,
    userId,
  };
}
