import {
  getAiErrorMessage,
  logAiError,
  parseJsonResponse,
  withGeminiFallback,
} from "@/lib/ai/gemini";
import { mockPlanningExtraction, isAiFallbackEnabled } from "@/lib/ai/mock-fallback";
import {
  mergePlanningPreferences,
  validatePlanningExtraction,
} from "@/lib/ai/planning";
import { PLAN_EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import type { PlanningPreferences } from "@/types/noor";

export const runtime = "nodejs";

type PlanRequest = {
  message: string;
  currentPreferences?: unknown;
};

function validateRequest(value: unknown):
  | { ok: true; data: { message: string; currentPreferences: PlanningPreferences } }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "صيغة الطلب غير صالحة." };
  }

  const body = value as PlanRequest;
  if (typeof body.message !== "string" || !body.message.trim()) {
    return { ok: false, error: "رسالة التخطيط مطلوبة." };
  }
  if (body.message.length > 4_000) {
    return { ok: false, error: "رسالة التخطيط طويلة جدًا." };
  }
  if (
    body.currentPreferences !== undefined &&
    (!body.currentPreferences ||
      typeof body.currentPreferences !== "object" ||
      Array.isArray(body.currentPreferences))
  ) {
    return { ok: false, error: "تفضيلات التخطيط غير صالحة." };
  }

  const current = validatePlanningExtraction(body.currentPreferences);
  return {
    ok: true,
    data: {
      message: body.message.trim(),
      currentPreferences: {
        ...current,
        deliveryModes: current.deliveryModes ?? [],
      },
    },
  };
}

export async function POST(request: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return Response.json({ error: "يجب إرسال JSON صالح." }, { status: 400 });
    }

    const validated = validateRequest(rawBody);
    if (!validated.ok) {
      return Response.json({ error: validated.error }, { status: 400 });
    }

    const { message, currentPreferences } = validated.data;
    const deterministic = mockPlanningExtraction(message, currentPreferences);
    let extraction = deterministic;
    let source = "mock-fallback";

    try {
      const result = await withGeminiFallback(
        "ai/plan",
        PLAN_EXTRACTION_SYSTEM_PROMPT,
        async (model, modelName) => {
          const response = await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `التفضيلات المحفوظة للسياق فقط:\n${JSON.stringify(currentPreferences)}\n\nرسالة المستخدم الحالية:\n${message}\n\nاستخرج المذكور في الرسالة الحالية فقط.`,
                  },
                ],
              },
            ],
            generationConfig: { responseMimeType: "application/json" },
          });
          console.info(`[ai/plan] success with model: ${modelName}`);
          return response.response.text();
        },
      );
      extraction = {
        ...deterministic,
        ...validatePlanningExtraction(parseJsonResponse<unknown>(result)),
      };
      source = "gemini";
    } catch (geminiError) {
      logAiError("ai/plan:gemini-failed", geminiError);
      if (!isAiFallbackEnabled()) throw geminiError;
    }

    const preferences = mergePlanningPreferences(currentPreferences, extraction);
    return Response.json({
      extraction,
      extractedFields: Object.keys(extraction),
      preferences,
      source,
    });
  } catch (error) {
    logAiError("ai/plan", error);
    return Response.json({ error: getAiErrorMessage(error) }, { status: 500 });
  }
}
