import { describe, expect, it } from "vitest";
import { COURSES } from "@/lib/courses/mock-data";
import { getAiRecommendedCourses } from "@/lib/courses/ai-recommendations";
import {
  filterCourses,
  getCatalogCourseRecommendations,
  getRecommendedCourses,
} from "@/lib/courses/recommendations";
import type { LearningProfile } from "@/types/interview";

function profile(overrides: Partial<LearningProfile> = {}): LearningProfile {
  return {
    userId: "u1",
    answers: {
      goal: "career_change",
      currentLevel: "beginner",
      priorExperience: "none",
      weeklyHours: "5",
      learningPreference: "recorded",
      budgetOrHours: "20h",
    },
    summary: "",
    suggestedSkills: [],
    suggestedPath: "",
    completedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("توصيات وفلاتر catalog", () => {
  it("يعيد فقط دورات مناسبة للمجال والمستوى والوقت والنمط", () => {
    const recommendations = getCatalogCourseRecommendations({
      domain: "برمجة وتطوير ويب",
      goal: "الحصول على وظيفة مطور",
      currentLevel: "beginner",
      weeklyHours: 4,
      durationWeeks: 3,
      budgetHours: 12,
      deliveryModes: ["recorded"],
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every(({ course }) => course.specialtyId === "tech")).toBe(true);
    expect(recommendations.every(({ course }) => course.level === "beginner")).toBe(true);
    expect(recommendations.every(({ course }) => course.hours <= 12)).toBe(true);
    expect(
      recommendations.every(({ course }) =>
        ["recorded", "hybrid"].includes(course.deliveryMode),
      ),
    ).toBe(true);
  });

  it("لا يسمح لتوصية AI مختلقة بالمرور من الفهرس", () => {
    const recommendations = getAiRecommendedCourses(
      profile({
        courseRecommendations: [
          { slug: "دورة-مختلقة", reason: "سبب مختلق" },
          { slug: COURSES[0].slug, reason: "موجودة" },
        ],
      }),
    );

    expect(recommendations.every(({ course }) => course.slug !== "دورة-مختلقة")).toBe(true);
  });

  it("يوصي بدورات اللغات عندما يذكر المتدّرب تعلّم الإنجليزية", () => {
    const recommendations = getRecommendedCourses(
      profile({
        summary: "يريد الوصول إلى B2 في اللغة الإنجليزية",
        conversationHistory: [
          { role: "user", text: "أريد تعلّم اللغة الإنجليزية والوصول إلى مستوى B2" },
        ],
      }),
      3,
      "أريد تعلّم اللغة الإنجليزية والوصول إلى مستوى B2",
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.every((course) => course.specialtyId === "languages")).toBe(true);
    expect(recommendations.some((course) => course.slug === "english-for-work")).toBe(true);
    expect(recommendations.every((course) => course.slug !== "arabic-for-non-native")).toBe(true);
  });

  it("لا يرشّح العربية عندما يكون مسار التركيز إنجليزيًا مهنيًا", () => {
    const recommendations = getAiRecommendedCourses(
      profile({
        answers: {
          goal: "student",
          specialtyId: "languages",
          learningTopic: "اللغات",
          learningFocus: "إنجليزي مهني للتواصل",
          learningFocusSlug: "english-for-work",
          currentLevel: "beginner",
          priorExperience: "none",
          weeklyHours: "8 ساعة",
          weeklyHoursNumeric: 8,
          learningPreference: "both",
          budgetOrHours: "10-20h",
        },
        summary: "يركّز على إنجليزي مهني للتواصل",
      }),
      3,
    );

    expect(recommendations.some(({ course }) => course.slug === "english-for-work")).toBe(true);
    expect(recommendations.every(({ course }) => course.slug !== "arabic-for-non-native")).toBe(
      true,
    );
  });

  it("يعطي fallback ثابتاً لغياب الملف ويحترم حد النتائج", () => {
    expect(getRecommendedCourses(null, 3)).toEqual(COURSES.slice(0, 3));
    expect(getCatalogCourseRecommendations({ deliveryModes: [] }, 2)).toHaveLength(2);
  });

  it("يطبق فلاتر التخصص والمستوى والبحث معاً", () => {
    const results = filterCourses({
      specialtyId: "tech",
      level: "beginner",
      deliveryMode: "all",
      query: "البيانات",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (course) =>
          course.specialtyId === "tech" &&
          course.level === "beginner" &&
          `${course.title} ${course.summary}`.includes("البيانات"),
      ),
    ).toBe(true);
  });
});
