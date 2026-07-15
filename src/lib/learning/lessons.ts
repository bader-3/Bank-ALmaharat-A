import type { Enrollment, Lesson } from "@/types/learning";
import type { Course } from "@/types/course";
import { formatMinutesDuration } from "@/lib/format/duration";

export function getLessonsForCourse(course: Course): Lesson[] {
  return course.syllabus.flatMap((module) =>
    module.lessons.map(({ id, title, durationMinutes }) => ({
      id,
      title,
      durationMinutes,
    })),
  );
}

export function getLessonHours(lesson: Pick<Lesson, "durationMinutes">): number {
  return Math.round((lesson.durationMinutes / 60) * 100) / 100;
}

export function formatLessonHours(
  lesson: Pick<Lesson, "durationMinutes">,
  compact = true,
): string {
  return formatMinutesDuration(lesson.durationMinutes, compact);
}

export function getFirstLesson(course: Course): Lesson | null {
  return getLessonsForCourse(course)[0] ?? null;
}

export function isLessonPurchased(enrollment: Enrollment, lessonId: string): boolean {
  return enrollment.purchasedLessons.includes(lessonId);
}

export function canCompleteLesson(
  enrollment: Enrollment,
  lessons: Lesson[],
  lessonId: string,
): boolean {
  if (!isLessonPurchased(enrollment, lessonId)) return false;
  if (enrollment.completedLessons.includes(lessonId)) return false;

  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index <= 0) return true;

  return enrollment.completedLessons.includes(lessons[index - 1].id);
}

export function canPurchaseLesson(
  enrollment: Enrollment | null,
  lessons: Lesson[],
  lessonId: string,
): boolean {
  if (!enrollment) return false;
  if (isLessonPurchased(enrollment, lessonId)) return false;

  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return false;
  if (index === 0) return false;

  return enrollment.completedLessons.includes(lessons[index - 1].id);
}

export function getNextUnpurchasedLesson(
  course: Course,
  enrollment: Enrollment,
): Lesson | null {
  const lessons = getLessonsForCourse(course);
  return (
    lessons.find(
      (lesson, index) =>
        !isLessonPurchased(enrollment, lesson.id) &&
        (index === 0 || enrollment.completedLessons.includes(lessons[index - 1].id)),
    ) ?? null
  );
}

export function getUnpurchasedLessons(
  course: Course,
  enrollment: Enrollment | null,
): Lesson[] {
  const lessons = getLessonsForCourse(course);
  if (!enrollment) return lessons;
  return lessons.filter((lesson) => !isLessonPurchased(enrollment, lesson.id));
}

export function getRemainingCourseHours(
  course: Course,
  enrollment: Enrollment | null,
): number {
  return getUnpurchasedLessons(course, enrollment).reduce(
    (sum, lesson) => sum + getLessonHours(lesson),
    0,
  );
}
