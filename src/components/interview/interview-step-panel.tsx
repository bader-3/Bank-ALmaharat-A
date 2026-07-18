"use client";

import { Button } from "@/components/ui/button";
import {
  BUDGET_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  INTERVIEW_WEEKDAYS,
  LEARNING_PREFERENCE_OPTIONS,
  LEARNING_TOPIC_OPTIONS,
  LEVEL_OPTIONS,
  STUDY_HOUR_OPTIONS,
  WEEKLY_HOUR_OPTIONS,
  distributeWeeklyHours,
  formatLearningInterest,
  getLearningFocusOptions,
  type InterviewStepId,
  type StructuredInterviewDraft,
} from "@/lib/interview/steps";
import { useState } from "react";

type EditableConfirmField = "learningTopic" | "currentLevel" | "weeklyHours";

type InterviewStepPanelProps = {
  step: InterviewStepId;
  draft: StructuredInterviewDraft;
  onSelectGoal: (value: string) => void;
  onSelectLearningTopic: (specialtyId: string, label: string) => void;
  onSelectLearningFocus: (slug: string | null, label: string | null) => void;
  onSelectLevel: (value: string) => void;
  onSelectExperience: (value: string) => void;
  onSelectWeeklyHours: (hours: number) => void;
  onSelectPreference: (value: StructuredInterviewDraft["learningPreference"]) => void;
  onSelectBudget: (value: string) => void;
  onConfirmDays: (days: string[]) => void;
  onConfirmTime: (hour: number, period: "صباحًا" | "مساءً") => void;
  onConfirmSummary: () => void;
  onEditField: (field: EditableConfirmField) => void;
  onRestartInterview: () => void;
};

export function InterviewStepPanel({
  step,
  draft,
  onSelectGoal,
  onSelectLearningTopic,
  onSelectLearningFocus,
  onSelectLevel,
  onSelectExperience,
  onSelectWeeklyHours,
  onSelectPreference,
  onSelectBudget,
  onConfirmDays,
  onConfirmTime,
  onConfirmSummary,
  onEditField,
  onRestartInterview,
}: InterviewStepPanelProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(draft.availableDays ?? []);
  const [hour, setHour] = useState(draft.preferredStudyHour ?? 9);
  const [period, setPeriod] = useState<"صباحًا" | "مساءً" | null>(
    draft.preferredStudyPeriod ?? null,
  );

  if (step === "goal") {
    return (
      <StepPanel title="اختر هدفك">
        <ChoiceGrid>
          {GOAL_OPTIONS.map((option) => (
            <ChoiceButton key={option.value} onClick={() => onSelectGoal(option.value)}>
              {option.label}
            </ChoiceButton>
          ))}
        </ChoiceGrid>
      </StepPanel>
    );
  }

  if (step === "learningTopic") {
    return (
      <StepPanel title="اختر مجال التعلّم">
        <p className="mb-3 text-xs text-foreground-muted">
          المجالات المتاحة في المنصة فقط — اختر ما يناسبك لنبني ملفك بدقة.
        </p>
        <ChoiceGrid>
          {LEARNING_TOPIC_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              onClick={() => onSelectLearningTopic(option.value, option.label)}
            >
              {option.label}
            </ChoiceButton>
          ))}
        </ChoiceGrid>
      </StepPanel>
    );
  }

  if (step === "learningFocus") {
    const focusOptions = draft.specialtyId ? getLearningFocusOptions(draft.specialtyId) : [];

    return (
      <StepPanel title="مسار أدق (اختياري)">
        <p className="mb-3 text-xs text-foreground-muted">
          اختر مسارًا من دورات «{draft.learningTopic ?? "المجال"}»، أو تخطَّ إن اكتفيت بالمجال العام.
        </p>
        {focusOptions.length > 0 ? (
          <ChoiceGrid>
            {focusOptions.map((option) => (
              <ChoiceButton
                key={option.value}
                onClick={() => onSelectLearningFocus(option.value, option.label)}
              >
                {option.label}
              </ChoiceButton>
            ))}
          </ChoiceGrid>
        ) : (
          <p className="text-sm text-foreground-secondary">لا مسارات فرعية متاحة لهذا المجال حاليًا.</p>
        )}
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => onSelectLearningFocus(null, null)}>
            تخطّي — اكتفِ بالمجال العام
          </Button>
        </div>
      </StepPanel>
    );
  }

  if (step === "currentLevel") {
    return (
      <StepPanel title="اختر مستواك">
        <ChoiceGrid columns={3}>
          {LEVEL_OPTIONS.map((option) => (
            <ChoiceButton key={option.value} onClick={() => onSelectLevel(option.value)}>
              {option.label}
            </ChoiceButton>
          ))}
        </ChoiceGrid>
      </StepPanel>
    );
  }

  if (step === "priorExperience") {
    return (
      <StepPanel title="خبرتك السابقة">
        <ChoiceGrid>
          {EXPERIENCE_OPTIONS.map((option) => (
            <ChoiceButton key={option.value} onClick={() => onSelectExperience(option.value)}>
              {option.label}
            </ChoiceButton>
          ))}
        </ChoiceGrid>
      </StepPanel>
    );
  }

  if (step === "weeklyHours") {
    return (
      <StepPanel title="الساعات الأسبوعية">
        <ChoiceGrid columns={3}>
          {WEEKLY_HOUR_OPTIONS.map((option) => (
            <ChoiceButton key={option.value} onClick={() => onSelectWeeklyHours(option.value)}>
              {option.label}
            </ChoiceButton>
          ))}
        </ChoiceGrid>
      </StepPanel>
    );
  }

  if (step === "learningPreference") {
    return (
      <StepPanel title="طريقة التعلّم">
        <ChoiceGrid columns={3}>
          {LEARNING_PREFERENCE_OPTIONS.map((option) => (
            <ChoiceButton key={option.value} onClick={() => onSelectPreference(option.value)}>
              {option.label}
            </ChoiceButton>
          ))}
        </ChoiceGrid>
      </StepPanel>
    );
  }

  if (step === "budgetOrHours") {
    return (
      <StepPanel title="ساعات المحفظة للبدء">
        <ChoiceGrid>
          {BUDGET_OPTIONS.map((option) => (
            <ChoiceButton key={option.value} onClick={() => onSelectBudget(option.value)}>
              {option.label}
            </ChoiceButton>
          ))}
        </ChoiceGrid>
      </StepPanel>
    );
  }

  if (step === "availableDays") {
    const previewHours =
      draft.weeklyHours && selectedDays.length
        ? distributeWeeklyHours(draft.weeklyHours, selectedDays.length)
        : 0;

    return (
      <StepPanel title="أيام الدراسة في الأسبوع">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {INTERVIEW_WEEKDAYS.map((day) => {
            const selected = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setSelectedDays((current) =>
                    selected ? current.filter((item) => item !== day) : [...current, day],
                  )
                }
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? "border-sage-500 bg-sage-100 text-sage-800"
                    : "border-border bg-surface text-foreground-secondary hover:border-sage-300"
                }`}
              >
                {day}
                {selected ? " ✓" : ""}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-foreground-muted">
            {selectedDays.length
              ? previewHours > 0
                ? `${previewHours.toLocaleString("ar-SA")} ساعة لكل يوم (${selectedDays.length.toLocaleString("ar-SA")} أيام)`
                : `${selectedDays.length.toLocaleString("ar-SA")} أيام مختارة`
              : "اختر يومًا واحدًا على الأقل"}
          </p>
          <Button size="sm" disabled={!selectedDays.length} onClick={() => onConfirmDays(selectedDays)}>
            تأكيد الأيام
          </Button>
        </div>
      </StepPanel>
    );
  }

  if (step === "preferredTime") {
    return (
      <StepPanel title="وقت بدء الدراسة اليومي">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-foreground-secondary">
            الساعة
            <select
              value={hour}
              onChange={(event) => setHour(Number(event.target.value))}
              className="mt-1 block h-11 min-w-28 rounded-xl border border-border bg-surface px-3 text-base"
            >
              {STUDY_HOUR_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value.toLocaleString("ar-SA")}:٠٠
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            {(["صباحًا", "مساءً"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
                className={`h-11 rounded-xl border px-4 text-sm font-medium transition-colors ${
                  period === value
                    ? "border-sage-500 bg-sage-100 text-sage-800"
                    : "border-border bg-surface text-foreground-secondary hover:border-sage-300"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" disabled={!period} onClick={() => period && onConfirmTime(hour, period)}>
            تأكيد الوقت
          </Button>
        </div>
      </StepPanel>
    );
  }

  if (step === "confirm") {
    return (
      <StepPanel title="تأكيد الملخص">
        <ul className="space-y-2 text-sm text-foreground-secondary">
          <SummaryLine label="الهدف" value={labelFor(GOAL_OPTIONS, draft.goal)} />
          <EditableSummaryLine
            label="ما يريد تعلّمه"
            value={formatLearningInterest(draft)}
            onEdit={() => onEditField("learningTopic")}
          />
          <EditableSummaryLine
            label="المستوى"
            value={labelFor(LEVEL_OPTIONS, draft.currentLevel)}
            onEdit={() => onEditField("currentLevel")}
          />
          <SummaryLine label="الخبرة" value={labelFor(EXPERIENCE_OPTIONS, draft.priorExperience)} />
          <EditableSummaryLine
            label="الساعات الأسبوعية"
            value={draft.weeklyHours ? `${draft.weeklyHours.toLocaleString("ar-SA")} ساعة` : "—"}
            onEdit={() => onEditField("weeklyHours")}
          />
          <SummaryLine label="أيام الدراسة" value={draft.availableDays?.join("، ") || "—"} />
          <SummaryLine
            label="ساعات/يوم"
            value={draft.hoursPerDay ? `${draft.hoursPerDay.toLocaleString("ar-SA")} ساعة` : "—"}
          />
          <SummaryLine
            label="وقت البدء"
            value={
              draft.preferredStudyHour && draft.preferredStudyPeriod
                ? `${draft.preferredStudyHour.toLocaleString("ar-SA")}:٠٠ ${draft.preferredStudyPeriod}`
                : "—"
            }
          />
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={onConfirmSummary}>
            نعم، المعلومات صحيحة — ابنِ ملفي
          </Button>
          <Button size="sm" variant="secondary" onClick={onRestartInterview}>
            إعادة المقابلة من البداية
          </Button>
        </div>
      </StepPanel>
    );
  }

  return null;
}

function labelFor<T extends { value: string | number; label: string }>(
  options: readonly T[],
  value?: string | number,
) {
  if (value === undefined) return "—";
  return options.find((option) => option.value === value)?.label ?? String(value);
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3 border-b border-border/50 pb-2">
      <span className="text-foreground-muted">{label}</span>
      <span className="text-end font-medium text-navy-900">{value}</span>
    </li>
  );
}

function EditableSummaryLine({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
      <span className="text-foreground-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-end font-medium text-navy-900">{value}</span>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-xs font-semibold text-sage-700 underline-offset-2 hover:underline"
        >
          تعديل
        </button>
      </span>
    </li>
  );
}

function StepPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-sage-200/70 bg-sage-50/40 p-3 sm:p-4">
      <p className="mb-3 text-sm font-semibold text-navy-900">{title}</p>
      {children}
    </section>
  );
}

function ChoiceGrid({
  children,
  columns = 2,
}: {
  children: React.ReactNode;
  columns?: 2 | 3;
}) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      {children}
    </div>
  );
}

function ChoiceButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-sage-300/70 bg-surface px-4 py-3 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-100"
    >
      {children}
    </button>
  );
}
