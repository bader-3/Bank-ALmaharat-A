"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck, IconClose, IconFile, IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import {
  BUDGET_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  getLearningFocusOptions,
  INTERVIEW_WEEKDAYS,
  LEARNING_PREFERENCE_OPTIONS,
  LEARNING_TOPIC_OPTIONS,
  LEVEL_OPTIONS,
  STUDY_HOUR_OPTIONS,
  WEEKLY_HOUR_OPTIONS,
} from "@/lib/interview/steps";
import {
  NOOR_PROFILE_SERVICES,
  parsePreferredStudyTime,
  type LearningProfileEdits,
} from "@/lib/interview/update-learning-profile";
import { ROUTES } from "@/lib/constants";
import { getInterviewService } from "@/services/interview";
import type { LearningPreference, LearningProfile } from "@/types/interview";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

type LearningProfileEditorProps = {
  profile: LearningProfile;
  onSaved: (profile: LearningProfile) => void;
  onCancel?: () => void;
};

export function LearningProfileEditor({ profile, onSaved, onCancel }: LearningProfileEditorProps) {
  const initialTime = parsePreferredStudyTime(profile.answers.preferredStudyTime);
  const [goal, setGoal] = useState(profile.answers.goal);
  const [specialtyId, setSpecialtyId] = useState(profile.answers.specialtyId ?? "");
  const [learningFocusSlug, setLearningFocusSlug] = useState(profile.answers.learningFocusSlug ?? "");
  const [currentLevel, setCurrentLevel] = useState(profile.answers.currentLevel);
  const [priorExperience, setPriorExperience] = useState(profile.answers.priorExperience);
  const [weeklyHoursNumeric, setWeeklyHoursNumeric] = useState(
    profile.answers.weeklyHoursNumeric ?? 5,
  );
  const [availableDays, setAvailableDays] = useState<string[]>(profile.answers.availableDays ?? []);
  const [preferredStudyHour, setPreferredStudyHour] = useState(initialTime.hour);
  const [preferredStudyPeriod, setPreferredStudyPeriod] = useState<"صباحًا" | "مساءً">(
    initialTime.period,
  );
  const [learningPreference, setLearningPreference] = useState<LearningPreference>(
    profile.answers.learningPreference,
  );
  const [budgetOrHours, setBudgetOrHours] = useState(profile.answers.budgetOrHours);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const focusOptions = useMemo(
    () => (specialtyId ? getLearningFocusOptions(specialtyId) : []),
    [specialtyId],
  );

  function toggleDay(day: string) {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  }

  async function handleSave() {
    if (!availableDays.length) {
      setError("اختر يوم دراسة واحدًا على الأقل.");
      return;
    }
    if (!specialtyId) {
      setError("اختر التخصص الذي تريد تعلّمه.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const focus = focusOptions.find((option) => option.value === learningFocusSlug);
      const edits: LearningProfileEdits = {
        goal,
        specialtyId,
        learningFocus: focus?.label,
        learningFocusSlug: focus?.value,
        currentLevel,
        priorExperience,
        weeklyHoursNumeric,
        availableDays,
        preferredStudyHour,
        preferredStudyPeriod,
        learningPreference,
        budgetOrHours,
      };
      const next = await getInterviewService().updateProfileAnswers(profile.userId, edits);
      onSaved(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حفظ الملف");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-sage-600">تعديل الملف التعليمي</p>
          <p className="mt-1 text-sm text-foreground-secondary">
            أي تغيير هنا يحدّث توصيات نور، جدولة الأهداف، باقة المحفظة، وفلتر الدورات.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-foreground-muted hover:bg-background-muted"
            aria-label="إغلاق"
          >
            <IconClose size={18} />
          </button>
        )}
      </div>

      <Field label="الهدف">
        <SelectChips
          options={GOAL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={goal}
          onChange={setGoal}
        />
      </Field>

      <Field label="التخصص">
        <SelectChips
          options={LEARNING_TOPIC_OPTIONS}
          value={specialtyId}
          onChange={(value) => {
            setSpecialtyId(value);
            setLearningFocusSlug("");
          }}
        />
      </Field>

      {focusOptions.length > 0 && (
        <Field label="مسار التركيز (اختياري)">
          <SelectChips
            options={[{ value: "", label: "بدون تركيز محدد" }, ...focusOptions]}
            value={learningFocusSlug}
            onChange={setLearningFocusSlug}
          />
        </Field>
      )}

      <Field label="المستوى">
        <SelectChips
          options={LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={currentLevel}
          onChange={setCurrentLevel}
        />
      </Field>

      <Field label="الخبرة السابقة">
        <SelectChips
          options={EXPERIENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={priorExperience}
          onChange={setPriorExperience}
        />
      </Field>

      <Field label="الساعات الأسبوعية">
        <SelectChips
          options={WEEKLY_HOUR_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          value={String(weeklyHoursNumeric)}
          onChange={(value) => setWeeklyHoursNumeric(Number(value))}
        />
      </Field>

      <Field label="أيام الدراسة">
        <div className="flex flex-wrap gap-2">
          {INTERVIEW_WEEKDAYS.map((day) => {
            const active = availableDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-sage-500 bg-sage-500 text-white"
                    : "border-border bg-surface text-foreground-secondary hover:border-sage-300",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="وقت البدء المفضّل">
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={preferredStudyHour}
            onChange={(event) => setPreferredStudyHour(Number(event.target.value))}
          >
            {STUDY_HOUR_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {hour.toLocaleString("ar-SA")}:٠٠
              </option>
            ))}
          </select>
          <SelectChips
            options={[
              { value: "صباحًا", label: "صباحًا" },
              { value: "مساءً", label: "مساءً" },
            ]}
            value={preferredStudyPeriod}
            onChange={(value) => setPreferredStudyPeriod(value as "صباحًا" | "مساءً")}
          />
        </div>
      </Field>

      <Field label="أسلوب التعلّم">
        <SelectChips
          options={LEARNING_PREFERENCE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          value={learningPreference}
          onChange={(value) => setLearningPreference(value as LearningPreference)}
        />
      </Field>

      <Field label="ساعات المحفظة للبدء">
        <SelectChips
          options={BUDGET_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={budgetOrHours}
          onChange={setBudgetOrHours}
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          <IconCheck size={16} />
          {saving ? "جاري الحفظ…" : "حفظ التحديثات"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            إلغاء
          </Button>
        )}
      </div>
    </div>
  );
}

export function NoorProfileServicesCard() {
  return (
    <Card padding="md" className="border-sage-200/70 bg-sage-50/40">
      <div className="flex items-center gap-2">
        <IconSparkle size={18} className="text-sage-600" />
        <p className="text-xs font-semibold text-sage-700">خدمات نور المرتبطة بملفك</p>
      </div>
      <ul className="mt-4 space-y-3">
        {NOOR_PROFILE_SERVICES.map((service) => (
          <li key={service.id} className="rounded-xl border border-sage-200/60 bg-surface px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-navy-900">{service.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground-secondary">
                  {service.description}
                </p>
                <p className="mt-2 text-[11px] text-foreground-muted">
                  يعتمد على: {service.fields.join(" · ")}
                </p>
              </div>
              <Link
                href={service.href}
                className="shrink-0 text-xs font-medium text-sage-600 hover:underline"
              >
                فتح
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <Button href={ROUTES.noor} size="sm" variant="secondary" className="mt-4" fullWidth>
        <IconFile size={16} />
        اسأل نور حسب ملفك
      </Button>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-foreground-muted">{label}</p>
      {children}
    </div>
  );
}

function SelectChips({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={`${option.value}-${option.label}`}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-border bg-surface text-foreground-secondary hover:border-navy-300",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
