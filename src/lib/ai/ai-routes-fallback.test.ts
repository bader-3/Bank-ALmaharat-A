import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/gemini")>();
  return {
    ...actual,
    withGeminiFallback: vi.fn(async () => {
      throw new Error("429 Too Many Requests — quota exceeded");
    }),
  };
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("AI routes mock fallback on Gemini failure", () => {
  beforeEach(() => {
    vi.stubEnv("AI_FALLBACK_ON_ERROR", "true");
  });

  it("assistant returns 200 mock text when Gemini rejects", async () => {
    const { POST } = await import("@/app/api/ai/assistant/route");
    const response = await POST(
      jsonRequest({
        messages: [{ role: "user", text: "كيف أشتري ساعات؟" }],
        context: { isAuthenticated: false },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-AI-Source")).toBe("mock-fallback");
    const text = await response.text();
    expect(text.trim().length).toBeGreaterThan(10);
  });

  it("interview returns 200 mock text when Gemini rejects", async () => {
    const { POST } = await import("@/app/api/ai/interview/route");
    const response = await POST(
      jsonRequest({
        messages: [{ role: "user", text: "ابدأ المقابلة" }],
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-AI-Source")).toBe("mock-fallback");
    const text = await response.text();
    expect(text).toContain("نور");
  });

  it("review returns 200 mock text when Gemini rejects", async () => {
    const { POST } = await import("@/app/api/ai/review/route");
    const response = await POST(
      jsonRequest({
        messages: [{ role: "user", text: "لخّص الدرس" }],
        context: {
          lessonTitle: "فهم ثقة أعلى في المحادثة",
          lessonContext: "درس عن المحادثة المهنية",
          courseTitle: "إنجليزي مهني للتواصل",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-AI-Source")).toBe("mock-fallback");
    const text = await response.text();
    expect(text.trim().length).toBeGreaterThan(5);
  });

  it("plan returns 200 JSON mock when Gemini rejects", async () => {
    const { POST } = await import("@/app/api/ai/plan/route");
    const response = await POST(
      jsonRequest({
        message: "هدفي الإنجليزية المهنية",
        currentPreferences: { deliveryModes: [] },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      source: string;
      preferences: unknown;
      extraction: unknown;
    };
    expect(body.source).toBe("mock-fallback");
    expect(body.preferences).toBeTruthy();
    expect(body.extraction).toBeTruthy();
  });

  it("profile returns 200 JSON mock when Gemini rejects", async () => {
    const { POST } = await import("@/app/api/ai/profile/route");
    const response = await POST(
      jsonRequest({
        messages: [
          { role: "user", text: "أريد تطوير الإنجليزية المهنية" },
          { role: "model", text: "ما مستواك؟" },
          { role: "user", text: "متوسط" },
        ],
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      source: string;
      profile: { summary?: string; answers?: unknown };
    };
    expect(body.source).toBe("mock-fallback");
    expect(body.profile?.answers).toBeTruthy();
  });

  it("review/quiz returns 200 JSON mock when Gemini rejects", async () => {
    const { POST } = await import("@/app/api/ai/review/quiz/route");
    const response = await POST(
      jsonRequest({
        context: {
          lessonTitle: "فهم ثقة أعلى في المحادثة",
          lessonContext: "درس عن المحادثة المهنية",
          courseTitle: "إنجليزي مهني للتواصل",
        },
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      source: string;
      questions: unknown[];
    };
    expect(body.source).toBe("mock-fallback");
    expect(body.questions.length).toBeGreaterThanOrEqual(3);
  });
});
