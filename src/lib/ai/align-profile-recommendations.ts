import { buildLearningPlanFromProfile } from "@/lib/ai/learning-plan";
import { getCourseBySlug, getSpecialtyById } from "@/lib/courses/mock-data";
import type { AiChatMessage, AiGeneratedProfile } from "@/types/ai";
import type { LearningProfile } from "@/types/interview";

export function getConversationUserText(messages: AiChatMessage[]): string {
  return messages
    .filter((message) => message.role === "user" && message.text !== "ابدأ المقابلة")
    .map((message) => message.text)
    .join(" ");
}

export function alignGeneratedProfileWithCatalog(
  profile: AiGeneratedProfile,
  messages: AiChatMessage[],
): AiGeneratedProfile {
  const conversationText = getConversationUserText(messages);
  const learningProfile: LearningProfile = {
    userId: "pending",
    answers: profile.answers,
    summary: profile.summary,
    suggestedSkills: profile.suggestedSkills,
    suggestedPath: profile.suggestedPath,
    completedAt: new Date().toISOString(),
  };

  const aligned = buildLearningPlanFromProfile(learningProfile, conversationText, 3);

  return {
    ...profile,
    suggestedPath: buildSuggestedPath(aligned.courseRecommendations),
    suggestedSkills: buildSuggestedSkills(profile, aligned.courseRecommendations),
    learningPlan: aligned.learningPlan,
    courseRecommendations: aligned.courseRecommendations,
  };
}

function buildSuggestedPath(recommendations: AiGeneratedProfile["courseRecommendations"]): string {
  if (!recommendations.length) {
    return "مسار مخصّص يبدأ من دورة تأسيسية ثم يتدرّج حسب تقدّمك.";
  }

  const titles = recommendations
    .map((recommendation) => getCourseBySlug(recommendation.slug)?.title ?? recommendation.slug)
    .filter(Boolean);

  if (titles.length === 1) {
    return `مسار يركّز على «${titles[0]}» بناءً على ما طلبت تعلّمه.`;
  }

  return `مسار متدرّج يبدأ بـ ${titles.join(" ← ")}.`;
}

function buildSuggestedSkills(
  profile: AiGeneratedProfile,
  recommendations: AiGeneratedProfile["courseRecommendations"],
): string[] {
  const fromCourses = recommendations.flatMap((recommendation) => {
    const course = getCourseBySlug(recommendation.slug);
    if (!course) return [];
    const specialty = getSpecialtyById(course.specialtyId);
    return specialty ? [specialty.name] : [];
  });

  const merged = [...new Set([...fromCourses, ...profile.suggestedSkills.slice(0, 2)])];
  return merged.slice(0, 5);
}
