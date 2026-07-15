import { getAiErrorMessage, logAiError } from "@/lib/ai/gemini";
import { createGeminiTextStreamResponse } from "@/lib/ai/stream-route";
import { mockInterviewReply } from "@/lib/ai/mock-fallback";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { AiChatMessage } from "@/types/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages: AiChatMessage[] };
    const messages = body.messages ?? [];

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.text }],
    }));

    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage?.text ?? "ابدأ المقابلة";

    return await createGeminiTextStreamResponse({
      scope: "ai/interview",
      systemPrompt: INTERVIEW_SYSTEM_PROMPT,
      history,
      userText,
      mockFallback: () => mockInterviewReply(messages),
      fallbackLogMessage: "[ai/interview] using mock fallback — check Gemini quota / API key",
    });
  } catch (error) {
    logAiError("ai/interview", error);
    return Response.json({ error: getAiErrorMessage(error) }, { status: 500 });
  }
}
