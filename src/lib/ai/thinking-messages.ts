export type ThinkingContext = "plan" | "general";

/** Short Arabic status lines shown while waiting for Noor's reply (visual only). */
export const THINKING_MESSAGES: Record<ThinkingContext, readonly string[]> = {
  plan: [
    "يحلّل ملفك التعليمي…",
    "يقارن الدورات المتاحة…",
    "يبني التوصية المناسبة…",
  ],
  general: ["يفكّر…", "يراجع السياق…"],
};

export function resolveThinkingContext(options: {
  lastUserText?: string;
  isPlanningActive?: boolean;
  asksForPlan?: boolean;
}): ThinkingContext {
  if (options.isPlanningActive || options.asksForPlan) return "plan";

  const text = (options.lastUserText ?? "").trim();
  if (/خط[ةهت]/.test(text) && /(اعد|جهز|انشئ|اعمل|ابني|سوي|اريد|ابي|بغى)/.test(text)) {
    return "plan";
  }

  return "general";
}

export function getThinkingMessages(context: ThinkingContext): readonly string[] {
  return THINKING_MESSAGES[context];
}
