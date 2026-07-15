export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type DeliveryMode = "recorded" | "live" | "hybrid";

export type Trainer = {
  id: string;
  name: string;
  title: string;
  bio: string;
};

export type Specialty = {
  id: string;
  name: string;
  slug: string;
};

export type CourseLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  outcomes: string[];
};

export type CourseModule = {
  id: string;
  title: string;
  outcomes: string[];
  lessons: CourseLesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  specialtyId: string;
  trainerId: string;
  level: CourseLevel;
  deliveryMode: DeliveryMode;
  hours: number;
  goals: string[];
  prerequisites: string[];
  syllabus: CourseModule[];
  hasCertificate: boolean;
  /** Used for profile-based recommendations — not shown as popularity */
  matchTags: string[];
};

export type CourseFilters = {
  specialtyId?: string;
  level?: CourseLevel | "all";
  deliveryMode?: DeliveryMode | "all";
  query?: string;
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدّم",
};

export const DELIVERY_LABELS: Record<DeliveryMode, string> = {
  recorded: "مسجّلة",
  live: "مباشرة",
  hybrid: "مسجّلة + مباشرة",
};
