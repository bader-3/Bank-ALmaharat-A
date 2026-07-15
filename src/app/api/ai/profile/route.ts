import {
  getAiErrorMessage,
  logAiError,
  parseJsonResponse,
  withGeminiFallback,
} from "@/lib/ai/gemini";
import { alignGeneratedProfileWithCatalog } from "@/lib/ai/align-profile-recommendations";
import { isAiFallbackEnabled, mockProfileFromConversation } from "@/lib/ai/mock-fallback";
import { PROFILE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { AiChatMessage, AiGeneratedProfile } from "@/types/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages: AiChatMessage[] };
    const messages = body.messages ?? [];

    const conversation = messages
      .map((m) => `${m.role === "user" ? "المتعلّم" : "المساعد"}: ${m.text}`)
      .join("\n\n");

    try {
      const result = await withGeminiFallback(
        "ai/profile",
        PROFILE_SYSTEM_PROMPT,
        async (model, modelName) => {
          const response = await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `محادثة المقابلة:\n\n${conversation}\n\nأنشئ الملف التعليمي بصيغة JSON فقط.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          });

          console.info(`[ai/profile] success with model: ${modelName}`);
          return response.response.text();
        },
      );

      const profile = alignGeneratedProfileWithCatalog(
        parseJsonResponse<AiGeneratedProfile>(result),
        messages,
      );
      return Response.json({ profile, source: "gemini" });
    } catch (geminiError) {
      logAiError("ai/profile:gemini-failed", geminiError);

      if (!isAiFallbackEnabled()) {
        throw geminiError;
      }

      console.warn("[ai/profile] using mock fallback");
      const profile = mockProfileFromConversation(messages);
      return Response.json({ profile, source: "mock-fallback" });
    }
  } catch (error) {
    logAiError("ai/profile", error);
    return Response.json({ error: getAiErrorMessage(error) }, { status: 500 });
  }
}
