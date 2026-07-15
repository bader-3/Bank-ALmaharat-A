import { describe, expect, it } from "vitest";
import {
  buildProgressSummary,
  generateAdaptationSuggestions,
} from "@/lib/adaptation/adaptation-engine";
import { COURSES } from "@/lib/courses/mock-data";
import type { LearningGoal } from "@/types/goals";
import type { Enrollment } from "@/types/learning";

const course = COURSES.find(
  (candidate) =>
    COURSES.some(
      (other) =>
        other.slug !== candidate.slug &&
        other.specialtyId === candidate.specialtyId &&
        other.level === candidate.level,
    ),
)!;
const lessons = course.syllabus.flatMap((module) => module.lessons);

function goal(
  id: string,
  scheduledDate: string,
  overrides: Partial<LearningGoal> = {},
): LearningGoal {
  return {
    id,
    title: `هدف ${id}`,
    courseSlug: course.slug,
    lessonId: lessons[0].id,
    durationMinutes: 45,
    source: "ai",
    originalDate: scheduledDate,
    scheduledDate,
    startTime: "18:00",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function enrollment(completedLessons: string[]): Enrollment {
  return {
    id: "e1",
    userId: "u1",
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    totalHours: course.hours,
    hoursUsed: course.hours,
    purchasedLessons: lessons.map((lesson) => lesson.id),
    completedLessons,
    progress: 50,
    startedAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("محرك التكيّف", () => {
  const now = new Date("2026-07-13T12:00:00.000Z");

  it("يحسب التقدم والتأخر والالتزام من بيانات فعلية", () => {
    const goals = [
      goal("late", "2026-07-10"),
      goal("done", "2026-07-12", {
        lessonId: lessons[1].id,
        completedAt: "2026-07-12T10:00:00.000Z",
      }),
    ];
    const summary = buildProgressSummary(
      { goals },
      [enrollment([lessons[1].id])],
      now,
    );

    expect(summary.goals).toEqual({
      total: 2,
      completed: 1,
      overdue: 1,
      percent: 50,
    });
    expect(summary.lessons.completed).toBe(1);
    expect(summary.minutes).toEqual({
      planned: 90,
      completedPlanned: 45,
      remaining: 45,
    });
    expect(summary.adherencePercent).toBe(50);
  });

  it("يقترح إعادة التوزيع والمراجعة وبديلًا موجودًا في الفهرس", () => {
    const suggestions = generateAdaptationSuggestions(
      {
        goals: [
          goal("late-1", "2026-07-09"),
          goal("late-2", "2026-07-10", { lessonId: lessons[1].id }),
          goal("future-1", "2026-07-14"),
          goal("future-2", "2026-07-15"),
        ],
      },
      [],
      now,
    );
    const kinds = suggestions.map((item) => item.kind);

    expect(kinds).toContain("redistribute");
    expect(kinds).toContain("decrease_load");
    expect(kinds).toContain("review");
    expect(kinds).toContain("catalog_alternative");

    const alternative = suggestions.find((item) => item.kind === "catalog_alternative")!;
    expect(
      alternative.after.goals
        .filter((item) => item.courseSlug !== course.slug)
        .every((item) => COURSES.some((candidate) => candidate.slug === item.courseSlug)),
    ).toBe(true);
  });

  it("يقترح تجاوز الدرس الموجود في سجل الإكمال فقط", () => {
    const suggestions = generateAdaptationSuggestions(
      { goals: [goal("duplicate", "2026-07-14")] },
      [enrollment([lessons[0].id])],
      now,
    );
    const skip = suggestions.find((item) => item.kind === "skip_mastered");

    expect(skip).toBeDefined();
    expect(skip?.before.goals).toHaveLength(1);
    expect(skip?.after.goals).toHaveLength(0);
  });
});
