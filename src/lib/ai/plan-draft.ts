import { weekdayIndexFromLabel } from "@/lib/goals/weekdays";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import type { LearningPlan } from "@/types/ai";
import type {
  CourseSelection,
  PlanDraft,
  PlanDraftCourse,
  PlanDraftLesson,
  PlanningPreferences,
} from "@/types/noor";

function roundHours(value: number) {
  return Math.max(0.25, Math.round(value * 4) / 4);
}

function cloneDraft(draft: PlanDraft): PlanDraft {
  return JSON.parse(JSON.stringify(draft)) as PlanDraft;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(value: string) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    if (/مساء|ليل|م/.test(value) && hour < 12) hour += 12;
    return Math.min(23 * 60 + 59, hour * 60 + minute);
  }
  if (/صباح|فجر/.test(value)) return 9 * 60;
  if (/ظهر/.test(value)) return 13 * 60;
  if (/عصر/.test(value)) return 16 * 60;
  if (/ليل/.test(value)) return 20 * 60;
  return 18 * 60;
}

function formatTime(minutes: number) {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, minutes));
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function scheduleLessons(
  lessons: Array<PlanDraftLesson & { courseSlug: string; courseTitle: string }>,
  draft: PlanDraft,
) {
  const availableDayIndexes = new Set(
    (draft.availableDays.length ? draft.availableDays : ["السبت"])
      .map((day) => weekdayIndexFromLabel(day))
      .filter((day): day is number => day !== undefined),
  );
  if (!availableDayIndexes.size) availableDayIndexes.add(6);

  const preferredTimes = draft.preferredTimes?.length ? draft.preferredTimes : ["مساءً"];
  const startMinutes = preferredTimes.map(timeToMinutes);
  const weeklyBudget = Math.max(30, Math.round(Math.max(0.5, draft.weeklyHours) * 60));
  const durationWeeks = Math.max(1, Math.round(draft.durationWeeks || draft.totalWeeks || 1));
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
  const weeklyTarget = Math.min(weeklyBudget, Math.max(1, Math.ceil(totalMinutes / durationWeeks)));
  const breakMinutes = Math.max(0, Math.round(draft.breakMinutes ?? 15));
  const dailyTarget = Math.max(30, Math.ceil(weeklyTarget / availableDayIndexes.size));
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const schedule: PlanDraft["schedule"] = [];
  let lessonIndex = 0;
  let week = 1;

  while (lessonIndex < lessons.length) {
    let weeklyUsed = 0;
    let scheduledThisWeek = false;

    for (let dayOffset = 0; dayOffset < 7 && lessonIndex < lessons.length; dayOffset += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (week - 1) * 7 + dayOffset);
      if (!availableDayIndexes.has(date.getDay())) continue;

      let dailyUsed = 0;
      let sessionIndex = 0;
      let nextAvailable = startMinutes[0];
      while (lessonIndex < lessons.length) {
        const lesson = lessons[lessonIndex];
        const fitsWeek = weeklyUsed === 0 || weeklyUsed + lesson.durationMinutes <= weeklyTarget;
        const fitsDay = dailyUsed === 0 || dailyUsed + lesson.durationMinutes <= dailyTarget;
        if (!fitsWeek || !fitsDay) break;

        const preferredStart = startMinutes[Math.min(sessionIndex, startMinutes.length - 1)];
        const startTime = Math.max(preferredStart, nextAvailable);
        schedule.push({
          id: `${lesson.courseSlug}-${lesson.id}`,
          week,
          day:
            draft.availableDays.find((day) => weekdayIndexFromLabel(day) === date.getDay()) ??
            "السبت",
          scheduledDate: toDateKey(date),
          startTime: formatTime(startTime),
          durationMinutes: lesson.durationMinutes,
          courseSlug: lesson.courseSlug,
          lessonId: lesson.id,
          title: lesson.title,
          hours: roundHours(lesson.durationMinutes / 60),
        });
        weeklyUsed += lesson.durationMinutes;
        dailyUsed += lesson.durationMinutes;
        nextAvailable = startTime + lesson.durationMinutes + breakMinutes;
        lessonIndex += 1;
        sessionIndex += 1;
        scheduledThisWeek = true;
      }
    }

    if (!scheduledThisWeek && lessonIndex < lessons.length) {
      const lesson = lessons[lessonIndex];
      const date = new Date(startDate);
      const targetDay = [...availableDayIndexes][0];
      const offset = (targetDay - date.getDay() + 7) % 7;
      date.setDate(date.getDate() + (week - 1) * 7 + offset);
      schedule.push({
        id: `${lesson.courseSlug}-${lesson.id}`,
        week,
        day: draft.availableDays[0] ?? "السبت",
        scheduledDate: toDateKey(date),
        startTime: formatTime(startMinutes[0]),
        durationMinutes: lesson.durationMinutes,
        courseSlug: lesson.courseSlug,
        lessonId: lesson.id,
        title: lesson.title,
        hours: roundHours(lesson.durationMinutes / 60),
      });
      lessonIndex += 1;
    }
    week += 1;
    if (week > durationWeeks + lessons.length + 2) break;
  }

  return { schedule, totalWeeks: Math.max(durationWeeks, schedule.at(-1)?.week ?? 1) };
}

function buildCourse(selection: CourseSelection): PlanDraftCourse | null {
  const course = getCourseBySlug(selection.courseSlug);
  if (!course) return null;
  const selectedIds = new Set(selection.selectedLessonIds);
  const includeAll = selectedIds.size === 0;
  return {
    courseSlug: course.slug,
    title: course.title,
    order: selection.order,
    included: true,
    lessons: course.syllabus.flatMap((module) =>
      module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        durationMinutes: lesson.durationMinutes,
        outcome: lesson.outcomes[0] ?? `إتمام ${lesson.title}`,
        included: includeAll || selectedIds.has(lesson.id),
      })),
    ),
  };
}

export function rebuildPlanDraft(draft: PlanDraft): PlanDraft {
  const activeCourses = draft.courses
    .filter((course) => course.included)
    .sort((a, b) => a.order - b.order);
  const lessons = activeCourses.flatMap((course) =>
    course.lessons
      .filter((lesson) => lesson.included)
      .map((lesson) => ({ ...lesson, courseSlug: course.courseSlug, courseTitle: course.title })),
  );
  const lessonHours = lessons.reduce((sum, lesson) => sum + lesson.durationMinutes / 60, 0);
  const totalHours = lessonHours ? roundHours(lessonHours) : 0;
  const { schedule, totalWeeks } = scheduleLessons(lessons, draft);

  const weeks = Array.from({ length: totalWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const items = schedule.filter((item) => item.week === weekNumber);
    const course = activeCourses.find((item) => item.courseSlug === items[0]?.courseSlug);
    return {
      week: weekNumber,
      title: course?.title ?? draft.title,
      courseSlug: course?.courseSlug ?? activeCourses[0]?.courseSlug ?? "",
      hours: roundHours(items.reduce((sum, item) => sum + item.hours, 0)),
      focus: items.length
        ? items.map((item) => item.title).join("، ")
        : "تطبيق عملي ومراجعة ما سبق",
    };
  });

  return {
    ...draft,
    totalHours,
    totalWeeks,
    preferredTimes: draft.preferredTimes?.length ? draft.preferredTimes : ["مساءً"],
    durationWeeks: Math.max(1, Math.round(draft.durationWeeks || draft.totalWeeks || totalWeeks)),
    breakMinutes: Math.max(0, Math.round(draft.breakMinutes ?? 15)),
    estimatedCostHours: totalHours,
    schedule,
    weeks,
    updatedAt: new Date().toISOString(),
  };
}

export function createPlanDraft(
  preferences: PlanningPreferences,
  selections: CourseSelection[],
): PlanDraft {
  const now = new Date().toISOString();
  const courses = selections
    .filter((selection) => selection.status === "selected")
    .sort((a, b) => a.order - b.order)
    .flatMap((selection) => {
      const course = buildCourse(selection);
      return course ? [course] : [];
    });
  const domain = preferences.domain ?? "المجال المختار";
  const draft: PlanDraft = {
    id: `draft-${Date.now()}`,
    title: `خطة ${domain}`,
    summary: `مسودة مبنية على اختياراتك للوصول إلى: ${preferences.goal ?? "هدفك التعليمي"}.`,
    totalWeeks: preferences.durationWeeks ?? 1,
    totalHours: 0,
    weeklyHours: preferences.weeklyHours ?? 3,
    availableDays: preferences.availableDays ?? ["السبت"],
    preferredTimes: preferences.preferredTimes ?? ["مساءً"],
    durationWeeks: preferences.durationWeeks ?? 1,
    breakMinutes: 15,
    estimatedCostHours: 0,
    estimatedCostAmount: preferences.budgetAmount,
    measurableOutcome: `إكمال الدروس المختارة وتسليم مشروع يثبت القدرة على ${preferences.goal ?? domain}.`,
    appliedProject: {
      title: `مشروع تطبيقي في ${domain}`,
      description: `تطبيق عملي يجمع المهارات المكتسبة من الدورات المختارة.`,
      deliverable: "نموذج مكتمل قابل للعرض والتقييم مع ملخص للقرارات والنتائج.",
    },
    courses,
    schedule: [],
    weeks: [],
    courseSelections: selections,
    createdAt: now,
    updatedAt: now,
  };
  return rebuildPlanDraft(draft);
}

export function replaceDraftCourse(
  draft: PlanDraft,
  oldCourseSlug: string,
  selection: CourseSelection,
): PlanDraft {
  const replacement = buildCourse(selection);
  if (!replacement) return draft;
  const old = draft.courses.find((course) => course.courseSlug === oldCourseSlug);
  replacement.order = old?.order ?? replacement.order;
  return rebuildPlanDraft({
    ...cloneDraft(draft),
    courses: [
      ...draft.courses.filter(
        (course) => course.courseSlug !== oldCourseSlug && course.courseSlug !== selection.courseSlug,
      ),
      replacement,
    ],
  });
}

export function draftToLearningPlan(draft: PlanDraft): LearningPlan {
  const suggestedPackageId =
    draft.estimatedCostHours <= 5
      ? "explore"
      : draft.estimatedCostHours <= 15
        ? "standard"
        : "intensive";
  return {
    totalWeeks: draft.totalWeeks,
    totalHours: draft.totalHours,
    suggestedPackageId,
    packageReason: `تغطي نحو ${draft.estimatedCostHours} ساعة تعليمية في المسودة المعتمدة.`,
    weeks: draft.weeks,
  };
}
