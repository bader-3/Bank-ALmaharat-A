import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import type { Enrollment } from "@/types/learning";
import type { PlanningSession } from "@/types/noor";

export function ApprovedPathCard({
  session,
  enrollments = [],
}: {
  session: PlanningSession;
  enrollments?: Enrollment[];
}) {
  const draft = session.draft;
  if (!draft) return null;

  const courses = draft.courses.filter((course) => course.included).sort((a, b) => a.order - b.order);
  const enrollmentBySlug = new Map(enrollments.map((e) => [e.courseSlug, e]));

  return (
    <Card padding="lg" className="border-sage-200 bg-sage-50/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-sage-700" />
            <p className="text-xs font-semibold text-sage-700">المسار المعتمد</p>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-navy-900">{draft.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">{draft.summary}</p>
        </div>
        <Badge variant="sage">
          {draft.totalWeeks} أسبوع · {draft.totalHours} ساعة
        </Badge>
      </div>

      {draft.measurableOutcome && (
        <p className="mt-4 rounded-xl border border-sage-200/60 bg-surface px-4 py-3 text-sm text-foreground-secondary">
          <span className="font-semibold text-navy-900">النتيجة المتوقعة: </span>
          {draft.measurableOutcome}
        </p>
      )}

      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {courses.map((course, index) => {
          const enrollment = enrollmentBySlug.get(course.courseSlug);
          const includedLessons = course.lessons.filter((lesson) => lesson.included);
          const completedCount = enrollment
            ? includedLessons.filter((lesson) => enrollment.completedLessons.includes(lesson.id)).length
            : 0;

          return (
            <li
              key={course.courseSlug}
              className="flex items-center gap-3 rounded-xl border border-sage-200/70 bg-surface p-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-bold text-sage-700">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-900">{course.title}</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {includedLessons.length} درس ضمن الخطة
                  {enrollment ? ` · ${completedCount}/${includedLessons.length} مكتمل` : ""}
                </p>
                {enrollment && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background-muted">
                    <div
                      className="h-full rounded-full bg-sage-500"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button href={ROUTES.goals} size="sm">
          متابعة أهداف المسار
        </Button>
        <Button href={ROUTES.activity} variant="secondary" size="sm">
          سجل التعلّم
        </Button>
        <Button href={ROUTES.noor} variant="ghost" size="sm">
          مراجعة الخطة مع نور
        </Button>
      </div>
    </Card>
  );
}
