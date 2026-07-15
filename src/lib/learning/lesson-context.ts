import type { Course, CourseLesson, CourseModule } from "@/types/course";

export function findCourseLesson(
  course: Course,
  lessonId: string,
): { lesson: CourseLesson; module: CourseModule } | null {
  for (const courseModule of course.syllabus) {
    const lesson = courseModule.lessons.find((item) => item.id === lessonId);
    if (lesson) return { lesson, module: courseModule };
  }
  return null;
}

export function buildLessonContext(course: Course, lessonId: string): string | null {
  const found = findCourseLesson(course, lessonId);
  if (!found) return null;

  const { lesson, module } = found;
  const outcomes = lesson.outcomes.length
    ? lesson.outcomes.map((item) => `- ${item}`).join("\n")
    : "- مراجعة المفاهيم الأساسية للدرس";

  return `دورة «${course.title}»: ${course.summary}

الوحدة: ${module.title}
الدرس: «${lesson.title}» (~${lesson.durationMinutes} دقيقة)

مخرجات الدرس:
${outcomes}

محتوى الدرس (للمراجعة):
- مقدمة للموضوع وأهداف الدرس
- شرح المفاهيم الأساسية بأمثلة عملية
- تمرين تطبيقي قصير
- ملخص ونقاط للمراجعة`;
}
