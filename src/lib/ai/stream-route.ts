import { logAiError, withGeminiFallback } from "@/lib/ai/gemini";
import { isAiFallbackEnabled } from "@/lib/ai/mock-fallback";

type ChatHistoryEntry = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

export async function createGeminiTextStreamResponse(params: {
  scope: string;
  systemPrompt: string;
  history: ChatHistoryEntry[];
  userText: string;
  mockFallback: () => string;
  fallbackLogMessage?: string;
}): Promise<Response> {
  const { scope, systemPrompt, history, userText, mockFallback, fallbackLogMessage } = params;

  try {
    const result = await withGeminiFallback(scope, systemPrompt, async (model, modelName) => {
      const chat = model.startChat({ history });
      const streamResult = await chat.sendMessageStream(userText);
      console.info(`[${scope}] success with model: ${modelName}`);
      return streamResult;
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(encoder.encode(chunk.text()));
          }
          controller.close();
        } catch (error) {
          logAiError(`${scope}:stream`, error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-AI-Source": "gemini",
      },
    });
  } catch (geminiError) {
    logAiError(`${scope}:gemini-failed`, geminiError);

    if (!isAiFallbackEnabled()) {
      throw geminiError;
    }

    console.warn(fallbackLogMessage ?? `[${scope}] using mock fallback`);
    const mockText = mockFallback();

    return new Response(mockText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-AI-Source": "mock-fallback",
      },
    });
  }
}
