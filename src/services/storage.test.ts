import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COURSES } from "@/lib/courses/mock-data";
import { MockLearningService } from "@/services/learning";
import {
  addPersonalGoal,
  carryOverdueGoals,
  getGoalPlan,
  replaceWithAcceptedPlan,
  toggleGoalComplete,
} from "@/services/goals/mock-goals-storage";
import {
  addHours,
  deductHours,
  getWalletBalance,
  hasEnoughHours,
} from "@/services/wallet/mock-wallet-storage";
import type { LearningGoal } from "@/types/goals";

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
    value: {
      localStorage: new MemoryStorage(),
      dispatchEvent: vi.fn(),
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("تخزين الأهداف", () => {
  it("يحفظ الهدف ويكمّله ويرحّل المتأخر", () => {
    const added = addPersonalGoal("u1", {
      title: "  مراجعة الدرس  ",
      durationMinutes: 30,
      scheduledDate: "2026-07-10",
      startTime: "19:00",
    });

    expect(added.title).toBe("مراجعة الدرس");
    expect(getGoalPlan("u1").goals).toHaveLength(1);
    expect(toggleGoalComplete("u1", added.id)?.completedAt).toBeTruthy();
    expect(toggleGoalComplete("u1", added.id)?.completedAt).toBeUndefined();
    expect(carryOverdueGoals("u1", "2026-07-13").goals[0].scheduledDate).toBe(
      "2026-07-13",
    );
  });

  it("لا يكرر الخطة المقبولة ويحافظ على الأهداف الشخصية", () => {
    addPersonalGoal("u1", {
      title: "هدف شخصي",
      durationMinutes: 20,
      scheduledDate: "2026-07-13",
      startTime: "18:00",
    });
    const aiGoal: LearningGoal = {
      id: "ai-1",
      title: "درس",
      durationMinutes: 45,
      source: "ai",
      originalDate: "2026-07-14",
      scheduledDate: "2026-07-14",
      startTime: "18:00",
      createdAt: "2026-07-13T00:00:00.000Z",
    };

    replaceWithAcceptedPlan("u1", "plan-1", "2026-07-13T00:00:00.000Z", [aiGoal]);
    replaceWithAcceptedPlan("u1", "plan-1", "2026-07-13T00:00:00.000Z", [aiGoal]);

    expect(getGoalPlan("u1").goals.map((goal) => goal.source).sort()).toEqual([
      "ai",
      "personal",
    ]);
  });
});

describe("المحفظة وبدء التعلم", () => {
  it("يحسب الساعات ويمنع الخصم عند عدم كفاية الرصيد", () => {
    expect(addHours("u1", 5)).toBe(5);
    expect(hasEnoughHours("u1", 6)).toBe(false);
    expect(deductHours("u1", 6)).toBeNull();
    expect(getWalletBalance("u1")).toBe(5);
    expect(deductHours("u1", 3)).toBe(2);
  });

  it("يرفض الدورة المختلقة والرصيد غير الكافي على مستوى الخدمة", async () => {
    vi.useFakeTimers();
    const service = new MockLearningService();

    const missingPromise = service.startLearning("guest", "دورة-مختلقة");
    await vi.advanceTimersByTimeAsync(500);
    await expect(missingPromise).resolves.toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });

    const noBalancePromise = service.startLearning("guest", COURSES[0].slug);
    await vi.advanceTimersByTimeAsync(500);
    await expect(noBalancePromise).resolves.toMatchObject({
      success: false,
      code: "NO_BALANCE",
    });
  });

  it("يخصم ساعات الدرس الأول فقط عند بدء التعلم", async () => {
    vi.useFakeTimers();
    const service = new MockLearningService();
    const course = COURSES[0];
    const firstLesson = course.syllabus[0].lessons[0];
    const firstLessonHours = Math.round((firstLesson.durationMinutes / 60) * 100) / 100;

    addHours("u1", firstLessonHours);

    const startPromise = service.startLearning("u1", course.slug);
    await vi.advanceTimersByTimeAsync(500);
    const result = await startPromise;

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.enrollment.purchasedLessons).toEqual([firstLesson.id]);
    expect(result.enrollment.hoursUsed).toBe(firstLessonHours);
    expect(getWalletBalance("u1")).toBe(0);
    expect(getGoalPlan("u1").goals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          courseSlug: course.slug,
          lessonId: firstLesson.id,
          source: "ai",
        }),
      ]),
    );
  });

  it("يشتري الدورة كاملة دفعة واحدة", async () => {
    vi.useFakeTimers();
    const service = new MockLearningService();
    const course = COURSES[0];
    const lessons = course.syllabus.flatMap((module) => module.lessons);
    const totalHours = lessons.reduce(
      (sum, lesson) => sum + Math.round((lesson.durationMinutes / 60) * 100) / 100,
      0,
    );

    addHours("u1", totalHours);

    const purchasePromise = service.purchaseAllRemaining("u1", course.slug);
    await vi.advanceTimersByTimeAsync(500);
    const result = await purchasePromise;

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.enrollment.purchasedLessons).toHaveLength(lessons.length);
    expect(getWalletBalance("u1")).toBe(0);
  });
});
