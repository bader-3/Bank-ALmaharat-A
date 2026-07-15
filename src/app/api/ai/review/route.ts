import { getAiErrorMessage, logAiError } from "@/lib/ai/gemini";
import { createGeminiTextStreamResponse } from "@/lib/ai/stream-route";
import { mockReviewReply } from "@/lib/ai/mock-fallback";
import { buildReviewSystemPrompt } from "@/lib/ai/prompts";
import type { ReviewContext } from "@/types/review";
import type { AiChatMessage } from "@/types/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages: AiChatMessage[];
      context: ReviewContext;
    };

    const messages = body.messages ?? [];
    const context = body.context;
    if (!context?.lessonTitle) {
      return Response.json({ error: "سياق الدرس مطلوب." }, { status: 400 });
    }

    const systemPrompt = buildReviewSystemPrompt(context);
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.text }],
    }));

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.text) {
      return Response.json({ error: "السؤال مطلوب." }, { status: 400 });
    }

    return await createGeminiTextStreamResponse({
      scope: "ai/review",
      systemPrompt,
      history,
      userText: lastMessage.text,
      mockFallback: () => mockReviewReply(lastMessage.text, context.lessonTitle),
    });
  } catch (error) {
    logAiError("ai/review", error);
    return Response.json({ error: getAiErrorMessage(error) }, { status: 500 });
  }
}
