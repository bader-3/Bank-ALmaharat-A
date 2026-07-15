import { getAiErrorMessage, logAiError } from "@/lib/ai/gemini";
import { createGeminiTextStreamResponse } from "@/lib/ai/stream-route";
import { mockAssistantReply } from "@/lib/ai/mock-fallback";
import { buildAssistantSystemPrompt, type AssistantContext } from "@/lib/ai/prompts";
import type { AiChatMessage } from "@/types/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages: AiChatMessage[];
      context?: AssistantContext;
    };

    const messages = body.messages ?? [];
    const context: AssistantContext = body.context ?? { isAuthenticated: false };
    const systemPrompt = buildAssistantSystemPrompt(context);

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.text }],
    }));

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.text) {
      return Response.json({ error: "السؤال مطلوب." }, { status: 400 });
    }

    return await createGeminiTextStreamResponse({
      scope: "ai/assistant",
      systemPrompt,
      history,
      userText: lastMessage.text,
      mockFallback: () => mockAssistantReply(lastMessage.text, context),
    });
  } catch (error) {
    logAiError("ai/assistant", error);
    return Response.json({ error: getAiErrorMessage(error) }, { status: 500 });
  }
}
