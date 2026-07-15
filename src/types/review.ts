import type { AiChatMessage } from "@/types/ai";

export type ReviewStage =
  | "ask_questions"
  | "qna"
  | "offer_quiz"
  | "quiz"
  | "quiz_results"
  | "closing";

export type ReviewStatus = "in_progress" | "completed" | "skipped";

export type ReviewMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  createdAt: string;
};

export type ReviewQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type LessonReviewSession = {
  schemaVersion: 1;
  id: string;
  ownerId: string;
  courseSlug: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  stage: ReviewStage;
  status: ReviewStatus;
  messages: ReviewMessage[];
  aiHistory: AiChatMessage[];
  quiz?: {
    questions: ReviewQuizQuestion[];
    answers: number[];
    score?: number;
  };
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type ReviewContext = {
  courseTitle: string;
  courseSummary: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  lessonOutcomes: string[];
  lessonContext: string;
  trainerName?: string;
};
