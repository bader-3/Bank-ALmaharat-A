import { describe, expect, it } from "vitest";
import { COURSES } from "@/lib/courses/mock-data";
import {
  canCompleteLesson,
  canPurchaseLesson,
  getFirstLesson,
  getLessonHours,
  getLessonsForCourse,
  getRemainingCourseHours,
  getUnpurchasedLessons,
} from "@/lib/learning/lessons";
import type { Enrollment } from "@/types/learning";

const course = COURSES[0];
const lessons = getLessonsForCourse(course);

function makeEnrollment(overrides: Partial<Enrollment> = {}): Enrollment {
  return {
    id: "e1",
    userId: "u1",
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    totalHours: course.hours,
    hoursUsed: getLessonHours(lessons[0]),
    purchasedLessons: [lessons[0].id],
    completedLessons: [],
    progress: 0,
    startedAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("شراء الدروس", () => {
  it("يحسب ساعات الدرس الأول فقط", () => {
    const firstLesson = getFirstLesson(course);
    expect(firstLesson).toBeTruthy();
    if (!firstLesson) return;

    expect(getLessonHours(firstLesson)).toBeLessThan(course.hours);
  });

  it("يسمح بإكمال الدرس المشترى فقط", () => {
    const enrollment = makeEnrollment();
    expect(canCompleteLesson(enrollment, lessons, lessons[0].id)).toBe(true);
    expect(canCompleteLesson(enrollment, lessons, lessons[1].id)).toBe(false);
  });

  it("يسمح بشراء الدرس التالي بعد إكمال السابق", () => {
    const enrollment = makeEnrollment({
      completedLessons: [lessons[0].id],
    });

    expect(canPurchaseLesson(enrollment, lessons, lessons[1].id)).toBe(true);
    expect(canPurchaseLesson(enrollment, lessons, lessons[2].id)).toBe(false);
  });

  it("يحسب الدروس غير المشتراة وساعات الباقي", () => {
    const enrollment = makeEnrollment();
    const unpurchased = getUnpurchasedLessons(course, enrollment);
    expect(unpurchased.length).toBe(lessons.length - 1);
    expect(getRemainingCourseHours(course, enrollment)).toBeLessThan(course.hours);
    expect(getRemainingCourseHours(course, null)).toBe(course.hours);
  });
});
