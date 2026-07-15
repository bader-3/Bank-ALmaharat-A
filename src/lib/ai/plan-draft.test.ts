import { describe, expect, it } from "vitest";
import { createPlanDraft, draftToLearningPlan, rebuildPlanDraft } from "@/lib/ai/plan-draft";
import { COURSES } from "@/lib/courses/mock-data";
import type { CourseSelection, PlanningPreferences } from "@/types/noor";

const course = COURSES[0];
const selectedLessonIds = course.syllabus
  .flatMap((module) => module.lessons)
  .slice(0, 2)
  .map((lesson) => lesson.id);

const preferences: PlanningPreferences = {
  goal: "بناء موقع عملي",
  domain: "تطوير الويب",
  currentLevel: "beginner",
  weeklyHours: 3,
  durationWeeks: 4,
  availableDays: ["السبت", "الثلاثاء"],
  preferredTimes: ["8 مساءً"],
  deliveryModes: ["recorded"],
  budgetHours: 20,
};

function selection(
  courseSlug: string,
  lessonIds = selectedLessonIds,
): CourseSelection {
  return {
    courseSlug,
    status: "selected",
    selectedLessonIds: lessonIds,
    order: 0,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("بناء المسودة وجدولتها", () => {
  it("يبني المسودة من دروس الفهرس المختارة فقط", () => {
    const draft = createPlanDraft(preferences, [
      selection("دورة-غير-موجودة"),
      selection(course.slug),
    ]);
    const includedLessons = draft.courses.flatMap((item) =>
      item.lessons.filter((lesson) => lesson.included),
    );

    expect(draft.courses.map((item) => item.courseSlug)).toEqual([course.slug]);
    expect(includedLessons.map((lesson) => lesson.id)).toEqual(selectedLessonIds);
    expect(draft.schedule).toHaveLength(selectedLessonIds.length);
    expect(draft.schedule.every((item) => preferences.availableDays?.includes(item.day))).toBe(true);
    expect(draft.schedule.every((item) => item.startTime === "20:00")).toBe(true);
    expect(draft.schedule.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.scheduledDate))).toBe(true);
  });

  it("يحسب الساعات من دقائق الدروس ويحدّث الجدول عند تغيير الحمل", () => {
    const draft = createPlanDraft(preferences, [selection(course.slug, [])]);
    const includedMinutes = draft.courses
      .flatMap((item) => item.lessons)
      .filter((lesson) => lesson.included)
      .reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    const rebuilt = rebuildPlanDraft({ ...draft, weeklyHours: 6 });

    expect(draft.totalHours).toBe(includedMinutes / 60);
    expect(draft.estimatedCostHours).toBe(draft.totalHours);
    expect(rebuilt.schedule).toHaveLength(draft.schedule.length);
    expect(rebuilt.totalWeeks).toBeLessThanOrEqual(draft.totalWeeks);
  });

  it("يحوّل المسودة إلى خطة وباقة محسوبة حسب الساعات", () => {
    const draft = createPlanDraft(preferences, [selection(course.slug, selectedLessonIds)]);
    const learningPlan = draftToLearningPlan(draft);

    expect(learningPlan.totalHours).toBe(draft.totalHours);
    expect(learningPlan.weeks).toEqual(draft.weeks);
    expect(["explore", "standard", "intensive"]).toContain(learningPlan.suggestedPackageId);
  });
});
