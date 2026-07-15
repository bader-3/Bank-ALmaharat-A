import type { LearningGoal } from "@/types/goals";

export type ProgressSummary = {
  generatedAt: string;
  lessons: { planned: number; completed: number; percent: number };
  goals: { total: number; completed: number; overdue: number; percent: number };
  minutes: { planned: number; completedPlanned: number; remaining: number };
  adherencePercent: number;
  delayedMinutes: number;
  stalledCourses: Array<{
    courseSlug: string;
    courseTitle: string;
    overdueGoals: number;
    delayedMinutes: number;
  }>;
  measurementNote: string;
};

export type AdaptationKind =
  | "redistribute"
  | "decrease_load"
  | "increase_load"
  | "review"
  | "skip_mastered"
  | "catalog_alternative";

export type PlanSnapshot = {
  goals: LearningGoal[];
  plannedMinutes: number;
  overdueGoals: number;
  weeklyMinutes: number;
};

export type AdaptationSuggestion = {
  id: string;
  kind: AdaptationKind;
  title: string;
  reason: string;
  impact: string;
  requiresApproval: true;
  before: PlanSnapshot;
  after: PlanSnapshot;
  createdAt: string;
};

export type SuggestionDecision = "pending" | "accepted" | "rejected";

export type PlanVersion = {
  id: string;
  version: number;
  userId: string;
  goals: LearningGoal[];
  createdAt: string;
  note: string;
  suggestionId?: string;
};

export type AdaptationState = {
  summary: ProgressSummary;
  suggestions: Array<AdaptationSuggestion & { decision: SuggestionDecision }>;
  versions: PlanVersion[];
  activeVersionId?: string;
};
