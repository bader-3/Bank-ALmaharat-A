import { getCourseBySlug } from "@/lib/courses/mock-data";
import {
  buildInterviewIntentText,
  getRecommendedCourses,
  getScoredInterviewCourses,
} from "@/lib/courses/recommendations";
import type { Course } from "@/types/course";
import type { LearningProfile } from "@/types/interview";

export type RecommendedCourse = {
  course: Course;
  reason?: string;
};

function getProfileConversationText(profile: LearningProfile): string {
  return (
    profile.conversationHistory
      ?.filter((message) => message.role === "user")
      .map((message) => message.text)
      .join(" ") ?? ""
  );
}

export function getAiRecommendedCourses(profile: LearningProfile | null, limit = 3): RecommendedCourse[] {
  if (!profile) return [];

  const conversationText = getProfileConversationText(profile);
  const scored = getScoredInterviewCourses(profile, limit, conversationText);

  if (scored.length) {
    return scored.map(({ course, reason }) => ({ course, reason }));
  }

  const intent = buildInterviewIntentText(profile, conversationText);
  if (intent.trim()) {
    return getRecommendedCourses(profile, limit, conversationText).map((course) => ({ course }));
  }

  if (profile.courseRecommendations?.length) {
    const results: RecommendedCourse[] = [];
    for (const rec of profile.courseRecommendations) {
      const course = getCourseBySlug(rec.slug);
      if (course) results.push({ course, reason: rec.reason });
      if (results.length >= limit) break;
    }
    return results;
  }

  return getRecommendedCourses(profile, limit, conversationText).map((course) => ({ course }));
}
