"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCatalogCourseRecommendations } from "@/lib/courses/recommendations";
import type { PlanVersion, PlanningSession } from "@/types/noor";
import { useState } from "react";

type PlanDraftEditorProps = {
  session: PlanningSession;
  isAccepting: boolean;
  onAccept: () => void;
  onReject: () => void;
  onWeeklyHoursChange: (hours: number) => void;
  onDaysChange: (days: string[]) => void;
  onMoveCourse: (courseSlug: string, direction: -1 | 1) => void;
  onReplaceCourse: (oldCourseSlug: string, newCourseSlug: string) => void;
  onToggleCourse: (courseSlug: string) => void;
  onToggleLesson: (courseSlug: string, lessonId: string) => void;
  onMakeFaster: () => void;
  onMakeLighter: () => void;
  onRestoreVersion: (version: PlanVersion) => void;
  onStartDiscovery: () => void;
};

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

export function PlanDraftEditor({
  session,
  isAccepting,
  onAccept,
  onReject,
  onWeeklyHoursChange,
  onDaysChange,
  onMoveCourse,
  onReplaceCourse,
  onToggleCourse,
  onToggleLesson,
  onMakeFaster,
  onMakeLighter,
  onRestoreVersion,
  onStartDiscovery,
}: PlanDraftEditorProps) {
  const draft = session.draft;
  const [showVersions, setShowVersions] = useState(false);
  if (!draft) return null;

  const alternatives = getCatalogCourseRecommendations(session.preferences).filter(
    ({ course }) => !draft.courses.some((item) => item.courseSlug === course.slug && item.included),
  );
  const activeCourses = draft.courses.filter((course) => course.included);

  return (
    <section className="mt-8" aria-labelledby="plan-draft-title">
      <Card padding="lg" className="border-gold-200/70 bg-gold-50/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gold">مسودة غير معتمدة</Badge>
              <Badge variant="neutral">النسخة {session.versions.length}</Badge>
            </div>
            <h2 id="plan-draft-title" className="mt-3 text-2xl font-semibold text-navy-900">
              {draft.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-foreground-secondary">{draft.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onStartDiscovery}>
              تعديل الدورات
            </Button>
            <Button size="sm" variant="secondary" onClick={onMakeFaster}>
              اجعلها أسرع
            </Button>
            <Button size="sm" variant="secondary" onClick={onMakeLighter}>
              اجعلها أخف
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="المدة المبدئية" value={`${draft.totalWeeks} أسبوع`} />
          <Stat label="الوقت الإجمالي" value={`${draft.totalHours} ساعة`} />
          <Stat label="التكلفة المقدّرة" value={`${draft.estimatedCostHours} ساعة تعليمية`} />
          <Stat label="أيام التعلّم" value={draft.availableDays.join("، ")} />
          <Stat label="الأوقات المفضلة" value={draft.preferredTimes.join("، ")} />
          <Stat label="الراحة بين الدروس" value={`${draft.breakMinutes} دقيقة`} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-surface p-4">
            <p className="text-sm font-semibold text-navy-900">النتيجة القابلة للقياس</p>
            <p className="mt-2 text-sm text-foreground-secondary">{draft.measurableOutcome}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface p-4">
            <p className="text-sm font-semibold text-navy-900">{draft.appliedProject.title}</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              {draft.appliedProject.description}
            </p>
            <p className="mt-2 text-xs text-sage-700">المخرج: {draft.appliedProject.deliverable}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[15rem_1fr]">
          <div>
            <label className="text-sm font-semibold text-navy-900" htmlFor="draft-weekly-hours">
              الساعات الأسبوعية
            </label>
            <input
              id="draft-weekly-hours"
              type="number"
              min={0.5}
              max={40}
              step={0.5}
              value={draft.weeklyHours}
              onChange={(event) => onWeeklyHoursChange(Number(event.target.value))}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
            />
          </div>
          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">أيام الجدول</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const checked = draft.availableDays.includes(day);
                return (
                  <label
                    key={day}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? draft.availableDays.filter((item) => item !== day)
                          : [...draft.availableDays, day];
                        if (next.length) onDaysChange(next);
                      }}
                    />
                    {day}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-7 space-y-4">
          {draft.courses
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((course, index) => (
              <Card
                key={course.courseSlug}
                padding="md"
                className={course.included ? "border-sage-200/60" : "opacity-60"}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Badge variant={course.included ? "sage" : "neutral"}>
                      {course.included ? `الدورة ${index + 1}` : "دورة محذوفة"}
                    </Badge>
                    <h3 className="mt-2 font-semibold text-navy-900">{course.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.included && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={index === 0}
                          onClick={() => onMoveCourse(course.courseSlug, -1)}
                        >
                          لأعلى
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={index >= activeCourses.length - 1}
                          onClick={() => onMoveCourse(course.courseSlug, 1)}
                        >
                          لأسفل
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onToggleCourse(course.courseSlug)}>
                      {course.included ? "إزالة الدورة" : "إعادة الدورة"}
                    </Button>
                  </div>
                </div>

                {course.included && alternatives.length > 0 && (
                  <label className="mt-4 block text-xs text-foreground-secondary">
                    استبدال الدورة
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) {
                          onReplaceCourse(course.courseSlug, event.target.value);
                          event.target.value = "";
                        }
                      }}
                      className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                    >
                      <option value="">اختر بديلاً من الفهرس…</option>
                      {alternatives.map(({ course: alternative }) => (
                        <option key={alternative.slug} value={alternative.slug}>
                          {alternative.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {course.lessons.map((lesson) => (
                    <label
                      key={lesson.id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-3"
                    >
                      <input
                        type="checkbox"
                        checked={lesson.included}
                        disabled={!course.included}
                        onChange={() => onToggleLesson(course.courseSlug, lesson.id)}
                      />
                      <span className="text-sm">
                        <span className="block font-medium text-foreground">{lesson.title}</span>
                        <span className="text-xs text-foreground-muted">
                          {lesson.included ? "حذف الدرس من المسودة" : "إعادة الدرس إلى المسودة"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
        </div>

        <details className="mt-6 rounded-xl border border-border/60 bg-surface p-4">
          <summary className="cursor-pointer font-semibold text-navy-900">الجدول المبدئي</summary>
          <ol className="mt-3 space-y-2">
            {draft.schedule.map((item) => (
              <li key={item.id} className="text-sm text-foreground-secondary">
                الأسبوع {item.week} · {item.day} {item.scheduledDate} · {item.startTime} ·{" "}
                {item.title} ({item.durationMinutes} د)
              </li>
            ))}
          </ol>
        </details>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onAccept} disabled={isAccepting || activeCourses.length === 0}>
              {isAccepting ? "جاري الاعتماد…" : "اعتماد الخطة"}
            </Button>
            <Button variant="ghost" onClick={onReject}>
              رفض المسودة
            </Button>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowVersions((value) => !value)}>
            {showVersions ? "إخفاء النسخ" : "عرض سجل النسخ"}
          </Button>
        </div>

        {showVersions && (
          <div className="mt-4 space-y-2">
            {session.versions
              .slice()
              .reverse()
              .map((version) => (
                <div
                  key={version.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">النسخة {version.version}</p>
                    <p className="text-xs text-foreground-muted">{version.note ?? version.revision}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => onRestoreVersion(version)}>
                    الرجوع لهذه النسخة
                  </Button>
                </div>
              ))}
          </div>
        )}
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-4">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-1 font-semibold text-navy-900">{value}</p>
    </div>
  );
}
