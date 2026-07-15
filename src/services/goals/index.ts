import { getCourseBySlug } from "@/lib/courses/mock-data";
import { getLessonsForCourse } from "@/lib/learning/lessons";
import type { LearningPlan } from "@/types/ai";
import type { GoalInput, GoalPlan, LearningGoal } from "@/types/goals";
import type { PlanDraft } from "@/types/noor";
import {
  addPersonalGoal,
  carryOverdueGoals,
  deleteGoal,
  getGoalPlan,
  replaceWithAcceptedPlan,
  toggleGoalComplete,
  updateGoal,
} from "@/services/goals/mock-goals-storage";
import { mockWriteDelay } from "@/lib/mock-delay";

export interface GoalsService {
  getPlan(userId: string, carryOver?: boolean): Promise<GoalPlan>;
  acceptLearningPlan(userId: string, plan: LearningPlan, replaceExisting?: boolean): Promise<GoalPlan>;
  acceptPlanDraft(userId: string, draft: PlanDraft, replaceExisting?: boolean): Promise<GoalPlan>;
  add(userId: string, input: GoalInput): Promise<LearningGoal>;
  update(userId: string, goalId: string, input: GoalInput): Promise<LearningGoal | null>;
  toggleComplete(userId: string, goalId: string): Promise<LearningGoal | null>;
  remove(userId: string, goalId: string): Promise<void>;
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getLearningPlanKey(plan: LearningPlan) {
  return JSON.stringify({
    totalWeeks: plan.totalWeeks,
    totalHours: plan.totalHours,
    weeks: plan.weeks.map(({ week, courseSlug, hours, focus }) => ({
      week,
      courseSlug,
      hours,
      focus,
    })),
  });
}

function buildGoalsFromPlan(plan: LearningPlan, acceptedAt: Date): LearningGoal[] {
  const createdAt = acceptedAt.toISOString();

  return plan.weeks.flatMap((week, weekIndex) => {
    const course = getCourseBySlug(week.courseSlug);
    const courseTitle = course?.title ?? week.title;
    const lessons = course
      ? getLessonsForCourse(course)
      : [{ id: `${week.courseSlug}-focus`, title: week.focus, durationMinutes: week.hours * 60 }];
    const minutesPerDay = Math.max(15, Math.round((week.hours * 60) / 7));

    return Array.from({ length: 7 }, (_, dayIndex): LearningGoal => {
      const lesson = lessons[dayIndex % lessons.length];
      const scheduledDate = toDateKey(addDays(acceptedAt, weekIndex * 7 + dayIndex));
      return {
        id: `ai_${week.week}_${dayIndex + 1}_${week.courseSlug}`,
        title: dayIndex < lessons.length ? lesson.title : `تطبيق ومراجعة — ${courseTitle}`,
        description: week.focus,
        courseSlug: week.courseSlug,
        durationMinutes: minutesPerDay,
        source: "ai",
        originalDate: scheduledDate,
        scheduledDate,
        startTime: "18:00",
        createdAt,
      };
    });
  });
}

export class MockGoalsService implements GoalsService {
  async getPlan(userId: string, carryOver = true) {
    return carryOver
      ? carryOverdueGoals(userId, toDateKey(new Date()))
      : getGoalPlan(userId);
  }

  async acceptLearningPlan(userId: string, plan: LearningPlan, replaceExisting = false) {
    await mockWriteDelay(80);
    const acceptedAt = new Date();
    return replaceWithAcceptedPlan(
      userId,
      replaceExisting
        ? `${getLearningPlanKey(plan)}:${acceptedAt.toISOString()}`
        : getLearningPlanKey(plan),
      acceptedAt.toISOString(),
      buildGoalsFromPlan(plan, acceptedAt),
    );
  }

  async acceptPlanDraft(userId: string, draft: PlanDraft, replaceExisting = false) {
    await mockWriteDelay(80);
    const acceptedAt = new Date();
    const acceptedPlanKey = JSON.stringify({
      draftId: draft.id,
      updatedAt: draft.updatedAt,
      schedule: draft.schedule.map(
        ({ courseSlug, lessonId, scheduledDate, startTime, durationMinutes }) => ({
          courseSlug,
          lessonId,
          scheduledDate,
          startTime,
          durationMinutes,
        }),
      ),
    });
    const createdAt = acceptedAt.toISOString();
    const goals = draft.schedule.map(
      (item): LearningGoal => ({
        id: `ai_${item.courseSlug}_${item.lessonId}`,
        title: item.title,
        description: `الأسبوع ${item.week} · ${item.day}`,
        courseSlug: item.courseSlug,
        lessonId: item.lessonId,
        durationMinutes: item.durationMinutes,
        source: "ai",
        originalDate: item.scheduledDate,
        scheduledDate: item.scheduledDate,
        startTime: item.startTime,
        createdAt,
      }),
    );
    return replaceWithAcceptedPlan(
      userId,
      replaceExisting ? `${acceptedPlanKey}:${createdAt}` : acceptedPlanKey,
      createdAt,
      goals,
    );
  }

  async add(userId: string, input: GoalInput) {
    await mockWriteDelay(60);
    return addPersonalGoal(userId, input);
  }

  async update(userId: string, goalId: string, input: GoalInput) {
    await mockWriteDelay(60);
    return updateGoal(userId, goalId, input);
  }

  async toggleComplete(userId: string, goalId: string) {
    await mockWriteDelay(40);
    return toggleGoalComplete(userId, goalId);
  }

  async remove(userId: string, goalId: string) {
    await mockWriteDelay(40);
    deleteGoal(userId, goalId);
  }
}

let instance: MockGoalsService | null = null;

export function getGoalsService(): GoalsService {
  if (!instance) instance = new MockGoalsService();
  return instance;
}
