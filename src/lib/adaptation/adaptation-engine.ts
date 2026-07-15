import { COURSES, getCourseBySlug } from "@/lib/courses/mock-data";
import { getLessonsForCourse } from "@/lib/learning/lessons";
import type {
  AdaptationKind,
  AdaptationSuggestion,
  PlanSnapshot,
  ProgressSummary,
} from "@/types/adaptation";
import type { GoalPlan, LearningGoal } from "@/types/goals";
import type { Enrollment } from "@/types/learning";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function percent(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

export function buildProgressSummary(
  plan: GoalPlan,
  enrollments: Enrollment[],
  now = new Date(),
): ProgressSummary {
  const today = dateKey(now);
  const goals = plan.goals;
  const completedGoals = goals.filter((goal) => goal.completedAt);
  const overdue = goals.filter(
    (goal) => !goal.completedAt && (goal.originalDate || goal.scheduledDate) < today,
  );
  const lessonGoals = goals.filter((goal) => goal.courseSlug && goal.lessonId);
  const completedLessonKeys = new Set(
    enrollments.flatMap((enrollment) =>
      enrollment.completedLessons.map((lessonId) => `${enrollment.courseSlug}:${lessonId}`),
    ),
  );
  const plannedLessonKeys = new Set(
    lessonGoals.map((goal) => `${goal.courseSlug}:${goal.lessonId}`),
  );
  const completedPlannedLessons = [...plannedLessonKeys].filter((key) =>
    completedLessonKeys.has(key),
  ).length;
  const stalled = new Map<string, LearningGoal[]>();
  overdue.forEach((goal) => {
    if (!goal.courseSlug) return;
    const current = stalled.get(goal.courseSlug) ?? [];
    current.push(goal);
    stalled.set(goal.courseSlug, current);
  });
  const plannedMinutes = goals.reduce((sum, goal) => sum + goal.durationMinutes, 0);
  const completedPlanned = completedGoals.reduce(
    (sum, goal) => sum + goal.durationMinutes,
    0,
  );

  return {
    generatedAt: now.toISOString(),
    lessons: {
      planned: plannedLessonKeys.size,
      completed: completedPlannedLessons,
      percent: percent(completedPlannedLessons, plannedLessonKeys.size),
    },
    goals: {
      total: goals.length,
      completed: completedGoals.length,
      overdue: overdue.length,
      percent: percent(completedGoals.length, goals.length),
    },
    minutes: {
      planned: plannedMinutes,
      completedPlanned,
      remaining: Math.max(0, plannedMinutes - completedPlanned),
    },
    adherencePercent: percent(
      goals.filter((goal) => {
        if (!goal.completedAt) return false;
        return goal.completedAt.slice(0, 10) <= goal.scheduledDate;
      }).length,
      goals.filter((goal) => goal.completedAt || goal.scheduledDate <= today).length,
    ),
    delayedMinutes: overdue.reduce((sum, goal) => sum + goal.durationMinutes, 0),
    stalledCourses: [...stalled.entries()]
      .filter(([, courseGoals]) => courseGoals.length >= 2)
      .map(([courseSlug, courseGoals]) => ({
        courseSlug,
        courseTitle: getCourseBySlug(courseSlug)?.title ?? courseSlug,
        overdueGoals: courseGoals.length,
        delayedMinutes: courseGoals.reduce((sum, goal) => sum + goal.durationMinutes, 0),
      })),
    measurementNote:
      "الدقائق المنجزة هنا هي مجموع المدد المخططة للأهداف المكتملة، وليست قياساً للوقت الفعلي.",
  };
}

function snapshot(goals: LearningGoal[], today: string): PlanSnapshot {
  const nextWeek = addDays(today, 7);
  return {
    goals,
    plannedMinutes: goals.reduce((sum, goal) => sum + goal.durationMinutes, 0),
    overdueGoals: goals.filter(
      (goal) => !goal.completedAt && (goal.originalDate || goal.scheduledDate) < today,
    ).length,
    weeklyMinutes: goals
      .filter(
        (goal) =>
          !goal.completedAt && goal.scheduledDate >= today && goal.scheduledDate < nextWeek,
      )
      .reduce((sum, goal) => sum + goal.durationMinutes, 0),
  };
}

function suggestion(
  kind: AdaptationKind,
  title: string,
  reason: string,
  impact: string,
  beforeGoals: LearningGoal[],
  afterGoals: LearningGoal[],
  today: string,
): AdaptationSuggestion {
  const signature = `${kind}:${reason}:${beforeGoals.length}:${afterGoals.length}`;
  let hash = 0;
  for (const char of signature) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return {
    id: `adapt_${kind}_${Math.abs(hash)}`,
    kind,
    title,
    reason,
    impact,
    requiresApproval: true,
    before: snapshot(beforeGoals, today),
    after: snapshot(afterGoals, today),
    createdAt: new Date().toISOString(),
  };
}

export function generateAdaptationSuggestions(
  plan: GoalPlan,
  enrollments: Enrollment[],
  now = new Date(),
): AdaptationSuggestion[] {
  const today = dateKey(now);
  const goals = plan.goals;
  if (!goals.length) return [];
  const summary = buildProgressSummary(plan, enrollments, now);
  const suggestions: AdaptationSuggestion[] = [];
  const overdueIds = new Set(
    goals
      .filter((goal) => !goal.completedAt && (goal.originalDate || goal.scheduledDate) < today)
      .map((goal) => goal.id),
  );

  if (overdueIds.size) {
    let offset = 0;
    const redistributed = goals.map((goal) =>
      overdueIds.has(goal.id)
        ? { ...goal, scheduledDate: addDays(today, offset++ % 7) }
        : goal,
    );
    suggestions.push(
      suggestion(
        "redistribute",
        "إعادة توزيع المتأخرات",
        `لديك ${overdueIds.size} أهداف متأخرة بإجمالي ${summary.delayedMinutes} دقيقة مخططة.`,
        "يوزّع الأهداف المتأخرة على الأيام السبعة القادمة دون حذفها.",
        goals,
        redistributed,
        today,
      ),
    );
  }

  if (summary.adherencePercent < 60 && summary.goals.total >= 4) {
    let index = 0;
    const lighter = goals.map((goal) => {
      if (goal.completedAt || goal.scheduledDate < today) return goal;
      index += 1;
      return index % 2 === 0
        ? { ...goal, scheduledDate: addDays(goal.scheduledDate, 7) }
        : goal;
    });
    suggestions.push(
      suggestion(
        "decrease_load",
        "تخفيف الحمل الأسبوعي",
        `الالتزام الحالي ${summary.adherencePercent}٪؛ الحمل الحالي قد يكون أعلى من المتاح.`,
        "يرحّل نصف الأهداف القادمة أسبوعاً مع إبقاء المحتوى والمدة الإجمالية.",
        goals,
        lighter,
        today,
      ),
    );
  } else if (
    summary.adherencePercent >= 85 &&
    summary.goals.overdue === 0 &&
    summary.goals.completed >= 3
  ) {
    const faster = goals.map((goal) =>
      !goal.completedAt && goal.scheduledDate > today
        ? { ...goal, scheduledDate: addDays(goal.scheduledDate, -1) }
        : goal,
    );
    suggestions.push(
      suggestion(
        "increase_load",
        "زيادة الحمل تدريجياً",
        `الالتزام ${summary.adherencePercent}٪ ولا توجد أهداف متأخرة.`,
        "يقرّب الأهداف القادمة يوماً واحداً فقط.",
        goals,
        faster,
        today,
      ),
    );
  }

  const stalled = summary.stalledCourses[0];
  if (stalled) {
    const firstPending = goals.find(
      (goal) => goal.courseSlug === stalled.courseSlug && !goal.completedAt,
    );
    if (firstPending) {
      const review: LearningGoal = {
        ...firstPending,
        id: `review_${firstPending.id}`,
        title: `مراجعة: ${firstPending.title}`,
        description: "مراجعة قصيرة قبل استكمال الدرس المتعثر.",
        durationMinutes: Math.min(30, firstPending.durationMinutes),
        scheduledDate: today,
        originalDate: today,
        createdAt: now.toISOString(),
      };
      suggestions.push(
        suggestion(
          "review",
          "إضافة مراجعة قصيرة",
          `تراكم ${stalled.overdueGoals} أهداف في «${stalled.courseTitle}» يشير إلى تعثر محتمل.`,
          "يضيف جلسة مراجعة مخططة بحد أقصى 30 دقيقة؛ لا يفترض سبب التعثر.",
          goals,
          [review, ...goals],
          today,
        ),
      );
    }

    const currentCourse = getCourseBySlug(stalled.courseSlug);
    const alternative = currentCourse
      ? COURSES.find(
          (course) =>
            course.slug !== currentCourse.slug &&
            course.specialtyId === currentCourse.specialtyId &&
            course.level === currentCourse.level,
        )
      : undefined;
    if (alternative) {
      const alternativeLessons = getLessonsForCourse(alternative);
      let lessonIndex = 0;
      const replaced = goals.map((goal) => {
        if (goal.courseSlug !== stalled.courseSlug || goal.completedAt) return goal;
        const lesson = alternativeLessons[lessonIndex++ % alternativeLessons.length];
        return {
          ...goal,
          courseSlug: alternative.slug,
          lessonId: lesson.id,
          title: lesson.title,
          durationMinutes: lesson.durationMinutes,
        };
      });
      suggestions.push(
        suggestion(
          "catalog_alternative",
          `بديل من الفهرس: ${alternative.title}`,
          `استمرار التعثر المحتمل في «${stalled.courseTitle}»؛ البديل من المجال والمستوى نفسيهما.`,
          "يستبدل الأهداف غير المكتملة فقط، ولا يسجّلك أو يخصم ساعات تلقائياً.",
          goals,
          replaced,
          today,
        ),
      );
    }
  }

  const completedKeys = new Set(
    enrollments.flatMap((enrollment) =>
      enrollment.completedLessons.map((lessonId) => `${enrollment.courseSlug}:${lessonId}`),
    ),
  );
  const masteredDuplicates = goals.filter(
    (goal) =>
      !goal.completedAt &&
      goal.courseSlug &&
      goal.lessonId &&
      completedKeys.has(`${goal.courseSlug}:${goal.lessonId}`),
  );
  if (masteredDuplicates.length) {
    const duplicateIds = new Set(masteredDuplicates.map((goal) => goal.id));
    suggestions.push(
      suggestion(
        "skip_mastered",
        "تجاوز درس مكتمل مسبقاً",
        `${masteredDuplicates.length} من أهداف الخطة تشير إلى دروس أُكملت في سجل التعلم.`,
        "يحذف تكرار الدرس من الجدول فقط؛ الإكمال السابق هو دليل التجاوز وليس اختبار إتقان.",
        goals,
        goals.filter((goal) => !duplicateIds.has(goal.id)),
        today,
      ),
    );
  }

  return suggestions;
}
