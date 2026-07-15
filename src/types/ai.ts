export type AiChatMessage = {
  role: "user" | "model";
  text: string;
};

export type CourseRecommendation = {
  slug: string;
  reason: string;
};

export type LearningPlanWeek = {
  week: number;
  title: string;
  courseSlug: string;
  hours: number;
  focus: string;
};

export type LearningPlan = {
  totalWeeks: number;
  totalHours: number;
  suggestedPackageId: string;
  packageReason: string;
  weeks: LearningPlanWeek[];
};

export type AiGeneratedProfile = {
  answers: {
    goal: string;
    currentLevel: string;
    priorExperience: string;
    weeklyHours: string;
    learningPreference: "recorded" | "live" | "both";
    budgetOrHours: string;
  };
  summary: string;
  suggestedSkills: string[];
  suggestedPath: string;
  learningPlan: LearningPlan;
  courseRecommendations: CourseRecommendation[];
};
