import type { CourseRecommendation, LearningPlan } from "@/types/ai";
import type { AiChatMessage } from "@/types/ai";

export type LearningPreference = "recorded" | "live" | "both";

export type InterviewAnswers = {
  goal: string;
  currentLevel: string;
  priorExperience: string;
  weeklyHours: string;
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
