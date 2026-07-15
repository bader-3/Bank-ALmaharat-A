"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTrainerById } from "@/lib/courses/mock-data";
import {
  getCatalogCourseRecommendations,
  type CatalogCourseRecommendation,
} from "@/lib/courses/recommendations";
import { DELIVERY_LABELS, LEVEL_LABELS } from "@/types/course";
import type { PlanningSession } from "@/types/noor";

type CourseSelectionStepProps = {
  session: PlanningSession;
  onToggleCourse: (courseSlug: string, selected: boolean, reason: string) => void;
  onToggleLesson: (courseSlug: string, lessonId: string) => void;
  onMoveCourse: (courseSlug: string, direction: -1 | 1) => void;
  onContinue: () => void;
};

export function CourseSelectionStep({
  session,
  onToggleCourse,
  onToggleLesson,
  onMoveCourse,
  onContinue,
}: CourseSelectionStepProps) {
  const recommendations = getCatalogCourseRecommendations(session.preferences);
  const selectionBySlug = new Map(
    session.courseSelections.map((selection) => [selection.courseSlug, selection]),
  );
  const selectedCount = session.courseSelections.filter(
    (selection) => selection.status === "selected",
  ).length;
  const orderedRecommendations = [...recommendations].sort((a, b) => {
    const aSelection = selectionBySlug.get(a.course.slug);
    const bSelection = selectionBySlug.get(b.course.slug);
    if (aSelection?.status === "selected" && bSelection?.status === "selected") {
      return aSelection.order - bSelection.order;
    }
    if (aSelection?.status === "selected") return -1;
    if (bSelection?.status === "selected") return 1;
    return b.score - a.score;
  });

  return (
    <section className="mt-8" aria-labelledby="course-selection-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge variant="gold">مرحلة اختيار الدورات</Badge>
          <h2 id="course-selection-title" className="mt-3 text-xl font-semibold text-navy-900">
            اختر الدورات والدروس بنفسك
          </h2>
          <p className="mt-1 text-sm text-foreground-secondary">
            هذه ترشيحات من فهرس المنصة فقط. لم تُحدّد نور دورة أو مدربًا نيابةً عنك، ولن تُعتمد
            الخطة في هذه المرحلة.
          </p>
        </div>
        <Badge variant={selectedCount ? "sage" : "neutral"}>
          {selectedCount ? `${selectedCount} دورة مختارة` : "لا توجد اختيارات بعد"}
        </Badge>
      </div>

      {orderedRecommendations.length ? (
        <div className="mt-5 space-y-4">
          {orderedRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.course.slug}
              recommendation={recommendation}
              selection={selectionBySlug.get(recommendation.course.slug)}
              selectedCount={selectedCount}
              onToggleCourse={onToggleCourse}
              onToggleLesson={onToggleLesson}
              onMoveCourse={onMoveCourse}
            />
          ))}
        </div>
      ) : (
        <Card padding="md" className="mt-5 border-border/60">
          <p className="text-sm text-foreground-secondary">
            لا توجد دورة في الفهرس تجمع قيود المجال والمستوى والنمط والوقت الحالية. عدّل تفضيلات
            الخطة للحصول على مرشحات مناسبة بدل اقتراح دورة خارج الفهرس.
          </p>
        </Card>
      )}
      <div className="mt-5 flex justify-end">
        <Button disabled={!selectedCount} onClick={onContinue}>
          متابعة إلى مراجعة المسودة
        </Button>
      </div>
    </section>
  );
}

type RecommendationCardProps = {
  recommendation: CatalogCourseRecommendation;
  selection?: PlanningSession["courseSelections"][number];
  selectedCount: number;
  onToggleCourse: CourseSelectionStepProps["onToggleCourse"];
  onToggleLesson: CourseSelectionStepProps["onToggleLesson"];
  onMoveCourse: CourseSelectionStepProps["onMoveCourse"];
};

function RecommendationCard({
  recommendation,
  selection,
  selectedCount,
  onToggleCourse,
  onToggleLesson,
  onMoveCourse,
}: RecommendationCardProps) {
  const { course, reason } = recommendation;
  const trainer = getTrainerById(course.trainerId);
  const selected = selection?.status === "selected";
  const selectedLessonIds = selection?.selectedLessonIds ?? [];

  return (
    <Card
      padding="lg"
      className={
        selected ? "border-sage-300 bg-sage-50/30" : "border-border/60 bg-surface"
      }
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {selected && <Badge variant="sage">الترتيب {selection.order + 1}</Badge>}
            <Badge variant="neutral">{LEVEL_LABELS[course.level]}</Badge>
            <Badge variant="neutral">{DELIVERY_LABELS[course.deliveryMode]}</Badge>
            <Badge variant="blue">{course.hours} ساعة</Badge>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-navy-900">{course.title}</h3>
          <p className="mt-1 text-sm text-foreground-secondary">{course.summary}</p>
          <p className="mt-3 text-sm font-medium text-sage-700">سبب الترشيح: {reason}</p>
          {trainer && (
            <div className="mt-4 rounded-xl border border-border/60 bg-surface px-4 py-3">
              <p className="text-xs text-foreground-muted">المدرب المعيّن للدورة في الفهرس</p>
              <p className="mt-1 text-sm font-semibold text-navy-900">{trainer.name}</p>
              <p className="text-xs text-foreground-secondary">{trainer.title}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {selected && (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={selection.order === 0}
                onClick={() => onMoveCourse(course.slug, -1)}
                aria-label={`تقديم دورة ${course.title}`}
              >
                لأعلى
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={selection.order >= selectedCount - 1}
                onClick={() => onMoveCourse(course.slug, 1)}
                aria-label={`تأخير دورة ${course.title}`}
              >
                لأسفل
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant={selected ? "secondary" : "primary"}
            onClick={() => onToggleCourse(course.slug, !selected, reason)}
          >
            {selected ? "إلغاء الاختيار" : "اختيار الدورة"}
          </Button>
        </div>
      </div>

      <details className="mt-5 border-t border-border/60 pt-4" open={selected}>
        <summary className="cursor-pointer text-sm font-semibold text-navy-900">
          المنهج: {course.syllabus.length} وحدات،{" "}
          {course.syllabus.reduce((sum, module) => sum + module.lessons.length, 0)} دروس
        </summary>
        <div className="mt-4 space-y-4">
          {course.syllabus.map((module) => (
            <div key={module.id}>
              <p className="text-sm font-semibold text-foreground">{module.title}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {module.lessons.map((lesson) => {
                  const checked = selectedLessonIds.includes(lesson.id);
                  return (
                    <label
                      key={lesson.id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-surface p-3"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-sage-600"
                        checked={checked}
                        disabled={!selected}
                        onChange={() => onToggleLesson(course.slug, lesson.id)}
                      />
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {lesson.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground-muted">
                          {lesson.durationMinutes} دقيقة
                        </span>
                        <span className="mt-1 block text-xs text-foreground-secondary">
                          {lesson.outcomes[0]}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}
