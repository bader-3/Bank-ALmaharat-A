import type { AiChatMessage, AiGeneratedProfile } from "@/types/ai";
import type { AssistantContext } from "@/lib/ai/prompts";
import type { LearningProfile } from "@/types/interview";

const PROFILE_READY_MARKER = "[PROFILE_READY]";

async function readTextStream(
  response: Response,
  onChunk?: (accumulated: string) => void,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("لا يوجد استجابة");

  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    text += chunk;
    onChunk?.(text);
  }

  return text;
}

async function postJson<T>(url: string, body: unknown, errorMessage: string): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? errorMessage);
  }

  return (await response.json()) as T;
}

export async function streamInterviewReply(
  messages: AiChatMessage[],
  onChunk?: (text: string) => void,
): Promise<{
  text: string;
  profileReady: boolean;
}> {
  const response = await fetch("/api/ai/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "فشل الاتصال بالمساعد الذكي");
  }

  const text = await readTextStream(response, onChunk);
  const profileReady = text.includes(PROFILE_READY_MARKER);
  const cleaned = text.replace(PROFILE_READY_MARKER, "").trim();

  return { text: cleaned, profileReady };
}

export async function generateProfileFromConversation(
  messages: AiChatMessage[],
): Promise<AiGeneratedProfile> {
  const data = await postJson<{ profile: AiGeneratedProfile }>(
    "/api/ai/profile",
    { messages },
    "فشل بناء الملف التعليمي",
  );
  return data.profile;
}

export async function streamAssistantReply(params: {
  messages: AiChatMessage[];
  context: AssistantContext;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const response = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "فشل الاتصال بالمساعد");
  }

  const text = await readTextStream(response, params.onChunk);
  return text.trim();
}

export async function streamReviewReply(params: {
  messages: import("@/types/ai").AiChatMessage[];
  context: import("@/types/review").ReviewContext;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const response = await fetch("/api/ai/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "فشل الاتصال بجلسة المراجعة");
  }

  const text = await readTextStream(response, params.onChunk);
  return text.trim();
}

export async function generateReviewQuiz(
  context: import("@/types/review").ReviewContext,
): Promise<import("@/types/review").ReviewQuizQuestion[]> {
  const data = await postJson<{ questions: import("@/types/review").ReviewQuizQuestion[] }>(
    "/api/ai/review/quiz",
    { context },
    "فشل إنشاء الاختبار",
  );
  return data.questions;
}

export function aiProfileToLearningProfile(
  userId: string,
  ai: AiGeneratedProfile,
  conversationHistory: AiChatMessage[],
): LearningProfile {
  return {
    userId,
    answers: ai.answers,
    summary: ai.summary,
    suggestedSkills: ai.suggestedSkills,
    suggestedPath: ai.suggestedPath,
    completedAt: new Date().toISOString(),
    aiGenerated: true,
    conversationHistory,
    learningPlan: ai.learningPlan,
    courseRecommendations: ai.courseRecommendations,
  };
}
