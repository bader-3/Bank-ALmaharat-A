"use client";

import { LearningProfileEditor, NoorProfileServicesCard } from "@/components/interview/learning-profile-editor";
import { LearningPlanCard } from "@/components/ai/learning-plan-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconFile, IconSparkle } from "@/components/ui/icons";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { GOAL_LABELS, LEVEL_LABELS, formatWeeklyHoursLabel } from "@/lib/interview/labels";
import { formatLearningInterest } from "@/lib/interview/steps";
import { ROUTES } from "@/lib/constants";
import type { LearningProfile } from "@/types/interview";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ProfileSummaryProps {
  profile: LearningProfile;
  showPlan?: boolean;
  /** يسمح بتعديل الملف من الحساب / الملخص */
  editable?: boolean;
  onProfileUpdated?: (profile: LearningProfile) => void;
  showNoorServices?: boolean;
}

export function ProfileSummary({
  profile,
  showPlan = true,
  editable = false,
  onProfileUpdated,
  showNoorServices = false,
}: ProfileSummaryProps) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(profile);

  useEffect(() => {
    setCurrent(profile);
  }, [profile]);
  const answers = current.answers;
  const skills = current.suggestedSkills ?? [];
  const interest = answers
    ? formatLearningInterest({
        learningTopic: answers.learningTopic,
        learningFocus: answers.learningFocus,
      })
    : "—";

  if (editing) {
    return (
      <LearningProfileEditor
        profile={current}
        onCancel={() => setEditing(false)}
        onSaved={(next) => {
          setCurrent(next);
          setEditing(false);
          onProfileUpdated?.(next);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-foreground-muted">يمكنك تحديث ملفك دون إعادة المقابلة كاملة.</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
            <IconFile size={16} />
            تعديل الملف
          </Button>
        </div>
      )}

      {current.aiGenerated && <Badge variant="gold">ملف مولّد بالذكاء الاصطناعي</Badge>}

      {current.summary && <p className="type-body text-navy-700">{current.summary}</p>}

      {answers && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem label="الهدف" value={GOAL_LABELS[answers.goal] ?? answers.goal} />
          {interest !== "—" ? <SummaryItem label="ما يريد تعلّمه" value={interest} /> : null}
          <SummaryItem
            label="المستوى"
            value={LEVEL_LABELS[answers.currentLevel] ?? answers.currentLevel}
          />
          <SummaryItem
            label="الساعات الأسبوعية"
            value={formatWeeklyHoursLabel(answers.weeklyHours, answers.weeklyHoursNumeric)}
          />
          {answers.availableDays && answers.availableDays.length > 0 && (
            <SummaryItem label="أيام الدراسة" value={answers.availableDays.join("، ")} />
          )}
          {answers.hoursPerDay ? (
            <SummaryItem
              label="ساعات/يوم"
              value={`${answers.hoursPerDay.toLocaleString("ar-SA")} ساعة`}
            />
          ) : null}
          {answers.preferredStudyTime ? (
            <SummaryItem label="وقت البدء" value={answers.preferredStudyTime} />
          ) : null}
          <SummaryItem
            label="أسلوب التعلّم"
            value={preferenceLabel(answers.learningPreference)}
          />
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <p className="type-label text-sage-600">المهارات المقترحة</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="sage">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {current.suggestedPath && (
        <div className="rounded-2xl border border-sage-200/60 bg-sage-50/50 px-4 py-3">
          <p className="type-label text-sage-600">مسارك الأولي</p>
          <p className="type-small mt-1 text-navy-700">{current.suggestedPath}</p>
        </div>
      )}

      {current.courseRecommendations && current.courseRecommendations.length > 0 && (
        <div className="rounded-2xl border border-gold-200/50 bg-gold-50/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <IconSparkle size={16} className="text-gold-600" />
            <p className="type-label text-gold-700">دورات نور المقترحة من ملفك</p>
          </div>
          <ul className="mt-2 space-y-2">
            {current.courseRecommendations.slice(0, 3).map((rec) => {
              const course = getCourseBySlug(rec.slug);
              return (
                <li key={rec.slug} className="text-sm text-navy-800">
                  <Link
                    href={`${ROUTES.courses}/${rec.slug}`}
                    className="font-medium text-sage-700 hover:underline"
                  >
                    {course?.title ?? rec.slug}
                  </Link>
                  <span className="text-foreground-secondary"> — {rec.reason}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showNoorServices && <NoorProfileServicesCard />}

      {showPlan && current.learningPlan && <LearningPlanCard plan={current.learningPlan} compact />}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ded2c4] bg-[#efe6da] px-4 py-3">
      <p className="type-label text-navy-400">{label}</p>
      <p className="type-small mt-1 text-navy-800">{value}</p>
    </div>
  );
}

function preferenceLabel(pref: string) {
  if (pref === "live") return "جلسات مباشرة";
  if (pref === "recorded") return "دورات مسجّلة";
  return "مزيج من الاثنين";
}
