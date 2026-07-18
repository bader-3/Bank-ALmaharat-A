import type { LearningPreference } from "@/types/interview";
import { COURSES, SPECIALTIES } from "@/lib/courses/mock-data";

export const INTERVIEW_WEEKDAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
] as const;

export type InterviewStepId =
  | "goal"
  | "learningTopic"
  | "learningFocus"
  | "currentLevel"
  | "priorExperience"
  | "weeklyHours"
  | "learningPreference"
  | "budgetOrHours"
  | "availableDays"
  | "preferredTime"
  | "confirm";

export type StructuredInterviewDraft = {
  goal?: string;
  /** Platform specialty id — chosen from catalog, never free text. */
  specialtyId?: string;
  /** Display name of the specialty (kept for summaries / older profiles). */
  learningTopic?: string;
  /** Optional finer path within the specialty (course-based). */
  learningFocus?: string;
  learningFocusSlug?: string;
  currentLevel?: string;
  priorExperience?: string;
  weeklyHours?: number;
  learningPreference?: LearningPreference;
  budgetOrHours?: string;
  availableDays?: string[];
  hoursPerDay?: number;
  preferredStudyHour?: number;
  preferredStudyPeriod?: "صباحًا" | "مساءً";
};

export const INTERVIEW_STEP_ORDER: InterviewStepId[] = [
  "goal",
  "learningTopic",
  "learningFocus",
  "currentLevel",
  "priorExperience",
  "weeklyHours",
  "learningPreference",
  "budgetOrHours",
  "availableDays",
  "preferredTime",
  "confirm",
];

export const GOAL_OPTIONS = [
  { value: "career_change", label: "تغيير مساري المهني" },
  { value: "skill_upgrade", label: "تطوير مهاراتي الحالية" },
  { value: "student", label: "دعم دراستي الجامعية" },
  { value: "personal", label: "تعلّم لأغراض شخصية" },
] as const;

/** Specialties available on the platform — interview topic must be one of these. */
export const LEARNING_TOPIC_OPTIONS = SPECIALTIES.map((specialty) => ({
  value: specialty.id,
  label: specialty.name,
}));

/** Up to 5 course-based focus paths inside a specialty. */
export function getLearningFocusOptions(specialtyId: string) {
  return COURSES.filter((course) => course.specialtyId === specialtyId)
    .slice(0, 5)
    .map((course) => ({ value: course.slug, label: course.title }));
}

export const LEVEL_OPTIONS = [
  { value: "beginner", label: "مبتدئ" },
  { value: "intermediate", label: "متوسط" },
  { value: "advanced", label: "متقدّم" },
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: "none", label: "لا توجد خبرة سابقة" },
  { value: "some", label: "خبرة محدودة (دورة أو مشروع)" },
  { value: "experienced", label: "خبرة جيدة في المجال" },
] as const;

export const WEEKLY_HOUR_OPTIONS = [
  { value: 2, label: "ساعتان" },
  { value: 3, label: "3 ساعات" },
  { value: 5, label: "5 ساعات" },
  { value: 8, label: "8 ساعات" },
  { value: 10, label: "10 ساعات" },
  { value: 12, label: "12 ساعة" },
  { value: 15, label: "15 ساعة" },
  { value: 20, label: "20 ساعة" },
  { value: 25, label: "25+ ساعة" },
] as const;

export const LEARNING_PREFERENCE_OPTIONS = [
  { value: "recorded" as const, label: "دورات مسجّلة" },
  { value: "live" as const, label: "جلسات مباشرة" },
  { value: "both" as const, label: "مزيج من الاثنين" },
];

export const BUDGET_OPTIONS = [
  { value: "explore", label: "استكشاف فقط (بدون شراء الآن)" },
  { value: "5-10h", label: "5–10 ساعات للبدء" },
  { value: "10-20h", label: "10–20 ساعة للبدء" },
  { value: "20+h", label: "20+ ساعة للبدء" },
] as const;

export const STUDY_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function getWelcomeMessage(): string {
  return `أهلًا بك! أنا نور، مرشدتك التعليمية في بنك المهارات العربي.

أنا هنا لأساعدك على:
• فهم أهدافك وبناء ملف تعليمي يناسب طموحك
• اقتراح دورات ومدربين من منصتنا
• تنظيم وقت دراستك وتوزيع الساعات على أيام الأسبوع

سنمضي معًا خطوات قصيرة — اختر إجاباتك بدقة لأبني لك مسارًا واقعيًا.`;
}

export function distributeWeeklyHours(weeklyHours: number, dayCount: number): number {
  if (dayCount <= 0 || weeklyHours <= 0) return 0;
  return Math.round((weeklyHours / dayCount) * 10) / 10;
}

export function getStepPrompt(step: InterviewStepId, draft: StructuredInterviewDraft): string {
  switch (step) {
    case "goal":
      return "ما الهدف الذي تريد تحقيقه من التعلّم؟";
    case "learningTopic":
      return "وش حاب تتعلّم؟ اختر مجالًا من مجالات المنصة المتاحة.";
    case "learningFocus":
      return draft.learningTopic
        ? `ضمن «${draft.learningTopic}»، أي مسار أدق يناسبك؟ يمكنك التخطي إن اكتفيت بالمجال العام.`
        : "أي مسار أدق يناسبك ضمن المجال؟ يمكنك التخطي إن اكتفيت بالمجال العام.";
    case "currentLevel": {
      const focusLabel = draft.learningFocus
        ? `${draft.learningTopic ?? "مجالك"} — ${draft.learningFocus}`
        : draft.learningTopic;
      return focusLabel
        ? `رائع! ما مستواك الحالي في «${focusLabel}»؟`
        : "رائع. ما مستواك الحالي في المجال الذي تريد تعلّمه؟";
    }
    case "priorExperience":
      return "وما خبرتك السابقة في هذا المجال؟";
    case "weeklyHours":
      return "كم ساعة تريد تخصيصها للتعلّم أسبوعيًا؟ اختر العدد الأنسب لجدولك.";
    case "learningPreference":
      return "ما طريقة التعلّم التي تفضّلها؟";
    case "budgetOrHours":
      return "كم ساعة تريد البدء بها في محفظتك لاستكشاف مدربين ودورات؟";
    case "availableDays":
      return `اختر أيام الدراسة في الأسبوع (يمكن اختيار أكثر من يوم).${
        draft.weeklyHours
          ? ` لديك ${draft.weeklyHours.toLocaleString("ar-SA")} ساعة أسبوعيًا — سنوزّعها على الأيام التي تختارها.`
          : ""
      }`;
    case "preferredTime":
      return "متى تودّ أن تبدأ دراستك في اليوم؟ اختر الساعة وصباحًا أو مساءً.";
    case "confirm":
      return "راجع ملخص إجاباتك. يمكنك تعديل المجال أو المستوى أو الساعات مباشرة، ثم أكّد لبناء ملفك.";
    default:
      return "";
  }
}

export function formatDistributionMessage(weeklyHours: number, days: string[], hoursPerDay: number): string {
  return `توزيع ذكي: ${weeklyHours.toLocaleString("ar-SA")} ساعة أسبوعيًا ÷ ${days.length.toLocaleString("ar-SA")} أيام = ${hoursPerDay.toLocaleString("ar-SA")} ساعة لكل يوم (${days.join("، ")}).`;
}

export function getNextStep(current: InterviewStepId): InterviewStepId | null {
  const index = INTERVIEW_STEP_ORDER.indexOf(current);
  return INTERVIEW_STEP_ORDER[index + 1] ?? null;
}

export function formatLearningInterest(
  draft: Pick<StructuredInterviewDraft, "learningTopic" | "learningFocus">,
) {
  if (draft.learningFocus && draft.learningTopic) {
    return `${draft.learningTopic} — ${draft.learningFocus}`;
  }
  return draft.learningTopic ?? draft.learningFocus ?? "—";
}
