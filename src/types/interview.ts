import type { CourseRecommendation, LearningPlan } from "@/types/ai";
import type { AiChatMessage } from "@/types/ai";

export type LearningPreference = "recorded" | "live" | "both";

export type InterviewAnswers = {
  goal: string;
  /** Selected platform specialty id when known. */
  specialtyId?: string;
  learningTopic?: string;
  /** Optional finer path within the specialty. */
  learningFocus?: string;
  learningFocusSlug?: string;
  currentLevel: string;
  priorExperience: string;
  /** Display label — e.g. "20 ساعة" */
  weeklyHours: string;
  /** Numeric hours chosen by the learner */
  weeklyHoursNumeric?: number;
  availableDays?: string[];
  hoursPerDay?: number;
  preferredStudyTime?: string;
  learningPreference: LearningPreference;
  budgetOrHours: string;
};

export type LearningProfile = {
  userId: string;
  answers: InterviewAnswers;
  summary: string;
  suggestedSkills: string[];
  suggestedPath: string;
  completedAt: string;
  /** AI-generated extensions */
  aiGenerated?: boolean;
  conversationHistory?: Array<{ role: "user" | "model"; text: string }>;
  learningPlan?: LearningPlan;
  courseRecommendations?: CourseRecommendation[];
};

export type InterviewConversationMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
};

export type InterviewConversation = {
  userId: string;
  messages: InterviewConversationMessage[];
  aiHistory: AiChatMessage[];
  started: boolean;
  updatedAt: string;
};
