import { buildLearningPlanFromProfile } from "@/lib/ai/learning-plan";
import { getCourseBySlug, getSpecialtyById } from "@/lib/courses/mock-data";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/interview/labels";
import { distributeWeeklyHours, formatLearningInterest } from "@/lib/interview/steps";
import { isBrowser } from "@/services/firebase/common";
import type { InterviewAnswers, LearningPreference, LearningProfile } from "@/types/interview";

export const PROFILE_CHANGED_EVENT = "asb-profile-changed";

export type LearningProfileEdits = {
  goal?: string;
  specialtyId?: string;
  learningFocus?: string;
  learningFocusSlug?: string | undefined;
  currentLevel?: string;
  priorExperience?: string;
  weeklyHoursNumeric?: number;
  availableDays?: string[];
  preferredStudyHour?: number;
  preferredStudyPeriod?: "صباحًا" | "مساءً";
  learningPreference?: LearningPreference;
  budgetOrHours?: string;
};

export function notifyProfileChanged(userId: string) {
  if (!isBrowser() || typeof window.dispatchEvent !== "function") return;
  try {
    window.dispatchEvent(new CustomEvent(PROFILE_CHANGED_EVENT, { detail: { userId } }));
  } catch {
    // ignore environments without CustomEvent (tests)
  }
}

export function parsePreferredStudyTime(value?: string): {
  hour: number;
  period: "صباحًا" | "مساءً";
} {
  if (!value) return { hour: 6, period: "مساءً" };
  const western = value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const hour = Number(western.match(/\d+/)?.[0]);
  const period = value.includes("صباح") ? "صباحًا" : "مساءً";
  return {
    hour: Number.isFinite(hour) && hour >= 1 && hour <= 12 ? hour : 6,
    period,
  };
}

function formatPreferredStudyTime(hour: number, period: "صباحًا" | "مساءً") {
  return `${hour.toLocaleString("ar-SA")}:٠٠ ${period}`;
}

function buildSummary(answers: InterviewAnswers): string {
  const goal = GOAL_LABELS[answers.goal] ?? answers.goal;
  const level = LEVEL_LABELS[answers.currentLevel] ?? answers.currentLevel;
  const hours = answers.weeklyHoursNumeric ?? 0;
  const days = answers.availableDays?.length ?? 0;
  const perDay = answers.hoursPerDay;
  const topic = formatLearningInterest({
    learningTopic: answers.learningTopic,
    learningFocus: answers.learningFocus,
  });

  let summary =
    topic !== "—"
      ? `ملفك يعبّر عن متعلّم ${level} يركّز على «${topic}» ضمن ${goal}، مع ${hours.toLocaleString("ar-SA")} ساعة أسبوعيًا`
      : `ملفك يعبّر عن متعلّم ${level} يسعى إلى ${goal}، مع ${hours.toLocaleString("ar-SA")} ساعة أسبوعيًا`;

  if (days > 0 && perDay) {
    summary += ` موزّعة على ${days.toLocaleString("ar-SA")} أيام (${perDay.toLocaleString("ar-SA")} ساعة/يوم)`;
  }
  if (answers.preferredStudyTime) {
    summary += `، ويفضّل البدء ${answers.preferredStudyTime}`;
  }
  return `${summary}.`;
}

function buildSuggestedPath(slugs: string[]): string {
  const titles = slugs
    .map((slug) => getCourseBySlug(slug)?.title)
    .filter((title): title is string => Boolean(title));
  if (!titles.length) {
    return "مسار مخصّص يبدأ من دورة تأسيسية ثم يتدرّج حسب تقدّمك.";
  }
  if (titles.length === 1) {
    return `مسار يركّز على «${titles[0]}» بناءً على ملفك التعليمي.`;
  }
  return `مسار متدرّج يبدأ بـ ${titles.join(" ← ")}.`;
}

function buildSuggestedSkills(answers: InterviewAnswers, slugs: string[]): string[] {
  const fromCourses = slugs.flatMap((slug) => {
    const course = getCourseBySlug(slug);
    if (!course) return [];
    const specialty = getSpecialtyById(course.specialtyId);
    return specialty ? [specialty.name] : [];
  });
  const topic = answers.learningTopic ? [answers.learningTopic] : [];
  return [...new Set([...fromCourses, ...topic])].slice(0, 5);
}

/** يعيد بناء الملخص والتوصيات والخطة من إجابات الملف. */
export function rebuildLearningProfileDerivatives(profile: LearningProfile): LearningProfile {
  const summary = buildSummary(profile.answers);
  const { learningPlan, courseRecommendations } = buildLearningPlanFromProfile({
    ...profile,
    summary,
  });
  const slugs = courseRecommendations.map((item) => item.slug);

  return {
    ...profile,
    summary,
    learningPlan,
    courseRecommendations,
    suggestedPath: buildSuggestedPath(slugs),
    suggestedSkills: buildSuggestedSkills(profile.answers, slugs),
  };
}

export function mergeLearningProfileEdits(
  profile: LearningProfile,
  edits: LearningProfileEdits,
): LearningProfile {
  const specialtyId = edits.specialtyId ?? profile.answers.specialtyId;
  const specialty = specialtyId ? getSpecialtyById(specialtyId) : undefined;
  const availableDays = edits.availableDays ?? profile.answers.availableDays ?? [];
  const weeklyHoursNumeric =
    edits.weeklyHoursNumeric ?? profile.answers.weeklyHoursNumeric ?? 5;
  const hoursPerDay = distributeWeeklyHours(weeklyHoursNumeric, availableDays.length || 1);

  const parsedTime = parsePreferredStudyTime(profile.answers.preferredStudyTime);
  const preferredStudyTime =
    edits.preferredStudyHour != null && edits.preferredStudyPeriod
      ? formatPreferredStudyTime(edits.preferredStudyHour, edits.preferredStudyPeriod)
      : edits.preferredStudyHour != null
        ? formatPreferredStudyTime(edits.preferredStudyHour, parsedTime.period)
        : edits.preferredStudyPeriod
          ? formatPreferredStudyTime(parsedTime.hour, edits.preferredStudyPeriod)
          : profile.answers.preferredStudyTime;

  const focusChanged =
    edits.specialtyId !== undefined && edits.specialtyId !== profile.answers.specialtyId;
  const learningFocus = focusChanged
    ? edits.learningFocus
    : (edits.learningFocus ?? profile.answers.learningFocus);
  const learningFocusSlug = focusChanged
    ? edits.learningFocusSlug
    : (edits.learningFocusSlug ?? profile.answers.learningFocusSlug);

  const answers: InterviewAnswers = {
    ...profile.answers,
    goal: edits.goal ?? profile.answers.goal,
    specialtyId,
    learningTopic: specialty?.name ?? profile.answers.learningTopic,
    learningFocus,
    learningFocusSlug,
    currentLevel: edits.currentLevel ?? profile.answers.currentLevel,
    priorExperience: edits.priorExperience ?? profile.answers.priorExperience,
    weeklyHours: `${weeklyHoursNumeric} ساعة`,
    weeklyHoursNumeric,
    availableDays,
    hoursPerDay,
    preferredStudyTime,
    learningPreference: edits.learningPreference ?? profile.answers.learningPreference,
    budgetOrHours: edits.budgetOrHours ?? profile.answers.budgetOrHours,
  };

  return rebuildLearningProfileDerivatives({
    ...profile,
    answers,
  });
}

/** خدمات نور المرتبطة بحقول الملف — للعرض في واجهة الملف. */
export const NOOR_PROFILE_SERVICES = [
  {
    id: "recommend",
    title: "اقتراح الدورات",
    description: "توصي بدورات من الفهرس حسب تخصصك ومستواك وهدفك.",
    fields: ["التخصص", "المستوى", "الهدف", "مسار التركيز"],
    href: "/noor",
  },
  {
    id: "schedule",
    title: "جدولة الأهداف اليومية",
    description: "ترتّب دروسك المشتراة على أيامك ووقت البدء المفضّل.",
    fields: ["أيام الدراسة", "وقت البدء", "الساعات الأسبوعية"],
    href: "/goals",
  },
  {
    id: "plan",
    title: "بناء خطة التعلّم",
    description: "تبني مسودة خطة في /noor من تفضيلات ملفك.",
    fields: ["كل حقول الملف"],
    href: "/noor",
  },
  {
    id: "wallet",
    title: "اقتراح باقة المحفظة",
    description: "تبرز الباقة الأنسب لميزانية ساعات البدء.",
    fields: ["ساعات المحفظة للبدء"],
    href: "/wallet",
  },
  {
    id: "courses",
    title: "تصفية الدورات",
    description: "تفتح صفحة الدورات على تخصصك الافتراضي.",
    fields: ["التخصص"],
    href: "/courses",
  },
] as const;
