import type { LearningProfile } from "@/types/interview";
import type { Course, CourseFilters, CourseLevel, DeliveryMode } from "@/types/course";
import type { PlanningPreferences } from "@/types/noor";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/interview/labels";
import { COURSES, getSpecialtyById } from "@/lib/courses/mock-data";

export type CatalogCourseRecommendation = {
  course: Course;
  reason: string;
  score: number;
};

const DOMAIN_TERMS: Record<string, string[]> = {
  tech: ["تقني", "برمج", "ويب", "مطور", "جافاسكربت", "react", "بيانات"],
  ai: ["ذكاء اصطناعي", "ai", "تعلم الاله", "prompt", "اوامر"],
  design: ["تصميم", "تجربه المستخدم", "هوية", "ux"],
  business: ["اعمال", "رياده", "مشروع", "مالي", "استثمار"],
  marketing: ["تسويق", "محتوى", "منصات", "اعلان", "seo"],
  accounting: ["محاسب", "زكاه", "ضريب", "تقارير ماليه"],
  languages: ["لغه", "لغة", "انجليزي", "انجليزي", "english", "b2", "b1", "c1", "ielts", "toefl", "تواصل", "مهارات لغويه"],
  media: ["اعلام", "فيديو", "بودكاست", "صناعه محتوى"],
  education: ["تعليم", "تدريس", "مناهج", "تدريب"],
  engineering: ["هندس", "مشاريع", "autocad", "اوتوكاد"],
  law: ["قانون", "عقود", "نظام العمل", "امتثال"],
  health: ["صحه", "ضغط", "توازن", "يقظه", "نوم"],
  personal: ["تطوير ذات", "عادات", "القاء", "تحدث", "تركيز"],
};

const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 } as const;

const ENGLISH_TRACK_TERMS = [
  "انجليزي",
  "الإنجليزي",
  "english",
  "ielts",
  "toefl",
  "b1",
  "b2",
  "c1",
  "email",
  "emails",
  "مهني للتواصل",
];

const ARABIC_TRACK_TERMS = [
  "عربي",
  "العربيه",
  "العربية",
  "arabic",
  "ناطقين بغيرها",
  "لغير الناطقين",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");
}

function textHasAny(haystack: string, terms: string[]) {
  const normalized = normalize(haystack);
  return terms.some((term) => normalized.includes(normalize(term)));
}

/** داخل تخصص اللغات: إنجليزي / عربي / عام */
export function detectLanguageTrack(text: string): "english" | "arabic" | "general" {
  const hasEnglish = textHasAny(text, ENGLISH_TRACK_TERMS);
  const hasArabic = textHasAny(text, ARABIC_TRACK_TERMS);
  if (hasEnglish && !hasArabic) return "english";
  if (hasArabic && !hasEnglish) return "arabic";
  return "general";
}

function courseLanguageTrack(course: Course): "english" | "arabic" | "other" {
  const blob = `${course.slug} ${course.title} ${course.summary} ${course.description}`;
  if (textHasAny(blob, ENGLISH_TRACK_TERMS) || course.slug.includes("english")) return "english";
  if (textHasAny(blob, ARABIC_TRACK_TERMS) || course.slug.includes("arabic")) return "arabic";
  return "other";
}

function getRelevantSpecialtiesFromIntent(intent: string) {
  const normalized = normalize(intent);
  return Object.entries(DOMAIN_TERMS)
    .filter(([, terms]) => terms.some((term) => normalized.includes(normalize(term))))
    .map(([specialtyId]) => specialtyId);
}

export function buildInterviewIntentText(
  profile: Pick<LearningProfile, "answers" | "summary">,
  conversationText = "",
): string {
  const goalLabel = profile.answers
    ? (GOAL_LABELS[profile.answers.goal] ?? profile.answers.goal)
    : "";
  const priorExperience = profile.answers?.priorExperience ?? "";
  const topic = profile.answers?.learningTopic ?? "";
  const focus = profile.answers?.learningFocus ?? "";
  return [conversationText, profile.summary, goalLabel, topic, focus, priorExperience]
    .filter(Boolean)
    .join(" ");
}

function getInterviewRelevantSpecialties(
  profile: LearningProfile,
  intent: string,
): string[] {
  if (profile.answers?.specialtyId) {
    return [profile.answers.specialtyId];
  }
  return getRelevantSpecialtiesFromIntent(intent);
}

function scoreCourseForInterview(
  course: Course,
  profile: LearningProfile,
  intent: string,
  relevantSpecialties: string[],
): { score: number; reasons: string[] } {
  const normalizedIntent = normalize(intent);
  const normalizedCourse = normalize(
    `${course.title} ${course.summary} ${course.description} ${course.goals.join(" ")}`,
  );
  let score = 0;
  const reasons: string[] = [];

  const focusSlug = profile.answers?.learningFocusSlug;
  const focusTitle = profile.answers?.learningFocus ?? "";

  // مسار التركيز المختار في المقابلة له أولوية قصوى
  if (focusSlug && course.slug === focusSlug) {
    score += 30;
    reasons.push(`يطابق مسار التركيز الذي اخترته: «${focusTitle || course.title}»`);
  } else if (focusTitle && normalize(course.title).includes(normalize(focusTitle).slice(0, 10))) {
    score += 18;
    reasons.push(`قريب من مسار التركيز «${focusTitle}»`);
  } else if (focusSlug && course.specialtyId === profile.answers?.specialtyId) {
    // نفس التخصص لكن ليس مسار التركيز — لا تُعامل كمكافئة
    score -= 6;
  }

  if (relevantSpecialties.length) {
    if (relevantSpecialties.includes(course.specialtyId)) {
      score += 8;
      const specialty = getSpecialtyById(course.specialtyId);
      reasons.push(`مرتبط ب${specialty?.name ?? "ما تريد تعلّمه"}`);
    } else {
      score -= 5;
    }
  }

  // داخل اللغات: لا ترشّح العربية لمن اختار إنجليزيًا (والعكس)
  if (course.specialtyId === "languages" || relevantSpecialties.includes("languages")) {
    const track = detectLanguageTrack(
      `${intent} ${focusTitle} ${focusSlug ?? ""} ${profile.answers?.learningTopic ?? ""}`,
    );
    const courseTrack = courseLanguageTrack(course);
    if (track === "english" && courseTrack === "arabic") {
      score -= 40;
      reasons.push("خارج مسار الإنجليزية الذي طلبتَه");
    } else if (track === "arabic" && courseTrack === "english") {
      score -= 40;
      reasons.push("خارج مسار العربية الذي طلبتَه");
    } else if (track === "english" && courseTrack === "english") {
      score += 12;
      reasons.push("ضمن مسار الإنجليزية الذي اخترته");
    } else if (track === "arabic" && courseTrack === "arabic") {
      score += 12;
      reasons.push("ضمن مسار العربية الذي اخترته");
    }
  }

  // مطابقة كلمات أدق من مجرد «لغة»
  const specificTerms = [
    ...ENGLISH_TRACK_TERMS,
    ...ARABIC_TRACK_TERMS,
    "برمجه",
    "تصميم",
    "محاسب",
    "قانون",
  ];
  for (const term of specificTerms) {
    const normalizedTerm = normalize(term);
    if (normalizedTerm.length < 3) continue;
    if (normalizedIntent.includes(normalizedTerm) && normalizedCourse.includes(normalizedTerm)) {
      score += 5;
      reasons.push("يطابق موضوع التعلّم الذي ذكرتَه");
      break;
    }
  }

  // تجنّب مكافأة عامة لكل دورات «اللغات» بكلمة لغة فقط عندما يوجد تركيز أدق
  if (!focusSlug && detectLanguageTrack(intent) === "general") {
    for (const terms of Object.values(DOMAIN_TERMS)) {
      for (const term of terms) {
        const normalizedTerm = normalize(term);
        if (normalizedTerm.length < 3) continue;
        if (normalizedIntent.includes(normalizedTerm) && normalizedCourse.includes(normalizedTerm)) {
          score += 4;
          reasons.push("يطابق موضوع التعلّم الذي ذكرتَه");
          break;
        }
      }
    }
  }

  if (!profile.answers) {
    return { score: 1, reasons: ["مقترح من ملفك التعليمي"] };
  }

  const { goal, currentLevel, learningPreference } = profile.answers;
  const level = currentLevel as CourseLevel;

  if (course.level === level) {
    score += 3;
    reasons.push("يلائم مستواك الحالي");
  } else if (LEVEL_RANK[course.level] <= LEVEL_RANK[level] + 1) {
    score += 1;
  } else {
    score -= 2;
  }

  if (learningPreference === "both") score += 1;
  else if (learningPreference === course.deliveryMode) score += 2;
  else if (course.deliveryMode === "hybrid") score += 1;

  if (course.matchTags.includes(goal)) score += 1;

  return { score, reasons };
}

function getRelevantSpecialties(preferences: PlanningPreferences) {
  if (preferences.specialtyId) {
    return [preferences.specialtyId];
  }
  const intent = normalize(
    `${preferences.domain ?? ""} ${preferences.goal ?? ""} ${preferences.knownSkills?.join(" ") ?? ""}`,
  );
  return Object.entries(DOMAIN_TERMS)
    .filter(([, terms]) => terms.some((term) => intent.includes(normalize(term))))
    .map(([specialtyId]) => specialtyId);
}

function modeMatches(course: Course, preferences: PlanningPreferences) {
  if (!preferences.deliveryModes.length) return true;
  return (
    preferences.deliveryModes.includes(course.deliveryMode) ||
    (course.deliveryMode === "hybrid" &&
      preferences.deliveryModes.some((mode) => mode === "recorded" || mode === "live"))
  );
}

export function getCatalogCourseRecommendations(
  preferences: PlanningPreferences,
  limit = 6,
): CatalogCourseRecommendation[] {
  const relevantSpecialties = getRelevantSpecialties(preferences);
  const availableHours = Math.min(
    preferences.weeklyHours && preferences.durationWeeks
      ? preferences.weeklyHours * preferences.durationWeeks
      : Number.POSITIVE_INFINITY,
    preferences.budgetHours ?? Number.POSITIVE_INFINITY,
  );

  return COURSES.filter((course) => {
    if (relevantSpecialties.length && !relevantSpecialties.includes(course.specialtyId)) return false;
    if (!modeMatches(course, preferences)) return false;
    if (course.hours > availableHours) return false;
    if (
      preferences.currentLevel &&
      LEVEL_RANK[course.level] > LEVEL_RANK[preferences.currentLevel]
    ) {
      return false;
    }
    return true;
  })
    .map((course) => {
      let score = 0;
      const reasons: string[] = [];
      const specialty = getSpecialtyById(course.specialtyId);

      if (relevantSpecialties.includes(course.specialtyId)) {
        score += 5;
        reasons.push(`مرتبط بمجال ${specialty?.name ?? preferences.domain}`);
      }
      if (course.level === preferences.currentLevel) {
        score += 3;
        reasons.push("يلائم مستواك الحالي");
      }
      if (modeMatches(course, preferences)) {
        score += 2;
        reasons.push("يوافق أسلوب التعلّم المفضّل");
      }
      if (course.hours <= (preferences.weeklyHours ?? 0) * 2) {
        score += 1;
        reasons.push("يمكن دمجه عمليًا في وقتك الأسبوعي");
      }

      return {
        course,
        score,
        reason: reasons.slice(0, 2).join("، ") || "يناسب قيود الوقت والميزانية المحددة",
      };
    })
    .sort((a, b) => b.score - a.score || a.course.hours - b.course.hours)
    .slice(0, limit);
}

function deliveryMatches(course: Course, deliveryModes: DeliveryMode[]): boolean {
  if (!deliveryModes.length) return true;
  if (course.deliveryMode === "hybrid") return true;
  if (deliveryModes.includes(course.deliveryMode)) return true;
  // "recorded + live" chosen together also accepts hybrid-style courses.
  return deliveryModes.includes("recorded") && deliveryModes.includes("live");
}

/**
 * Discovery filter used by Noor's in-chat course explorer: exact specialty,
 * level at-or-below the chosen level, and matching delivery preference.
 */
export function getCoursesByDiscovery(params: {
  specialtyId: string;
  level: CourseLevel;
  deliveryModes: DeliveryMode[];
}): Course[] {
  const { specialtyId, level, deliveryModes } = params;
  return COURSES.filter((course) => {
    if (course.specialtyId !== specialtyId) return false;
    if (LEVEL_RANK[course.level] > LEVEL_RANK[level]) return false;
    if (!deliveryMatches(course, deliveryModes)) return false;
    return true;
  }).sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.hours - b.hours);
}

export function filterCourses(filters: CourseFilters): Course[] {
  const query = filters.query?.trim().toLowerCase();

  return COURSES.filter((course) => {
    if (filters.specialtyId && filters.specialtyId !== "all" && course.specialtyId !== filters.specialtyId) {
      return false;
    }
    if (filters.level && filters.level !== "all" && course.level !== filters.level) {
      return false;
    }
    if (filters.deliveryMode && filters.deliveryMode !== "all" && course.deliveryMode !== filters.deliveryMode) {
      return false;
    }
    if (query) {
      const haystack = `${course.title} ${course.summary}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function getRecommendedCourses(
  profile: LearningProfile | null,
  limit = 4,
  conversationText = "",
): Course[] {
  if (!profile) return COURSES.slice(0, limit);

  const intent = buildInterviewIntentText(profile, conversationText);
  const relevantSpecialties = getInterviewRelevantSpecialties(profile, intent);
  const pool =
    relevantSpecialties.length > 0
      ? COURSES.filter((course) => relevantSpecialties.includes(course.specialtyId))
      : COURSES;

  const scored = pool.map((course) => {
    const { score } = scoreCourseForInterview(course, profile, intent, relevantSpecialties);
    return { course, score };
  });

  const positive = scored.filter((entry) => entry.score > 0);
  const ranked = (positive.length ? positive : scored).sort(
    (a, b) => b.score - a.score || a.course.hours - b.course.hours,
  );

  return ranked.slice(0, limit).map((entry) => entry.course);
}

export function getScoredInterviewCourses(
  profile: LearningProfile,
  limit = 4,
  conversationText = "",
): Array<{ course: Course; score: number; reason: string }> {
  const intent = buildInterviewIntentText(profile, conversationText);
  const relevantSpecialties = getInterviewRelevantSpecialties(profile, intent);
  const pool =
    relevantSpecialties.length > 0
      ? COURSES.filter((course) => relevantSpecialties.includes(course.specialtyId))
      : COURSES;

  const goal = profile.answers
    ? (GOAL_LABELS[profile.answers.goal] ?? "هدفك")
    : "هدفك";
  const level = profile.answers
    ? (LEVEL_LABELS[profile.answers.currentLevel] ?? "مستواك")
    : "مستواك";

  return pool
    .map((course) => {
      const { score, reasons } = scoreCourseForInterview(
        course,
        profile,
        intent,
        relevantSpecialties,
      );
      return {
        course,
        score,
        reason:
          reasons.slice(0, 2).join("، ") ||
          `تناسب ${goal} ومستواك ${level} — ${course.summary.slice(0, 70)}`,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.course.hours - b.course.hours)
    .slice(0, limit);
}
