import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createUser } from "@/services/auth/mock-storage";
import { MockInterviewService } from "@/services/interview";
import type { LearningProfile } from "@/types/interview";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

const originalWindow = globalThis.window;

beforeEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: new MemoryStorage() },
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("MockInterviewService.finalizeInterview", () => {
  it("يحفظ الملف التعليمي دون فتح المنصة", async () => {
    const user = createUser({
      fullName: "حساب جديد",
      email: "fresh@example.com",
      password: "secret123",
    });

    const profile: LearningProfile = {
      userId: user.id,
      aiGenerated: true,
      answers: {
        goal: "career",
        currentLevel: "beginner",
        priorExperience: "none",
        weeklyHours: "10 ساعة",
        weeklyHoursNumeric: 10,
        learningPreference: "both",
        budgetOrHours: "10-20h",
      },
      summary: "ملخص",
      suggestedSkills: [],
      suggestedPath: "مسار",
      completedAt: new Date().toISOString(),
      conversationHistory: [],
      courseRecommendations: [],
    };

    const service = new MockInterviewService();
    const ok = await service.finalizeInterview(user.id, profile);

    expect(ok).toBe(true);
    expect(await service.getProfile(user.id)).not.toBeNull();
  });
});
