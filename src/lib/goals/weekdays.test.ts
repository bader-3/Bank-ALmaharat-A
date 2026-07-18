import { describe, expect, it } from "vitest";
import {
  resolveAvailableDayIndexes,
  scheduleOnAvailableDays,
  weekdayIndexFromLabel,
} from "@/lib/goals/weekdays";
import { buildGoalsFromPlan, toDateKey } from "@/services/goals";
import type { LearningPlan } from "@/types/ai";

describe("weekdays", () => {
  it("يفهم صيغ أيام عربية مختلفة", () => {
    expect(weekdayIndexFromLabel("الأحد")).toBe(0);
    expect(weekdayIndexFromLabel("أحد")).toBe(0);
    expect(weekdayIndexFromLabel("الاثنين")).toBe(1);
    expect(weekdayIndexFromLabel("الإثنين")).toBe(1);
    expect(weekdayIndexFromLabel("أربعاء")).toBe(3);
    expect(resolveAvailableDayIndexes(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء"])).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it("يجدول على أيام الدراسة فقط وليس الجمعة إن لم تُختر", () => {
    // Friday 17 July 2026
    const friday = new Date(2026, 6, 17);
    expect(friday.getDay()).toBe(5);

    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء"];
    const first = scheduleOnAvailableDays(0, days, friday);
    const second = scheduleOnAvailableDays(1, days, friday);
    const third = scheduleOnAvailableDays(2, days, friday);
    const fourth = scheduleOnAvailableDays(3, days, friday);
    const fifth = scheduleOnAvailableDays(4, days, friday);

    expect(first.getDay()).toBe(0); // Sunday 19
    expect(toDateKey(first)).toBe("2026-07-19");
    expect(second.getDay()).toBe(1);
    expect(third.getDay()).toBe(2);
    expect(fourth.getDay()).toBe(3);
    expect(fifth.getDay()).toBe(0); // next Sunday
    expect([first, second, third, fourth, fifth].every((d) => d.getDay() !== 5)).toBe(true);
    expect([first, second, third, fourth, fifth].every((d) => d.getDay() !== 6)).toBe(true);
  });
});

describe("buildGoalsFromPlan", () => {
  it("لا يملأ أيام الأسبوع كاملة ويتقيد بأيام الملف", () => {
    const plan: LearningPlan = {
      totalWeeks: 1,
      totalHours: 8,
      suggestedPackageId: "explore",
      packageReason: "test",
      weeks: [
        {
          week: 1,
          title: "اختبار",
          courseSlug: "fake-course-for-test",
          hours: 8,
          focus: "ثقة أعلى في المحادثة",
        },
      ],
    };

    const friday = new Date(2026, 6, 17);
    const goals = buildGoalsFromPlan(
      plan,
      friday,
      ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء"],
      "09:00",
    );

    expect(goals.length).toBe(4);
    expect(goals.every((goal) => !goal.scheduledDate.startsWith("2026-07-17"))).toBe(true);
    expect(goals[0]?.scheduledDate).toBe("2026-07-19");
    expect(goals.every((goal) => goal.startTime === "09:00")).toBe(true);
  });
});
