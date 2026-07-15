export type GoalSource = "ai" | "personal";

export type LearningGoal = {
  id: string;
  title: string;
  description?: string;
  courseSlug?: string;
  lessonId?: string;
  durationMinutes: number;
  source: GoalSource;
  originalDate: string;
  scheduledDate: string;
  startTime: string;
  createdAt: string;
  completedAt?: string;
};

export type GoalPlan = {
  acceptedPlanKey?: string;
  acceptedAt?: string;
  goals: LearningGoal[];
};

export type GoalInput = {
  title: string;
  description?: string;
  courseSlug?: string;
  lessonId?: string;
  durationMinutes: number;
  scheduledDate: string;
  startTime: string;
};
