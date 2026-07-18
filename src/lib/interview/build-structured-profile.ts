import { GOAL_LABELS, LEVEL_LABELS, PRIOR_EXPERIENCE_LABELS } from "@/lib/interview/labels";
import { mockProfileFromConversation } from "@/lib/ai/mock-fallback";
import { formatLearningInterest, type StructuredInterviewDraft } from "@/lib/interview/steps";
import type { AiChatMessage, AiGeneratedProfile } from "@/types/ai";
import type { InterviewAnswers, LearningProfile } from "@/types/interview";

export function structuredDraftToAnswers(draft: StructuredInterviewDraft): InterviewAnswers {
  const hours = draft.weeklyHours ?? 0;
  const preferredStudyTime =
    draft.preferredStudyHour && draft.preferredStudyPeriod
      ? `${draft.preferredStudyHour.toLocaleString("ar-SA")}:٠٠ ${draft.preferredStudyPeriod}`
      : undefined;

  return {
    goal: draft.goal ?? "personal",
    specialtyId: draft.specialtyId,
    learningTopic: draft.learningTopic?.trim() || undefined,
    learningFocus: draft.learningFocus?.trim() || undefined,
    learningFocusSlug: draft.learningFocusSlug,
    currentLevel: draft.currentLevel ?? "beginner",
    priorExperience: draft.priorExperience ?? "none",
    weeklyHours: hours > 0 ? `${hours} ساعة` : "غير محدد",
    weeklyHoursNumeric: hours > 0 ? hours : undefined,
    availableDays: draft.availableDays ?? [],
    hoursPerDay: draft.hoursPerDay,
    preferredStudyTime,
    learningPreference: draft.learningPreference ?? "both",
    budgetOrHours: draft.budgetOrHours ?? "10-20h",
  };
}

export function draftToConversationMessages(draft: StructuredInterviewDraft): AiChatMessage[] {
  const answers = structuredDraftToAnswers(draft);
  const lines = [
    `الهدف: ${GOAL_LABELS[answers.goal] ?? answers.goal}`,
    `ما يريد تعلّمه: ${formatLearningInterest({
      learningTopic: answers.learningTopic,
      learningFocus: answers.learningFocus,
    })}`,
    `المستوى: ${LEVEL_LABELS[answers.currentLevel] ?? answers.currentLevel}`,
    `الخبرة: ${PRIOR_EXPERIENCE_LABELS[answers.priorExperience] ?? answers.priorExperience}`,
    `الساعات الأسبوعية: ${answers.weeklyHours}`,
    `أسلوب التعلّم: ${answers.learningPreference}`,
    `ساعات المحفظة للبدء: ${answers.budgetOrHours}`,
    `أيام الدراسة: ${answers.availableDays?.join("، ") || "—"}`,
    `الساعات لكل يوم: ${answers.hoursPerDay ?? "—"}`,
    `وقت الدراسة: ${answers.preferredStudyTime ?? "—"}`,
  ];

  return [{ role: "user", text: lines.join("\n") }];
}

export function applyStructuredAnswersToProfile(
  profile: AiGeneratedProfile,
  draft: StructuredInterviewDraft,
): AiGeneratedProfile {
  const answers = structuredDraftToAnswers(draft);
  const weeklyHours = answers.weeklyHoursNumeric ?? 0;

  return {
    ...profile,
    answers: {
      ...profile.answers,
      ...answers,
    },
    summary: buildStructuredSummary(draft, answers),
    learningPlan: profile.learningPlan
      ? {
          ...profile.learningPlan,
          totalHours: weeklyHours > 0 ? weeklyHours * (profile.learningPlan.totalWeeks || 2) : profile.learningPlan.totalHours,
        }
      : profile.learningPlan,
  };
}

function buildStructuredSummary(draft: StructuredInterviewDraft, answers: InterviewAnswers): string {
  const goal = GOAL_LABELS[answers.goal] ?? answers.goal;
  const level = LEVEL_LABELS[answers.currentLevel] ?? answers.currentLevel;
  const hours = answers.weeklyHoursNumeric ?? 0;
  const days = answers.availableDays?.length ?? 0;
  const perDay = answers.hoursPerDay;

  const topic = formatLearningInterest(draft);
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

export function mergeStructuredProfile(
  userId: string,
  ai: AiGeneratedProfile,
  draft: StructuredInterviewDraft,
  conversationHistory: AiChatMessage[],
): LearningProfile {
  const merged = applyStructuredAnswersToProfile(ai, draft);
  return {
    userId,
    answers: merged.answers,
    summary: merged.summary,
    suggestedSkills: merged.suggestedSkills,
    suggestedPath: merged.suggestedPath,
    completedAt: new Date().toISOString(),
    aiGenerated: true,
    conversationHistory,
    learningPlan: merged.learningPlan,
    courseRecommendations: merged.courseRecommendations,
  };
}

/** Instant profile from structured answers — no Gemini/API wait. */
export function buildLocalStructuredProfile(
  userId: string,
  draft: StructuredInterviewDraft,
  conversationHistory: AiChatMessage[],
): LearningProfile {
  const history =
    conversationHistory.length > 0 ? conversationHistory : draftToConversationMessages(draft);
  const aiProfile = mockProfileFromConversation(history, draft);
  return mergeStructuredProfile(userId, aiProfile, draft, history);
}
