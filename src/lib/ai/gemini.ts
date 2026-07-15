import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

/** Override in .env.local: GEMINI_MODEL=gemini-2.0-flash-lite */
const ENV_MODEL = process.env.GEMINI_MODEL?.trim();

/** Models tried in order — lite variants are fast and cheap for chat. */
export const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
] as const;

export const GEMINI_MODEL = (ENV_MODEL ?? GEMINI_MODELS[0]) as (typeof GEMINI_MODELS)[number] | string;

export function getGeminiApiKey(): string {
  const raw = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const apiKey = raw?.trim();

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to .env.local and restart the dev server.",
    );
  }

  return apiKey;
}

/**
 * A configured key is considered usable if it is present and looks like a real
 * credential (not the placeholder). Google issues API keys in multiple formats
 * (e.g. "AIza…" and "AQ.…"), so we only reject empty/placeholder values and
 * let the API be the source of truth.
 */
export function hasLikelyValidGeminiKey(): boolean {
  const raw = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY)?.trim();
  if (!raw || raw.length < 20) return false;
  if (raw === "your_gemini_api_key_here") return false;
  return true;
}

export function getGeminiClient() {
  return new GoogleGenerativeAI(getGeminiApiKey());
}

export function getGeminiModel(
  systemInstruction?: string,
  modelName: string = GEMINI_MODEL,
): GenerativeModel {
  const client = getGeminiClient();
  return client.getGenerativeModel({
    model: modelName,
    ...(systemInstruction ? { systemInstruction } : {}),
  });
}

export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export function logAiError(scope: string, error: unknown) {
  if (error instanceof Error) {
    const extra = error as Error & { status?: number; statusText?: string; errorDetails?: unknown };
    console.error(`[${scope}]`, {
      message: error.message,
      name: error.name,
      status: extra.status,
      statusText: extra.statusText,
      errorDetails: extra.errorDetails,
      stack: error.stack,
    });
    return;
  }

  console.error(`[${scope}]`, error);
}

export function getAiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "تعذّر الاتصال بالمساعد الذكي. حاول مجددًا.";
  }

  const msg = error.message;

  if (msg.includes("GEMINI_API_KEY is not configured")) {
    return "مفتاح API غير مضبوط. أضف GEMINI_API_KEY في .env.local وأعد تشغيل السيرفر.";
  }

  if (msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
    return "مفتاح API غير صالح. أنشئ مفتاحًا من Google AI Studio (يبدأ عادةً بـ AIza).";
  }

  if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests") || msg.includes("limit: 0")) {
    return "حصة Gemini منتهية على هذا المفتاح (limit: 0). أنشئ مفتاحًا جديدًا من Google AI Studio — أو سيُفعَّل الوضع التجريبي تلقائيًا.";
  }

  if (msg.includes("404") || msg.includes("not found")) {
    return "النموذج غير متاح على هذا المفتاح. جرّب تحديث المشروع أو تغيير النموذج.";
  }

  return "تعذّر الاتصال بالمساعد الذكي. حاول مجددًا.";
}

type GenerateFn<T> = (model: GenerativeModel, modelName: string) => Promise<T>;

/** Try models in order until one succeeds (handles quota / model availability). */
export async function withGeminiFallback<T>(
  scope: string,
  systemInstruction: string | undefined,
  fn: GenerateFn<T>,
): Promise<T> {
  if (!hasLikelyValidGeminiKey()) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add a valid key (starts with AIza) to .env.local.",
    );
  }

  let lastError: unknown;

  const modelsToTry = ENV_MODEL
    ? [ENV_MODEL, ...GEMINI_MODELS.filter((m) => m !== ENV_MODEL)]
    : [...GEMINI_MODELS];

  for (const modelName of modelsToTry) {
    try {
      const model = getGeminiModel(systemInstruction, modelName);
      console.info(`[${scope}] trying model: ${modelName}`);
      return await fn(model, modelName);
    } catch (error) {
      lastError = error;
      logAiError(`${scope}:${modelName}`, error);

      const message = error instanceof Error ? error.message : "";
      const retryable =
        message.includes("429") ||
        message.includes("quota") ||
        message.includes("404") ||
        message.includes("not found") ||
        message.includes("Too Many Requests");

      if (!retryable) break;
    }
  }

  throw lastError;
}
