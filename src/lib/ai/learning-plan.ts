import {
  getRecommendedCourses,
  getScoredInterviewCourses,
} from "@/lib/courses/recommendations";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/interview/labels";
import { getRecommendedPackageId } from "@/lib/wallet/packages";
import type { CourseRecommendation, LearningPlan } from "@/types/ai";
import type { LearningProfile } from "@/types/interview";

export function buildLearningPlanFromProfile(
  profile: LearningProfile,
  conversationText = "",
  limit = 3,
): {
  learningPlan: LearningPlan;
  courseRecommendations: CourseRecommendation[];
} {
  const scored = getScoredInterviewCourses(profile, limit, conversationText);
  const recommended =
    scored.length > 0
      ? scored.map((entry) => entry.course)
      : getRecommendedCourses(profile, limit, conversationText);

  const reasonsBySlug = new Map(scored.map((entry) => [entry.course.slug, entry.reason]));
  const totalHours = recommended.reduce((sum, course) => sum + course.hours, 0);
  const goal = GOAL_LABELS[profile.answers.goal] ?? "هدفك التعليمي";
  const level = LEVEL_LABELS[profile.answers.currentLevel] ?? "مستواك";

  return {
    learningPlan: {
      totalWeeks: recommended.length,
      totalHours,
      suggestedPackageId: getRecommendedPackageId(profile.answers),
      packageReason: `باقة مناسبة لمسار ${goal} ووتيرتك الأسبوعية.`,
      weeks: recommended.map((course, index) => ({
        week: index + 1,
        title: course.title,
        courseSlug: course.slug,
        hours: course.hours,
        focus: course.summary.slice(0, 100),
      })),
    },
    courseRecommendations: recommended.map((course) => ({
      slug: course.slug,
      reason:
        reasonsBySlug.get(course.slug) ??
        `تناسب ${goal} ومستواك ${level} — ${course.summary.slice(0, 70)}`,
    })),
  };
}
