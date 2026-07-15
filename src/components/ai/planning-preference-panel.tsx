"use client";

import { Button } from "@/components/ui/button";
import { SPECIALTIES } from "@/lib/courses/mock-data";
import {
  formatPlanningSuggestionLabel,
  getMissingPlanningKey,
  hasPlanningSuggestionForKey,
  type PlanPreferenceKey,
} from "@/lib/ai/planning";
import type { CourseLevel, DeliveryMode } from "@/types/course";
import type { PlanningPreferences } from "@/types/noor";
import { useEffect, useState } from "react";

const WEEKDAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدّم",
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);

type PlanningPreferencePanelProps = {
  preferences: PlanningPreferences;
  suggestedPreferences?: PlanningPreferences;
  onConfirmSpecialty: (specialtyId: string) => void;
  onConfirmLevel: (level: CourseLevel) => void;
  onConfirmDays: (days: string[]) => void;
  onConfirmTime: (hour: number, period: "صباحًا" | "مساءً") => void;
  onConfirmDelivery: (modes: DeliveryMode[]) => void;
  onAcceptSuggestion: (key: PlanPreferenceKey) => void;
};

export function PlanningPreferencePanel({
  preferences,
  suggestedPreferences,
  onConfirmSpecialty,
  onConfirmLevel,
  onConfirmDays,
  onConfirmTime,
  onConfirmDelivery,
  onAcceptSuggestion,
}: PlanningPreferencePanelProps) {
  const step = getMissingPlanningKey(preferences);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [hour, setHour] = useState(6);
  const [period, setPeriod] = useState<"صباحًا" | "مساءً" | null>(null);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  useEffect(() => {
    setDismissedSuggestion(false);
  }, [step]);

  if (!step) return null;

  const suggestionLabel =
    suggestedPreferences && hasPlanningSuggestionForKey(step, suggestedPreferences)
      ? formatPlanningSuggestionLabel(step, suggestedPreferences)
      : null;
  const showSuggestion = Boolean(suggestionLabel) && !dismissedSuggestion;

  const suggestionBanner = showSuggestion ? (
    <PlanningSuggestionBanner
      label={suggestionLabel!}
      onAccept={() => onAcceptSuggestion(step)}
      onDecline={() => setDismissedSuggestion(true)}
    />
  ) : null;

  if (step === "domain") {
    return (
      <Panel title="اختر التخصص">
        {suggestionBanner}
        <div className="grid gap-2 sm:grid-cols-2">
          {SPECIALTIES.map((specialty) => (
            <Choice key={specialty.id} onClick={() => onConfirmSpecialty(specialty.id)}>
              {specialty.name}
            </Choice>
          ))}
        </div>
      </Panel>
    );
  }

  if (step === "currentLevel") {
    return (
      <Panel title="اختر مستواك الحالي">
        {suggestionBanner}
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVELS.map((level) => (
            <Choice key={level} onClick={() => onConfirmLevel(level)}>
              {LEVEL_LABELS[level]}
            </Choice>
          ))}
        </div>
      </Panel>
    );
  }

  if (step === "availableDays") {
    return (
      <Panel title="اختر أيام التعلّم">
        {suggestionBanner}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WEEKDAYS.map((day) => {
            const selected = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setSelectedDays((current) =>
                    selected
                      ? current.filter((item) => item !== day)
                      : [...current, day],
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
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-foreground-muted">
            {selectedDays.length
              ? `${selectedDays.length.toLocaleString("ar-SA")} أيام مختارة`
              : "اختر يومًا واحدًا على الأقل"}
          </span>
          <Button
            size="sm"
            disabled={!selectedDays.length}
            onClick={() => onConfirmDays(selectedDays)}
          >
            تأكيد الأيام
          </Button>
        </div>
      </Panel>
    );
  }

  if (step === "preferredTimes") {
    return (
      <Panel title="حدد وقت الدراسة">
        {suggestionBanner}
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-foreground-secondary">
            الساعة
            <select
              value={hour}
              onChange={(event) => setHour(Number(event.target.value))}
              className="mt-1 block h-11 min-w-28 rounded-xl border border-border bg-surface px-3 text-base"
            >
              {HOURS.map((value) => (
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
          <Button
            size="sm"
            disabled={!period}
            onClick={() => period && onConfirmTime(hour, period)}
          >
            تأكيد الوقت
          </Button>
        </div>
      </Panel>
    );
  }

  if (step === "deliveryModes") {
    return (
      <Panel title="اختر طريقة التقديم">
        {suggestionBanner}
        <div className="grid gap-2 sm:grid-cols-3">
          <Choice onClick={() => onConfirmDelivery(["recorded"])}>مسجّلة</Choice>
          <Choice onClick={() => onConfirmDelivery(["live"])}>مباشرة</Choice>
          <Choice onClick={() => onConfirmDelivery(["recorded", "live"])}>
            كلتاهما
          </Choice>
        </div>
      </Panel>
    );
  }

  if (showSuggestion) {
    return (
      <Panel title="اقتراح من ملف المقابلة">
        <PlanningSuggestionBanner
          label={suggestionLabel!}
          onAccept={() => onAcceptSuggestion(step)}
          onDecline={() => setDismissedSuggestion(true)}
        />
        <p className="mt-3 text-xs text-foreground-muted">
          أو اكتب إجابتك في الحقل أدناه إذا أردت تغيير الاقتراح.
        </p>
      </Panel>
    );
  }

  return null;
}

function PlanningSuggestionBanner({
  label,
  onAccept,
  onDecline,
}: {
  label: string;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="mb-3 rounded-xl border border-gold-200/70 bg-gold-50/50 p-3">
      <p className="text-xs text-foreground-secondary">من ملف المقابلة:</p>
      <p className="mt-1 text-sm font-semibold text-navy-900">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" onClick={onAccept}>
          نعم، اعتمدها
        </Button>
        <Button size="sm" variant="secondary" onClick={onDecline}>
          أريد تغييرها
        </Button>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-sage-200/70 bg-sage-50/40 p-4">
      <p className="mb-3 text-sm font-semibold text-navy-900">{title}</p>
      {children}
    </section>
  );
}

function Choice({
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
