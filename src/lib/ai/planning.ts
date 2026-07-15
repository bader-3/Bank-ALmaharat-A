import type { DeliveryMode } from "@/types/course";
import { LEVEL_LABELS } from "@/types/course";
import { getCourseBySlug, getSpecialtyById } from "@/lib/courses/mock-data";
import type { LearningProfile } from "@/types/interview";
import type {
  PlanningPreferences,
  PlanningSession,
  PlanningStage,
} from "@/types/noor";

export const PLAN_PREFERENCE_KEYS = [
  "goal",
  "domain",
  "currentLevel",
  "priorExperience",
  "knownSkills",
  "weeklyHours",
  "durationWeeks",
  "availableDays",
  "preferredTimes",
  "deliveryModes",
  "budgetHours",
  "budgetAmount",
  "walletBalanceHours",
] as const;

export type PlanPreferenceKey = (typeof PLAN_PREFERENCE_KEYS)[number];
export type PlanningExtraction = Partial<PlanningPreferences>;

const REQUIRED_PREFERENCE_GROUPS = [
  "goal",
  "domain",
  "background",
  "weeklyHours",
  "durationWeeks",
  "availability",
  "deliveryModes",
  "budget",
] as const;

export const PLANNING_QUESTIONNAIRE_VERSION = 2;

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

function normalizeArabic(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => ARABIC_DIGITS[digit])
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function positiveNumber(value: unknown, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > max) {
    return undefined;
  }
  return Math.round(value * 10) / 10;
}

function nonNegativeNumber(value: unknown, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) {
    return undefined;
  }
  return Math.round(value * 10) / 10;
}

function stringValue(value: unknown, maxLength = 300): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean && clean.length <= maxLength ? clean : undefined;
}

function stringArray(value: unknown, maxItems = 10): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .map((item) => stringValue(item, 80))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
  return items.length ? [...new Set(items)] : undefined;
}

const ARABIC_WEEKDAYS = [
  ["السبت", "السبت"],
  ["الاحد", "الأحد"],
  ["الاثنين", "الاثنين"],
  ["الثلاثاء", "الثلاثاء"],
  ["الاربعاء", "الأربعاء"],
  ["الخميس", "الخميس"],
  ["الجمعه", "الجمعة"],
] as const;

function matchArabicWeekdays(text: string): string[] {
  return ARABIC_WEEKDAYS.filter(([needle]) => text.includes(needle)).map(([, label]) => label);
}

export function validatePlanningExtraction(value: unknown): PlanningExtraction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: PlanningExtraction = {};

  const goal = stringValue(source.goal);
  const domain = stringValue(source.domain, 120);
  const priorExperience = stringValue(source.priorExperience);
  const knownSkills = stringArray(source.knownSkills);
  const availableDays = stringArray(source.availableDays, 7);
  const preferredTimes = stringArray(source.preferredTimes, 8);
  const weeklyHours = positiveNumber(source.weeklyHours, 168);
  const durationWeeks = positiveNumber(source.durationWeeks, 260);
  const budgetHours = positiveNumber(source.budgetHours, 10_000);
  const budgetAmount = positiveNumber(source.budgetAmount, 10_000_000);
  const walletBalanceHours = nonNegativeNumber(source.walletBalanceHours, 10_000);

  if (goal) result.goal = goal;
  if (typeof source.specialtyId === "string" && source.specialtyId.trim()) {
    result.specialtyId = source.specialtyId.trim();
  }
  if (domain) result.domain = domain;
  if (source.currentLevel === "beginner" || source.currentLevel === "intermediate" || source.currentLevel === "advanced") {
    result.currentLevel = source.currentLevel;
  }
  if (priorExperience) result.priorExperience = priorExperience;
  if (knownSkills) result.knownSkills = knownSkills;
  if (weeklyHours) result.weeklyHours = weeklyHours;
  if (durationWeeks) result.durationWeeks = Math.round(durationWeeks);
  if (availableDays) result.availableDays = availableDays;
  if (preferredTimes) result.preferredTimes = preferredTimes;
  if (budgetHours) result.budgetHours = budgetHours;
  if (budgetAmount) result.budgetAmount = budgetAmount;
  if (walletBalanceHours !== undefined) result.walletBalanceHours = walletBalanceHours;

  if (Array.isArray(source.deliveryModes)) {
    const modes = source.deliveryModes.filter(
      (mode): mode is DeliveryMode =>
        mode === "recorded" || mode === "live" || mode === "hybrid",
    );
    if (modes.length) result.deliveryModes = [...new Set(modes)];
  }

  return result;
}

function firstNumberBefore(text: string, unit: RegExp): number | undefined {
  const match = text.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${unit.source}`));
  return match ? Number(match[1].replace(",", ".")) : undefined;
}

export function extractPlanningPreferencesFallback(message: string): PlanningExtraction {
  const text = normalizeArabic(message);
  const result: PlanningExtraction = {};

  if (/مبتد(?:ئ|ء)?|من الصفر|ما اعرف|لا اعرف/.test(text)) result.currentLevel = "beginner";
  else if (/متوسط/.test(text)) result.currentLevel = "intermediate";
  else if (/متقدم|محترف|خبير/.test(text)) result.currentLevel = "advanced";

  const weeklyHours = firstNumberBefore(text, /ساع(?:ه|ات)?\s*(?:اسبوعيا|بالاسبوع|كل اسبوع)/);
  if (weeklyHours) result.weeklyHours = weeklyHours;

  const weeks =
    firstNumberBefore(text, /(?:اسبوع|اسابيع)/) ??
    (/اسبوعين/.test(text) ? 2 : undefined);
  const months =
    firstNumberBefore(text, /(?:شهر|اشهر|شهور)/) ??
    (/شهرين/.test(text) ? 2 : undefined);
  if (weeks) result.durationWeeks = Math.round(weeks);
  else if (months) result.durationWeeks = Math.round(months * 4);

  const budgetHours = text.match(/(?:ميزاني(?:ه|تي)|رصيد(?:ي)?|معي|لدي)\D{0,20}(\d+(?:[.,]\d+)?)\s*ساع/);
  if (budgetHours) result.budgetHours = Number(budgetHours[1].replace(",", "."));
  const budgetAmount = text.match(/(?:ميزاني(?:ه|تي))\D{0,20}(\d+(?:[.,]\d+)?)\s*(?:ريال|ر\.?\s?س|دولار)/);
  if (budgetAmount) result.budgetAmount = Number(budgetAmount[1].replace(",", "."));

  const matchedDays = matchArabicWeekdays(text);
  if (matchedDays.length) result.availableDays = matchedDays;

  const times: string[] = [];
  if (/صباح|الفجر/.test(text)) times.push("صباحًا");
  if (/ظهر|بعد الظهر/.test(text)) times.push("ظهرًا");
  if (/مساء|ليل|بعد العشاء/.test(text)) times.push("مساءً");
  const clock = text.match(/(?:الساعه|من)\s*(\d{1,2}(?::\d{2})?)(?:\s*(ص|م))?/);
  if (clock) times.push(`${clock[1]}${clock[2] ? ` ${clock[2]}` : ""}`);
  if (times.length) result.preferredTimes = times;

  if (/مسجل|ذاتي/.test(text)) result.deliveryModes = ["recorded"];
  else if (/مباشر|لايف/.test(text)) result.deliveryModes = ["live"];
  else if (/مزيج|كلاهما|مسجل.*مباشر|مباشر.*مسجل/.test(text)) {
    result.deliveryModes = ["recorded", "live"];
  }

  if (/لا (?:توجد|عندي|لدي) خبره|بدون خبره|اول مره/.test(text)) {
    result.priorExperience = "لا توجد خبرة سابقة";
    result.knownSkills = ["لا توجد معرفة سابقة"];
  } else {
    const experience = message.match(/(?:خبرتي|لدي خبرة|عندي خبرة|اعرف|أعرف)\s+(.{2,180})/i);
    if (experience) {
      result.priorExperience = experience[0].trim();
      result.knownSkills = [experience[1].split(/[،,.]/)[0].trim()];
    }
  }

  const domain = message.match(
    /(?:تعلم|أتعلّم|اتعلم|دراسة|دراسه|مجال|تخصص|مهارة|مهاره)\s+(?:مجال\s+)?([^،,.؟?!]{2,100})/i,
  );
  if (domain) {
    result.domain = domain[1]
      .replace(/\s+(?:خلال|في مدة|لمدة|بمعدل|للحصول|حتى|كي|بهدف).*$/i, "")
      .trim();
  }

  if (/وظيف|عمل|مسار مهني|تغيير مهني/.test(text)) result.goal = "هدف مهني أو الحصول على وظيفة";
  else if (/ترقي|تطوير مهار|تحسين/.test(text)) result.goal = "تطوير المهارات الحالية";
  else if (/جامع|دراس|اختبار|شهاد/.test(text)) result.goal = "هدف دراسي";
  else {
    const goal = message.match(/(?:هدفي|الهدف|اريد|أريد|ابغى|أبغى)\s+(?:هو\s+|ان\s+|أن\s+)?([^،,.؟?!]{3,180})/i);
    if (goal && !/^خط[هة]\s*(?:تعلم|تعليم)?\s*$/i.test(goal[1].trim())) {
      result.goal = goal[1].trim();
    }
  }

  return validatePlanningExtraction(result);
}

export function extractPlanningAnswerFallback(
  message: string,
  current: PlanningPreferences,
): PlanningExtraction {
  const extracted = extractPlanningPreferencesFallback(message);
  const missing = getMissingPlanningKey(current);
  const clean = message.trim().replace(/[؟?]+$/, "").trim();
  const normalized = normalizeArabic(clean);
  const isQuestion =
    /[؟?]/.test(message) || /^(?:ما|ماذا|كيف|لماذا|متى|اين|هل|من)(?:\s|$)/.test(normalized);
  if (isQuestion) return {};
  if (!missing || !clean) return extracted;

  const number = Number(normalized.match(/\d+(?:[.,]\d+)?/)?.[0].replace(",", "."));
  const contextual: PlanningExtraction = {};

  const genericPlanRequest =
    /خط[هة]/.test(normalized) &&
    !/وظيف|عمل|مهن|تطوير|تحسين|شهاد|اختبار|مشروع|جامع|دراس/.test(normalized);
  if (missing === "goal" && !extracted.goal && !genericPlanRequest) contextual.goal = clean;
  if (missing === "domain" && !extracted.domain) contextual.domain = clean;
  if (missing === "currentLevel" && !extracted.currentLevel) {
    if (/مبتد|صفر|بدايه|جديد|ضعيف|بسيط/.test(normalized)) contextual.currentLevel = "beginner";
    else if (/متوسط|لا باس|مقبول|جيد/.test(normalized)) contextual.currentLevel = "intermediate";
    else if (/متقدم|محترف|خبير|ممتاز|قوي/.test(normalized)) contextual.currentLevel = "advanced";
  }
  if (missing === "deliveryModes" && !extracted.deliveryModes?.length) {
    if (/مسجل|ذاتي|فيديو|اونلاين|مرن/.test(normalized)) contextual.deliveryModes = ["recorded"];
    else if (/مباشر|لايف|حي|تفاعل/.test(normalized)) contextual.deliveryModes = ["live"];
    else if (/مزيج|كلاهما|الاثنين|معا|هجين/.test(normalized)) {
      contextual.deliveryModes = ["recorded", "live"];
    }
  }
  if (
    (missing === "priorExperience" || missing === "knownSkills") &&
    !extracted.priorExperience &&
    !extracted.knownSkills?.length
  ) {
    contextual.priorExperience = clean;
    contextual.knownSkills = [clean];
  }
  if (missing === "weeklyHours" && !extracted.weeklyHours && number > 0) {
    contextual.weeklyHours = number;
  }
  if (missing === "durationWeeks" && !extracted.durationWeeks && number > 0) {
    contextual.durationWeeks = /شهر|اشهر|شهور/.test(normalized)
      ? Math.round(number * 4)
      : Math.round(number);
  }
  if (missing === "availableDays" && !extracted.availableDays?.length) {
    if (/نهايه الاسبوع|عطله/.test(normalized)) {
      contextual.availableDays = ["الجمعة", "السبت"];
    } else {
      const dayParts = normalized.split(/\s*(?:و|,|،)\s*/);
      const fromParts = dayParts.flatMap((part) => matchArabicWeekdays(part));
      if (fromParts.length) {
        contextual.availableDays = [...new Set(fromParts)];
      }
    }
  }
  if (missing === "preferredTimes" && !extracted.preferredTimes?.length) {
    contextual.preferredTimes = [clean];
  }
  if (
    (missing === "budgetHours" || missing === "budgetAmount") &&
    !extracted.budgetHours &&
    !extracted.budgetAmount &&
    number > 0
  ) {
    if (/ريال|دولار|ميزاني/.test(normalized)) contextual.budgetAmount = number;
    else contextual.budgetHours = number;
  }

  return validatePlanningExtraction({ ...contextual, ...extracted });
}

export function mergePlanningPreferences(
  current: PlanningPreferences,
  extraction: PlanningExtraction,
): PlanningPreferences {
  return {
    ...current,
    ...extraction,
    deliveryModes: extraction.deliveryModes ?? current.deliveryModes ?? [],
  };
}

function parsePositiveNumber(value: string) {
  const normalized = value.replace(/[٠-٩]/g, (digit) => ARABIC_DIGITS[digit]);
  const number = Number(normalized.match(/\d+(?:[.,]\d+)?/)?.[0].replace(",", "."));
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export function planningPreferencesFromProfile(
  profile: LearningProfile,
): PlanningPreferences {
  const recommendedCourse = profile.courseRecommendations?.[0]
    ? getCourseBySlug(profile.courseRecommendations[0].slug)
    : undefined;
  const specialty = recommendedCourse
    ? getSpecialtyById(recommendedCourse.specialtyId)
    : undefined;
  const currentLevel =
    profile.answers.currentLevel === "beginner" ||
    profile.answers.currentLevel === "intermediate" ||
    profile.answers.currentLevel === "advanced"
      ? profile.answers.currentLevel
      : undefined;
  const learningPreference = profile.answers.learningPreference;

  return {
    goal: profile.suggestedPath || profile.answers.goal,
    specialtyId: recommendedCourse?.specialtyId,
    domain: specialty?.name ?? profile.suggestedSkills[0],
    currentLevel,
    priorExperience: profile.answers.priorExperience,
    knownSkills: profile.suggestedSkills,
    weeklyHours: parsePositiveNumber(profile.answers.weeklyHours),
    durationWeeks: profile.learningPlan?.totalWeeks,
    deliveryModes:
      learningPreference === "both"
        ? ["recorded", "live"]
        : [learningPreference],
    budgetHours:
      parsePositiveNumber(profile.answers.budgetOrHours) ??
      profile.learningPlan?.totalHours,
    preferredLanguage: "العربية",
    notes: "بيانات أولية من المقابلة الذكية",
  };
}

export function getPlanningCompleteness(preferences: PlanningPreferences) {
  const completed = [
    Boolean(preferences.goal),
    Boolean(preferences.specialtyId || preferences.domain),
    Boolean(preferences.currentLevel && (preferences.priorExperience || preferences.knownSkills?.length)),
    Boolean(preferences.weeklyHours),
    Boolean(preferences.durationWeeks),
    Boolean(preferences.availableDays?.length && preferences.preferredTimes?.length),
    Boolean(preferences.deliveryModes.length),
    Boolean(preferences.budgetHours || preferences.budgetAmount),
  ].filter(Boolean).length;

  return {
    completed,
    total: REQUIRED_PREFERENCE_GROUPS.length,
    percent: Math.round((completed / REQUIRED_PREFERENCE_GROUPS.length) * 100),
  };
}

export function getMissingPlanningKey(
  preferences: PlanningPreferences,
): PlanPreferenceKey | null {
  if (!preferences.goal) return "goal";
  if (!preferences.specialtyId && !preferences.domain) return "domain";
  if (!preferences.currentLevel) return "currentLevel";
  if (!preferences.priorExperience && !preferences.knownSkills?.length) return "priorExperience";
  if (!preferences.weeklyHours) return "weeklyHours";
  if (!preferences.durationWeeks) return "durationWeeks";
  if (!preferences.availableDays?.length) return "availableDays";
  if (!preferences.preferredTimes?.length) return "preferredTimes";
  if (!preferences.deliveryModes.length) return "deliveryModes";
  if (!preferences.budgetHours && !preferences.budgetAmount) {
    return "budgetHours";
  }
  return null;
}

export function getPlanningStage(preferences: PlanningPreferences): PlanningStage {
  const missing = getMissingPlanningKey(preferences);
  if (!missing) return "course_selection";
  if (missing === "goal") return "goal";
  if (missing === "domain") return "domain";
  if (missing === "currentLevel" || missing === "priorExperience" || missing === "knownSkills") {
    return "background";
  }
  if (missing === "weeklyHours") return "weekly_commitment";
  if (missing === "durationWeeks") return "duration";
  if (missing === "availableDays" || missing === "preferredTimes") return "availability";
  if (missing === "deliveryModes") return "learning_style";
  return "budget";
}

export function getNextPlanningQuestion(preferences: PlanningPreferences): string | null {
  switch (getMissingPlanningKey(preferences)) {
    case "goal":
      return "ما الهدف الرئيسي الذي تريد تحقيقه من هذه الخطة؟ صف النتيجة التي تتمنى الوصول إليها بوضوح.";
    case "domain":
      return "اختر التخصص من قائمة المنصة الذي تريد بناء خطتك حوله.";
    case "currentLevel":
      return "ما مستواك الحالي في هذا التخصص: مبتدئ، متوسط، أم متقدّم؟";
    case "priorExperience":
    case "knownSkills":
      return "ما خبرتك السابقة في هذا التخصص؟ اذكر أي دورة أو مشروع أو ممارسة سابقة، ويمكنك قول «لا توجد خبرة».";
    case "weeklyHours":
      return "كم ساعة تستطيع الالتزام بها للتعلّم في الأسبوع بصورة واقعية؟";
    case "durationWeeks":
      return "خلال كم أسبوع أو شهر تريد الوصول إلى هدفك؟";
    case "availableDays":
      return "اختر الأيام المناسبة لك للتعلّم من الأيام السبعة، ثم اضغط «تأكيد الأيام».";
    case "preferredTimes":
      return "اختر الساعة التي تريد الدراسة فيها، وحدد هل هي صباحًا أم مساءً، ثم اضغط «تأكيد الوقت».";
    case "deliveryModes":
      return "اختر طريقة التقديم التي تفضّلها: مسجّلة، مباشرة، أو كلتاهما.";
    case "budgetHours":
    case "budgetAmount":
      return preferences.walletBalanceHours !== undefined
        ? `رصيدك الحالي ${preferences.walletBalanceHours} ساعة. كم ساعة تريد تخصيصها لهذه الخطة؟`
        : "كم ساعة تعليمية أو ميزانية تريد تخصيصها لهذه الخطة؟";
    default:
      return null;
  }
}

export function createPlanningSession(
  ownerId: string,
  preferences: PlanningPreferences = { deliveryModes: [] },
  suggestedPreferences?: PlanningPreferences,
): PlanningSession {
  const now = new Date().toISOString();
  const stage = getPlanningStage(preferences);
  return {
    id: `planning-${ownerId}-${Date.now()}`,
    ownerId,
    questionnaireVersion: PLANNING_QUESTIONNAIRE_VERSION,
    status: stage === "course_selection" ? "course_selection" : "collecting_preferences",
    stage,
    preferences,
    suggestedPreferences,
    courseSelections: [],
    versions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function upgradePlanningQuestionnaire(session: PlanningSession): PlanningSession {
  if (
    session.status !== "collecting_preferences" ||
    session.questionnaireVersion === PLANNING_QUESTIONNAIRE_VERSION
  ) {
    return session;
  }

  return createPlanningSession(session.ownerId, {
    deliveryModes: [],
    walletBalanceHours: session.preferences.walletBalanceHours,
  });
}

export function updatePlanningSession(
  session: PlanningSession,
  extraction: PlanningExtraction,
): PlanningSession {
  const preferences = mergePlanningPreferences(session.preferences, extraction);
  const stage = getPlanningStage(preferences);
  return {
    ...session,
    status: stage === "course_selection" ? "course_selection" : "collecting_preferences",
    stage,
    preferences,
    updatedAt: new Date().toISOString(),
  };
}

export function isPlanningSessionActive(session: PlanningSession | null | undefined) {
  return session?.status === "collecting_preferences";
}

export function isPlanningInterviewActive(session: PlanningSession | null | undefined) {
  return isPlanningSessionActive(session);
}

export function getPlanningRepromptMessage(
  preferences: PlanningPreferences,
  userMessage: string,
): string {
  const nextQuestion = getNextPlanningQuestion(preferences);
  const clean = userMessage.trim();
  if (!nextQuestion) {
    return "شكرًا. أكملنا جمع المعلومات ويمكنك الآن اختيار الدورات من القائمة أعلاه.";
  }
  if (!clean) {
    return nextQuestion;
  }
  return `لم أفهم إجابتك بوضوح. ${nextQuestion}`;
}

export const STRUCTURED_PLANNING_KEYS = new Set<PlanPreferenceKey>([
  "domain",
  "currentLevel",
  "availableDays",
  "preferredTimes",
  "deliveryModes",
]);

export function isStructuredPlanningStep(key: PlanPreferenceKey | null): key is PlanPreferenceKey {
  return key !== null && STRUCTURED_PLANNING_KEYS.has(key);
}

export function extractionFromSuggestedPreferences(
  key: PlanPreferenceKey,
  suggested: PlanningPreferences,
): PlanningExtraction {
  switch (key) {
    case "goal":
      return suggested.goal ? { goal: suggested.goal } : {};
    case "domain":
      if (suggested.specialtyId) {
        const name = getSpecialtyById(suggested.specialtyId)?.name;
        return {
          specialtyId: suggested.specialtyId,
          domain: name ?? suggested.domain,
        };
      }
      return suggested.domain ? { domain: suggested.domain } : {};
    case "currentLevel":
      return suggested.currentLevel ? { currentLevel: suggested.currentLevel } : {};
    case "priorExperience":
      return suggested.priorExperience ? { priorExperience: suggested.priorExperience } : {};
    case "knownSkills":
      return suggested.knownSkills?.length ? { knownSkills: suggested.knownSkills } : {};
    case "weeklyHours":
      return suggested.weeklyHours ? { weeklyHours: suggested.weeklyHours } : {};
    case "durationWeeks":
      return suggested.durationWeeks ? { durationWeeks: suggested.durationWeeks } : {};
    case "availableDays":
      return suggested.availableDays?.length ? { availableDays: suggested.availableDays } : {};
    case "preferredTimes":
      return suggested.preferredTimes?.length ? { preferredTimes: suggested.preferredTimes } : {};
    case "deliveryModes":
      return suggested.deliveryModes?.length ? { deliveryModes: suggested.deliveryModes } : {};
    case "budgetHours":
      return suggested.budgetHours ? { budgetHours: suggested.budgetHours } : {};
    case "budgetAmount":
      return suggested.budgetAmount ? { budgetAmount: suggested.budgetAmount } : {};
    default:
      return {};
  }
}

export function hasPlanningSuggestionForKey(
  key: PlanPreferenceKey,
  suggested?: PlanningPreferences,
): boolean {
  if (!suggested) return false;
  return Object.keys(extractionFromSuggestedPreferences(key, suggested)).length > 0;
}

export function formatPlanningSuggestionLabel(
  key: PlanPreferenceKey,
  suggested: PlanningPreferences,
): string | null {
  switch (key) {
    case "goal":
      return suggested.goal ?? null;
    case "domain":
      if (suggested.specialtyId) {
        return getSpecialtyById(suggested.specialtyId)?.name ?? suggested.domain ?? null;
      }
      return suggested.domain ?? null;
    case "currentLevel":
      return suggested.currentLevel ? LEVEL_LABELS[suggested.currentLevel] : null;
    case "priorExperience":
      return suggested.priorExperience ?? null;
    case "knownSkills":
      return suggested.knownSkills?.length ? suggested.knownSkills.join("، ") : null;
    case "weeklyHours":
      return suggested.weeklyHours
        ? `${suggested.weeklyHours.toLocaleString("ar-SA")} ساعات أسبوعيًا`
        : null;
    case "durationWeeks":
      return suggested.durationWeeks
        ? `${suggested.durationWeeks.toLocaleString("ar-SA")} أسبوعًا`
        : null;
    case "availableDays":
      return suggested.availableDays?.length ? suggested.availableDays.join("، ") : null;
    case "preferredTimes":
      return suggested.preferredTimes?.length ? suggested.preferredTimes.join("، ") : null;
    case "deliveryModes":
      if (!suggested.deliveryModes?.length) return null;
      if (suggested.deliveryModes.includes("recorded") && suggested.deliveryModes.includes("live")) {
        return "مسجّلة ومباشرة";
      }
      return suggested.deliveryModes[0] === "live" ? "مباشرة" : "مسجّلة";
    case "budgetHours":
      return suggested.budgetHours
        ? `${suggested.budgetHours.toLocaleString("ar-SA")} ساعة من المحفظة`
        : null;
    case "budgetAmount":
      return suggested.budgetAmount
        ? `${suggested.budgetAmount.toLocaleString("ar-SA")} ريال`
        : null;
    default:
      return null;
  }
}
