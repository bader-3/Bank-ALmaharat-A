import { describe, expect, it } from "vitest";
import {
  buildFullPlatformKnowledge,
  getCourseCatalogForAi,
  getTrainersForAi,
} from "@/lib/ai/platform-knowledge";

describe("معرفة المنصة لنور", () => {
  it("تتضمن جميع الصفحات الرئيسية", () => {
    const knowledge = buildFullPlatformKnowledge();
    expect(knowledge).toContain("/courses");
    expect(knowledge).toContain("/wallet");
    expect(knowledge).toContain("/noor");
    expect(knowledge).toContain("/review");
    expect(knowledge).toContain("/trainers");
    expect(knowledge).toContain("/path");
    expect(knowledge).toContain("/activity");
  });

  it("تتضمن فهرس الدورات والمدربين", () => {
    expect(getCourseCatalogForAi().length).toBeGreaterThan(20);
    expect(getTrainersForAi().length).toBeGreaterThan(10);
    expect(buildFullPlatformKnowledge()).toContain("contracts-101");
  });
});
