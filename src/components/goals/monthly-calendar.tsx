"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { toDateKey } from "@/services/goals";
import type { LearningGoal } from "@/types/goals";
import { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

interface MonthlyCalendarProps {
  goals: LearningGoal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function MonthlyCalendar({
  goals,
  selectedDate,
  onSelectDate,
}: MonthlyCalendarProps) {
  const selected = parseDateKey(selectedDate);
  const selectedYear = selected.getFullYear();
  const selectedMonth = selected.getMonth();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedYear, selectedMonth, 1),
  );

  useEffect(() => {
    setVisibleMonth(new Date(selectedYear, selectedMonth, 1));
  }, [selectedYear, selectedMonth]);

  const cells = useMemo(() => getMonthCells(visibleMonth), [visibleMonth]);
  const goalsByDate = useMemo(() => {
    return goals.reduce<Record<string, LearningGoal[]>>((map, goal) => {
      (map[goal.scheduledDate] ??= []).push(goal);
      return map;
    }, {});
  }, [goals]);
  const today = toDateKey(new Date());

  function changeMonth(offset: number) {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-foreground-secondary transition-colors hover:bg-background-subtle"
          aria-label="الشهر السابق"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-base font-semibold text-navy-900">
            {visibleMonth.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              onSelectDate(today);
            }}
            className="mt-1 text-xs text-sage-600 hover:underline"
          >
            اليوم
          </button>
        </div>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-foreground-secondary transition-colors hover:bg-background-subtle"
          aria-label="الشهر التالي"
        >
          ›
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1 text-xs font-medium text-foreground-muted">
            {day.slice(0, 2)}
          </span>
        ))}

        {cells.map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const dayGoals = goalsByDate[key] ?? [];
          const completed = dayGoals.filter((goal) => goal.completedAt).length;
          const pending = dayGoals.length - completed;
          const isSelected = key === selectedDate;
          const isToday = key === today;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm transition-all",
                inMonth ? "text-foreground hover:bg-background-subtle" : "text-foreground-muted/35",
                isSelected && "bg-sage-500 font-semibold text-white shadow-sm",
                isToday && !isSelected && "ring-2 ring-sage-300 ring-offset-1",
              )}
              aria-label={`${date.toLocaleDateString("ar-SA")}، ${dayGoals.length} أهداف`}
            >
              <span className="tabular-nums">{date.getDate().toLocaleString("ar-SA")}</span>
              {dayGoals.length > 0 && !isSelected && (
                <span className="mt-0.5 flex gap-0.5" aria-hidden="true">
                  {completed > 0 && <span className="h-1 w-1 rounded-full bg-sage-500" />}
                  {pending > 0 && <span className="h-1 w-1 rounded-full bg-gold-400" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sage-500" />
          مكتمل
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold-400" />
          متبقٍ
        </span>
      </div>
    </Card>
  );
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOffset = new Date(year, monthIndex, 1).getDay();
  const start = new Date(year, monthIndex, 1 - firstDayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, inMonth: date.getMonth() === monthIndex };
  });
}
