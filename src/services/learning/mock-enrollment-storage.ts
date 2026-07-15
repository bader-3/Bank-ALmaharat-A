import { isBrowser, logFirestoreError } from "@/services/firebase/common";
import { saveCloudEnrollments } from "@/services/firebase/enrollments";
import type { Course } from "@/types/course";
import type { Enrollment } from "@/types/learning";
import {
  getLessonsForCourse,
  getLessonHours,
  isLessonPurchased,
} from "@/lib/learning/lessons";
import { getCourseBySlug } from "@/lib/courses/mock-data";

const ENROLLMENTS_KEY = "asb-enrollments";

function normalizeEnrollment(raw: Enrollment): Enrollment {
  const course = getCourseBySlug(raw.courseSlug);
  const lessons = course ? getLessonsForCourse(course) : [];

  if (raw.purchasedLessons?.length && typeof raw.hoursUsed === "number") {
    return raw;
  }

  // ترحيل التسجيلات القديمة التي كانت تخصم الدورة كاملة
  const purchasedLessons =
    raw.purchasedLessons?.length > 0
      ? raw.purchasedLessons
      : lessons.map((lesson) => lesson.id);

  return {
    ...raw,
    purchasedLessons,
    hoursUsed:
      typeof raw.hoursUsed === "number"
        ? raw.hoursUsed
        : purchasedLessons.reduce((sum, lessonId) => {
            const lesson = lessons.find((item) => item.id === lessonId);
            return sum + (lesson ? getLessonHours(lesson) : 0);
          }, 0),
  };
}

function readAll(): Enrollment[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(ENROLLMENTS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as Enrollment[]).map(normalizeEnrollment);
  } catch {
    return [];
  }
}

function writeAll(enrollments: Enrollment[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
  const byUser = enrollments.reduce<Record<string, Enrollment[]>>((groups, item) => {
    groups[item.userId] ??= [];
    groups[item.userId].push(item);
    return groups;
  }, {});
  for (const [userId, items] of Object.entries(byUser)) {
    void saveCloudEnrollments(userId, items).catch((error) => {
      logFirestoreError("enrollments", error);
    });
  }
}

export function replaceUserEnrollments(userId: string, items: Enrollment[]) {
  const others = readAll().filter((item) => item.userId !== userId);
  writeAll([...others, ...items]);
}

function createId() {
  return `enr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getEnrollmentsForUser(userId: string): Enrollment[] {
  return readAll()
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
}

export function getEnrollmentBySlug(userId: string, courseSlug: string): Enrollment | null {
  return readAll().find((e) => e.userId === userId && e.courseSlug === courseSlug) ?? null;
}

export function createEnrollment(
  userId: string,
  course: Course,
  firstLessonId: string,
  firstLessonHours: number,
): Enrollment {
  return createEnrollmentWithLessons(userId, course, [firstLessonId], firstLessonHours);
}

export function createEnrollmentWithLessons(
  userId: string,
  course: Course,
  lessonIds: string[],
  hoursUsed: number,
): Enrollment {
  const enrollment: Enrollment = {
    id: createId(),
    userId,
    courseId: course.id,
    courseSlug: course.slug,
    courseTitle: course.title,
    totalHours: course.hours,
    hoursUsed: Math.round(hoursUsed * 100) / 100,
    purchasedLessons: lessonIds,
    completedLessons: [],
    progress: 0,
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  writeAll([...readAll(), enrollment]);
  return enrollment;
}

export function purchaseLessonInEnrollment(
  userId: string,
  courseSlug: string,
  lessonId: string,
  lessonHours: number,
): Enrollment | null {
  return purchaseLessonsInEnrollment(userId, courseSlug, [lessonId], lessonHours);
}

export function purchaseLessonsInEnrollment(
  userId: string,
  courseSlug: string,
  lessonIds: string[],
  totalHours: number,
): Enrollment | null {
  if (lessonIds.length === 0) return null;

  const all = readAll();
  const index = all.findIndex((e) => e.userId === userId && e.courseSlug === courseSlug);
  if (index === -1) return null;

  const enrollment = all[index];
  const newIds = lessonIds.filter((id) => !isLessonPurchased(enrollment, id));
  if (newIds.length === 0) return enrollment;

  const updated: Enrollment = {
    ...enrollment,
    purchasedLessons: [...enrollment.purchasedLessons, ...newIds],
    hoursUsed: Math.round((enrollment.hoursUsed + totalHours) * 100) / 100,
    lastActiveAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeAll(all);
  return updated;
}

export function completeLesson(userId: string, courseSlug: string, lessonId: string): Enrollment | null {
  const all = readAll();
  const index = all.findIndex((e) => e.userId === userId && e.courseSlug === courseSlug);
  if (index === -1) return null;

  const enrollment = all[index];
  if (!isLessonPurchased(enrollment, lessonId)) return enrollment;
  if (enrollment.completedLessons.includes(lessonId)) return enrollment;

  const course = getCourseBySlug(courseSlug);
  if (!course) return enrollment;
  const lessons = getLessonsForCourse(course);
  const completedLessons = [...enrollment.completedLessons, lessonId];
  const progress = Math.round((completedLessons.length / lessons.length) * 100);

  const updated: Enrollment = {
    ...enrollment,
    completedLessons,
    progress: Math.min(progress, 100),
    lastActiveAt: new Date().toISOString(),
  };

  all[index] = updated;
  writeAll(all);
  return updated;
}
