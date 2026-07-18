import { describe, expect, it } from "vitest";
import { distributeWeeklyHours } from "@/lib/interview/steps";
import { parseWeeklyHoursFromProfileAnswer } from "@/lib/ai/planning";

describe("interview hours", () => {
  it("يوزّع 12 ساعة على 4 أيام = 3 ساعات/يوم", () => {
    expect(distributeWeeklyHours(12, 4)).toBe(3);
  });

  it("يوزّع 12 ساعة على 6 أيام = 2 ساعة/يوم", () => {
    expect(distributeWeeklyHours(12, 6)).toBe(2);
  });

  it("يقرأ 20 ساعة من نص الملف وليس 3-5", () => {
    expect(parseWeeklyHoursFromProfileAnswer("20 ساعة")).toBe(20);
    expect(parseWeeklyHoursFromProfileAnswer("3-5")).toBe(4);
  });
});
