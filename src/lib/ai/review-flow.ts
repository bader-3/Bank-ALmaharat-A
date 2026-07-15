import type { AiChatMessage } from "@/types/ai";
import type { LessonReviewSession, ReviewMessage, ReviewQuizQuestion, ReviewStage } from "@/types/review";

export function reviewSessionKey(userId: string, courseSlug: string, lessonId: string) {
  return `${userId}::${courseSlug}::${lessonId}`;
}

export function createReviewMessage(role: ReviewMessage["role"], text: string): ReviewMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function buildWelcomeMessage(lessonTitle: string, courseTitle: string): string {
  return `أحسنت! أكملت درس «${lessonTitle}» من دورة «${courseTitle}».\n\nهل لديك أسئلة حول هذا الدرس؟`;
}

export function buildOfferQuizMessage(): string {
  return "هل تودّ أن أُعدّ لك اختبارًا قصيرًا على ما تعلّمته في هذا الدرس؟";
}

export function buildClosingMessage(): string {
  return "حسنًا، أنا في خدمتك في أي وقت. بالتوفيق في دروسك القادمة!";
}

export function createInitialReviewSession(params: {
  userId: string;
  courseSlug: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
}): LessonReviewSession {
  const now = new Date().toISOString();
  const welcome = buildWelcomeMessage(params.lessonTitle, params.courseTitle);

  return {
    schemaVersion: 1,
    id: reviewSessionKey(params.userId, params.courseSlug, params.lessonId),
    ownerId: params.userId,
    courseSlug: params.courseSlug,
    lessonId: params.lessonId,
    courseTitle: params.courseTitle,
    lessonTitle: params.lessonTitle,
    stage: "ask_questions",
    status: "in_progress",
    messages: [createReviewMessage("ai", welcome)],
    aiHistory: [],
    startedAt: now,
    updatedAt: now,
  };
}

export function scoreQuiz(questions: ReviewQuizQuestion[], answers: number[]): number {
  if (!questions.length) return 0;
  const correct = questions.filter((q, index) => answers[index] === q.correctIndex).length;
  return Math.round((correct / questions.length) * 100);
}

export function buildQuizResultsMessage(
  score: number,
  questions: ReviewQuizQuestion[],
  answers: number[],
): string {
  const correct = questions.filter((q, index) => answers[index] === q.correctIndex).length;
  const total = questions.length;

  if (score >= 80) {
    return `نتيجتك ${score}٪ (${correct} من ${total}) — ممتاز! يبدو أنك استوعبت الدرس جيدًا.`;
  }
  if (score >= 60) {
    return `نتيجتك ${score}٪ (${correct} من ${total}) — جيد. راجع النقاط التي أخطأت فيها قبل الدرس التالي.`;
  }
  return `نتيجتك ${score}٪ (${correct} من ${total}). أنصحك بمراجعة الدرس مرة أخرى — ويمكنك العودة لهذه الجلسة لاحقًا.`;
}

export function stageAllowsTextInput(stage: ReviewStage): boolean {
  return stage === "qna";
}

export function stageChipActions(stage: ReviewStage): Array<{ label: string; value: string }> {
  switch (stage) {
    case "ask_questions":
      return [
        { label: "نعم، لدي أسئلة", value: "yes_questions" },
        { label: "لا، شكرًا", value: "no_questions" },
      ];
    case "qna":
      return [
        { label: "لخّص الدرس", value: "summarize" },
        { label: "لم أفهم المثال", value: "example_help" },
        { label: "لا مزيد من الأسئلة", value: "done_questions" },
      ];
    case "offer_quiz":
      return [
        { label: "نعم، اختبار قصير", value: "yes_quiz" },
        { label: "لا، شكرًا", value: "no_quiz" },
      ];
    case "closing":
      return [];
    default:
      return [];
  }
}

export function appendExchange(
  session: LessonReviewSession,
  userText: string,
  aiText: string,
): Pick<LessonReviewSession, "messages" | "aiHistory" | "updatedAt"> {
  const userMessage = createReviewMessage("user", userText);
  const aiMessage = createReviewMessage("ai", aiText);
  const aiHistory: AiChatMessage[] = [
    ...session.aiHistory,
    { role: "user", text: userText },
    { role: "model", text: aiText },
  ];

  return {
    messages: [...session.messages, userMessage, aiMessage],
    aiHistory,
    updatedAt: new Date().toISOString(),
  };
}
