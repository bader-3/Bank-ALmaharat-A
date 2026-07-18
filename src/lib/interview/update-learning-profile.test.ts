import { describe, expect, it } from "vitest";
import {
  mergeLearningProfileEdits,
  parsePreferredStudyTime,
  rebuildLearningProfileDerivatives,
} from "@/lib/interview/update-learning-profile";
import type { LearningProfile } from "@/types/interview";

function baseProfile(overrides: Partial<LearningProfile> = {}): LearningProfile {
  return {
    userId: "u1",
    answers: {
      goal: "student",
      specialtyId: "languages",
      learningTopic: "اللغات",
      currentLevel: "beginner",
      priorExperience: "none",
      weeklyHours: "8 ساعة",
      weeklyHoursNumeric: 8,
      availableDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء"],
      hoursPerDay: 2,
      preferredStudyTime: "٩:٠٠ صباحًا",
      learningPreference: "both",
      budgetOrHours: "10-20h",
    },
    summary: "ملخص قديم",
    suggestedSkills: [],
    suggestedPath: "",
    completedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("update-learning-profile", () => {
  it("يفسّر وقت الدراسة المفضّل", () => {
    expect(parsePreferredStudyTime("٩:٠٠ مساءً")).toEqual({ hour: 9, period: "مساءً" });
    expect(parsePreferredStudyTime("5:00 صباحًا")).toEqual({ hour: 5, period: "صباحًا" });
  });

  it("يعيد بناء التوصيات عند تغيير التخصص", () => {
    const next = mergeLearningProfileEdits(baseProfile(), {
      specialtyId: "tech",
      currentLevel: "beginner",
    });

    expect(next.answers.specialtyId).toBe("tech");
    expect(next.answers.learningTopic).toBeTruthy();
    expect(next.courseRecommendations?.length).toBeGreaterThan(0);
    expect(next.learningPlan?.weeks.length).toBeGreaterThan(0);
    expect(next.summary).toContain("متعلّم");
  });

  it("يحدّث أيام الدراسة ويعيد توزيع الساعات", () => {
    const next = mergeLearningProfileEdits(baseProfile(), {
      availableDays: ["الأحد", "الثلاثاء"],
      weeklyHoursNumeric: 10,
      preferredStudyHour: 7,
      preferredStudyPeriod: "مساءً",
    });

    expect(next.answers.availableDays).toEqual(["الأحد", "الثلاثاء"]);
    expect(next.answers.hoursPerDay).toBe(5);
    expect(next.answers.preferredStudyTime).toContain("٧");
    expect(next.answers.preferredStudyTime).toContain("مساءً");
  });

  it("يعيد بناء المشتقات من الملف الحالي", () => {
    const rebuilt = rebuildLearningProfileDerivatives(baseProfile());
    expect(rebuilt.courseRecommendations?.length).toBeGreaterThan(0);
    expect(rebuilt.suggestedPath.length).toBeGreaterThan(10);
  });
});
