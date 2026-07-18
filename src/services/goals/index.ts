import { addDays, resolveAvailableDayIndexes, scheduleOnAvailableDays } from "@/lib/goals/weekdays";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { getLessonsForCourse } from "@/lib/learning/lessons";
import { mockWriteDelay } from "@/lib/mock-delay";
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
import { readLearningProfile } from "@/services/interview/mock-profile-storage";
import { getEnrollmentsForUser } from "@/services/learning/mock-enrollment-storage";

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

/**
 * Builds daily goals from a learning plan — only on the learner's available days.
 * Prefer purchased-lesson sync for production calendars; kept for tests / legacy.
 */
export function buildGoalsFromPlan(
  plan: LearningPlan,
  acceptedAt: Date,
  availableDays?: string[],
  startTime = "18:00",
): LearningGoal[] {
  const createdAt = acceptedAt.toISOString();
  const dayIndexes = resolveAvailableDayIndexes(availableDays);
  let lessonIndex = 0;

  return plan.weeks.flatMap((week) => {
    const course = getCourseBySlug(week.courseSlug);
    const courseTitle = course?.title ?? week.title;
    const lessons = course
      ? getLessonsForCourse(course)
      : [{ id: `${week.courseSlug}-focus`, title: week.focus, durationMinutes: week.hours * 60 }];

    const slotsPerWeek = Math.max(1, dayIndexes.length || 1);
    const minutesPerSlot = Math.max(15, Math.round((week.hours * 60) / slotsPerWeek));

    return Array.from({ length: slotsPerWeek }, (_, slotIndex): LearningGoal => {
      const lesson = lessons[slotIndex % lessons.length];
      const scheduledDate = dayIndexes.length
        ? toDateKey(scheduleOnAvailableDays(lessonIndex++, availableDays, acceptedAt))
        : toDateKey(addDays(acceptedAt, lessonIndex++));

      return {
        id: `ai_${week.week}_${slotIndex + 1}_${week.courseSlug}`,
        title: slotIndex < lessons.length ? lesson.title : `تطبيق ومراجعة — ${courseTitle}`,
        description: week.focus,
        courseSlug: week.courseSlug,
        durationMinutes: minutesPerSlot,
        source: "ai",
        originalDate: scheduledDate,
        scheduledDate,
        startTime,
        createdAt,
      };
    });
  });
}

function purchasedLessonKeys(userId: string) {
  return new Set(
    getEnrollmentsForUser(userId).flatMap((enrollment) =>
      enrollment.purchasedLessons.map((lessonId) => `${enrollment.courseSlug}:${lessonId}`),
    ),
  );
}

export class MockGoalsService implements GoalsService {
  async getPlan(userId: string, carryOver = true) {
    return carryOver
      ? carryOverdueGoals(userId, toDateKey(new Date()))
      : getGoalPlan(userId);
  }

  /**
   * اعتماد خطة المقابلة لم يعد ينشئ أهداف تقويم بدون شراء.
   * الأهداف اليومية تُبنى عبر sync بعد شراء الدروس.
   */
  async acceptLearningPlan(userId: string, _plan: LearningPlan, _replaceExisting = false) {
    await mockWriteDelay(40);
    return getGoalPlan(userId);
  }

  async acceptPlanDraft(userId: string, draft: PlanDraft, replaceExisting = false) {
    await mockWriteDelay(80);
    const acceptedAt = new Date();
    const purchased = purchasedLessonKeys(userId);
    const createdAt = acceptedAt.toISOString();

    // فقط الدروس المشتراة تدخل التقويم — باقي الخطة تبقى في المسار/الملف
    const scheduledItems = draft.schedule.filter((item) =>
      purchased.has(`${item.courseSlug}:${item.lessonId}`),
    );

    const acceptedPlanKey = JSON.stringify({
      draftId: draft.id,
      updatedAt: draft.updatedAt,
      schedule: scheduledItems.map(
        ({ courseSlug, lessonId, scheduledDate, startTime, durationMinutes }) => ({
          courseSlug,
          lessonId,
          scheduledDate,
          startTime,
          durationMinutes,
        }),
      ),
    });

    const profile = readLearningProfile(userId);
    const availableDays = draft.availableDays.length
      ? draft.availableDays
      : profile?.answers.availableDays;

    const goals = scheduledItems.map((item, index): LearningGoal => {
      const onStudyDay = availableDays?.length
        ? toDateKey(scheduleOnAvailableDays(index, availableDays, acceptedAt))
        : item.scheduledDate;
      return {
        id: `ai_${item.courseSlug}_${item.lessonId}`,
        title: item.title,
        description: `الأسبوع ${item.week} · ${item.day}`,
        courseSlug: item.courseSlug,
        lessonId: item.lessonId,
        durationMinutes: item.durationMinutes,
        source: "ai",
        originalDate: onStudyDay,
        scheduledDate: onStudyDay,
        startTime: item.startTime,
        createdAt,
      };
    });

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
