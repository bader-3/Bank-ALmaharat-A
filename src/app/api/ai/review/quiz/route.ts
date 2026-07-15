import {
  getAiErrorMessage,
  logAiError,
  parseJsonResponse,
  withGeminiFallback,
} from "@/lib/ai/gemini";
import { isAiFallbackEnabled, mockReviewQuiz } from "@/lib/ai/mock-fallback";
import { REVIEW_QUIZ_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { ReviewContext, ReviewQuizQuestion } from "@/types/review";

export const runtime = "nodejs";

type QuizPayload = { questions: ReviewQuizQuestion[] };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { context: ReviewContext };
    const context = body.context;
    if (!context?.lessonTitle) {
      return Response.json({ error: "سياق الدرس مطلوب." }, { status: 400 });
    }

    try {
      const result = await withGeminiFallback(
        "ai/review/quiz",
        REVIEW_QUIZ_SYSTEM_PROMPT,
        async (model, modelName) => {
          const response = await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `سياق الدرس:\n${context.lessonContext}\n\nأنشئ اختبارًا قصيرًا بصيغة JSON فقط.`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          });

          console.info(`[ai/review/quiz] success with model: ${modelName}`);
          return response.response.text();
        },
      );

      const parsed = parseJsonResponse<QuizPayload>(result);
      const questions = (parsed.questions ?? []).slice(0, 4).map((q, index) => ({
        id: q.id ?? `q${index + 1}`,
        question: q.question,
        options: q.options.slice(0, 4),
        correctIndex: Math.min(3, Math.max(0, q.correctIndex)),
        explanation: q.explanation ?? "",
      }));

      if (questions.length < 3) {
        throw new Error("quiz too short");
      }

      return Response.json({ questions, source: "gemini" });
    } catch (geminiError) {
      logAiError("ai/review/quiz:gemini-failed", geminiError);

      if (!isAiFallbackEnabled()) {
        throw geminiError;
      }

      console.warn("[ai/review/quiz] using mock fallback");
      return Response.json({
        questions: mockReviewQuiz(context.lessonTitle),
        source: "mock-fallback",
      });
    }
  } catch (error) {
    logAiError("ai/review/quiz", error);
    return Response.json({ error: getAiErrorMessage(error) }, { status: 500 });
  }
}
