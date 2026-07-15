import { describe, expect, it } from "vitest";
import {
  formatHoursAndMinutes,
  formatMinutesDuration,
  hasEnoughHours,
  splitDecimalHours,
} from "@/lib/format/duration";

describe("تنسيق الساعات والدقائق", () => {
  it("يحوّل الكسور العشرية إلى ساعات ودقائق", () => {
    expect(splitDecimalHours(1.17)).toEqual({ hours: 1, minutes: 10 });
    expect(splitDecimalHours(29.02)).toEqual({ hours: 29, minutes: 1 });
  });

  it("يعرض بصيغة ساعة:دقيقة ويتجنّب أخطاء الكسور العائمة", () => {
    expect(formatHoursAndMinutes(29.020000000000001)).toBe("29:01");
    expect(formatHoursAndMinutes(1.1666666666666667)).toBe("1:10");
    expect(formatHoursAndMinutes(7)).toBe("7:00");
    expect(formatHoursAndMinutes(0)).toBe("0:00");
  });

  it("يستخدم نفس الصيغة في الوضع المختصر", () => {
    expect(formatHoursAndMinutes(5, true)).toBe("5:00");
    expect(formatHoursAndMinutes(1.17, true)).toBe("1:10");
  });

  it("يقارن الرصيد بالدقائق", () => {
    expect(hasEnoughHours(29.020000000000001, 1.17)).toBe(true);
    expect(hasEnoughHours(1, 1.5)).toBe(false);
  });

  it("ينسّق الدقائق مباشرة", () => {
    expect(formatMinutesDuration(70)).toBe("1:10");
    expect(formatMinutesDuration(45)).toBe("0:45");
  });
});
