import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSessionForUser,
  createUser,
  getUserById,
} from "@/services/auth/mock-storage";
import { saveAiLearningProfile } from "@/services/interview/mock-profile-storage";
import {
  completePlatformAccess,
  ensureInterviewCompletion,
  isInterviewCompleteForUser,
  resolveAppAccessForUser,
  shouldRedirectToInterview,
} from "@/lib/auth/interview-access";
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

const sampleAnswers = {
  goal: "career",
  currentLevel: "beginner",
  priorExperience: "none",
  weeklyHours: "10 ساعة",
  weeklyHoursNumeric: 10,
  learningPreference: "both" as const,
  budgetOrHours: "10-20h",
};

const sampleProfile = (userId: string): LearningProfile => ({
  userId,
  aiGenerated: true,
  answers: sampleAnswers,
  summary: "ملخص",
  suggestedSkills: [],
  suggestedPath: "مسار",
  completedAt: new Date().toISOString(),
  conversationHistory: [],
  courseRecommendations: [],
});

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

describe("interview-access", () => {
  it("الملف وحده لا يفتح المنصة قبل الضغط على انتقل للموقع", () => {
    const user = createUser({
      fullName: "بدر",
      email: "bader@example.com",
      password: "secret123",
    });
    saveAiLearningProfile(sampleProfile(user.id));

    expect(isInterviewCompleteForUser({ id: user.id, interviewCompleted: false })).toBe(false);
    expect(shouldRedirectToInterview({ id: user.id, interviewCompleted: false })).toBe(true);
    expect(resolveAppAccessForUser(user.id)).toBe(false);
  });

  it("يفتح المنصة بالكامل عبر completePlatformAccess", () => {
    const user = createUser({
      fullName: "متدرب",
      email: "platform@example.com",
      password: "secret123",
    });
    createSessionForUser(user);

    const ok = completePlatformAccess(user.id, sampleProfile(user.id));

    expect(ok).toBe(true);
    expect(getUserById(user.id)?.interviewCompleted).toBe(true);
    expect(shouldRedirectToInterview({ id: user.id, interviewCompleted: false })).toBe(false);
    expect(resolveAppAccessForUser(user.id)).toBe(true);
  });

  it("ensureInterviewCompletion يحفظ الملف دون فتح المنصة", () => {
    const user = createUser({
      fullName: "جديد",
      email: "new@example.com",
      password: "secret123",
    });
    createSessionForUser(user);

    const profile = sampleProfile(user.id);
    const ok = ensureInterviewCompletion(user.id, profile);

    expect(ok).toBe(true);
    expect(isInterviewCompleteForUser({ id: user.id, interviewCompleted: false })).toBe(false);
    expect(shouldRedirectToInterview({ id: user.id, interviewCompleted: false })).toBe(true);
  });
});
