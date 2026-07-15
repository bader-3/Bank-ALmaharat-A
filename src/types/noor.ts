import type { LearningPlanWeek } from "@/types/ai";
import type { CourseLevel, DeliveryMode } from "@/types/course";

export type NoorMessageRole = "user" | "ai";

export type NoorMessage = {
  id: string;
  role: NoorMessageRole;
  text: string;
  createdAt: string;
  actionHref?: string;
  actionLabel?: string;
};

export type NoorConversation = {
  schemaVersion: 1;
  ownerId: string;
  messages: NoorMessage[];
  createdAt: string;
  updatedAt: string;
};

export type PlanningPace = "relaxed" | "balanced" | "intensive";

export type PlanningStage =
  | "goal"
  | "domain"
  | "background"
  | "weekly_commitment"
  | "duration"
  | "availability"
  | "learning_style"
  | "budget"
  | "course_selection"
  | "draft_approval";

export type PlanningPreferences = {
  goal?: string;
  specialtyId?: string;
  domain?: string;
  currentLevel?: CourseLevel;
  priorExperience?: string;
  knownSkills?: string[];
  weeklyHours?: number;
  durationWeeks?: number;
  availableDays?: string[];
  preferredTimes?: string[];
  deliveryModes: DeliveryMode[];
  pace?: PlanningPace;
  budgetHours?: number;
  budgetAmount?: number;
  walletBalanceHours?: number;
  preferredLanguage?: string;
  notes?: string;
};

export type CourseSelectionStatus = "suggested" | "selected" | "excluded";

export type CourseSelection = {
  courseSlug: string;
  status: CourseSelectionStatus;
  selectedLessonIds: string[];
  order: number;
  reason?: string;
  updatedAt: string;
};

export type PlanDraftLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  outcome: string;
  included: boolean;
};

export type PlanDraftCourse = {
  courseSlug: string;
  title: string;
  order: number;
  included: boolean;
  lessons: PlanDraftLesson[];
};

export type PlanDraftScheduleItem = {
  id: string;
  week: number;
  day: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
  courseSlug: string;
  lessonId: string;
  title: string;
  hours: number;
};

export type PlanDraftProject = {
  title: string;
  description: string;
  deliverable: string;
};

export type PlanDraft = {
  id: string;
  title: string;
  summary: string;
  totalWeeks: number;
  totalHours: number;
  weeklyHours: number;
  availableDays: string[];
  preferredTimes: string[];
  durationWeeks: number;
  breakMinutes: number;
  estimatedCostHours: number;
  estimatedCostAmount?: number;
  measurableOutcome: string;
  appliedProject: PlanDraftProject;
  courses: PlanDraftCourse[];
  schedule: PlanDraftScheduleItem[];
  weeks: LearningPlanWeek[];
  courseSelections: CourseSelection[];
  createdAt: string;
  updatedAt: string;
};

export type PlanVersion = {
  id: string;
  version: number;
  draft: PlanDraft;
  createdAt: string;
  note?: string;
  revision?: string;
};

export type PlanDiscoveryMode = "edit_current" | "new_courses";

export type PlanDiscoveryStep =
  | "mode"
  | "specialty"
  | "level"
  | "delivery"
  | "results"
  | "done";

export type PlanDiscovery = {
  active: boolean;
  step: PlanDiscoveryStep;
  mode?: PlanDiscoveryMode;
  specialtyId?: string;
  level?: CourseLevel;
  deliveryModes?: DeliveryMode[];
  selectedSlugs: string[];
  updatedAt: string;
};

export type PlanningSessionStatus =
  | "collecting_preferences"
  | "course_selection"
  | "drafting"
  | "reviewing"
  | "accepted"
  | "cancelled";

export type PlanningSession = {
  id: string;
  ownerId: string;
  questionnaireVersion?: number;
  status: PlanningSessionStatus;
  stage: PlanningStage;
  preferences: PlanningPreferences;
  suggestedPreferences?: PlanningPreferences;
  courseSelections: CourseSelection[];
  draft?: PlanDraft;
  discovery?: PlanDiscovery;
  versions: PlanVersion[];
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
};
