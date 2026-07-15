"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import type { LessonReviewSession } from "@/types/review";

export function ReviewSessionList({ sessions }: { sessions: LessonReviewSession[] }) {
  return (
    <ul className="space-y-3">
      {sessions.map((session) => (
        <li key={session.id}>
          <Card padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-navy-900">{session.lessonTitle}</p>
                <ReviewStatusBadge session={session} />
              </div>
              <p className="mt-1 text-sm text-foreground-secondary">{session.courseTitle}</p>
              {session.quiz?.score !== undefined && (
                <p className="mt-1 text-xs text-foreground-muted">
                  نتيجة الاختبار: {session.quiz.score}٪
                </p>
              )}
            </div>
            <Button
              href={ROUTES.review(session.courseSlug, session.lessonId)}
              variant="secondary"
              size="sm"
            >
              {session.status === "in_progress" ? "متابعة المراجعة" : "عرض الجلسة"}
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function ReviewStatusBadge({ session }: { session: LessonReviewSession }) {
  if (session.status === "completed") {
    return <Badge variant="sage">مراجعة مكتملة</Badge>;
  }
  if (session.status === "skipped") {
    return <Badge variant="neutral">تم التخطّي</Badge>;
  }
  return <Badge variant="gold">قيد المراجعة</Badge>;
}
