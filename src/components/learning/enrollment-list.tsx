import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import type { Enrollment } from "@/types/learning";

export function EnrollmentList({
  enrollments,
  completed,
}: {
  enrollments: Enrollment[];
  completed?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {enrollments.map((enrollment) => (
        <li key={enrollment.id}>
          <Card
            padding="md"
            interactive
            className="flex flex-col gap-4 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-navy-900">{enrollment.courseTitle}</p>
                {completed && (
                  <Badge variant="sage">
                    <IconCheck size={12} className="me-1" />
                    مكتمل
                  </Badge>
                )}
              </div>
              {!completed && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-muted">
                    <div
                      className="h-full rounded-full bg-sage-500 transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-foreground-secondary">
                    {enrollment.progress}٪
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-foreground-muted">
                {formatHoursAndMinutes(enrollment.hoursUsed, true)} مستخدمة
                {completed
                  ? ` — اكتمل ${new Date(enrollment.lastActiveAt).toLocaleDateString("ar-SA")}`
                  : ` — آخر نشاط ${new Date(enrollment.lastActiveAt).toLocaleDateString("ar-SA")}`}
              </p>
            </div>
            <Button href={ROUTES.learn(enrollment.courseSlug)} variant="secondary" size="sm">
              {completed ? "مراجعة" : "متابعة"}
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}
