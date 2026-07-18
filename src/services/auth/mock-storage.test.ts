import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSessionForUser,
  createUser,
  markInterviewCompleted,
  readSession,
} from "@/services/auth/mock-storage";

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
    },
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("جلسة المقابلة → الحساب", () => {
  it("يُحدّث interviewCompleted في الجلسة الحالية", () => {
    const user = createUser({
      fullName: "بدر",
      email: "bader@example.com",
      password: "secret123",
    });
    createSessionForUser(user);

    markInterviewCompleted(user.id);

    const session = readSession();
    expect(session?.user.id).toBe(user.id);
    expect(session?.user.interviewCompleted).toBe(true);
  });

  it("يُعيد إنشاء الجلسة إذا فُقدت من التخزين بعد المقابلة", () => {
    const user = createUser({
      fullName: "نور",
      email: "noor@example.com",
      password: "secret123",
    });

    markInterviewCompleted(user.id);

    const session = readSession();
    expect(session?.user.id).toBe(user.id);
    expect(session?.user.interviewCompleted).toBe(true);
  });
});
