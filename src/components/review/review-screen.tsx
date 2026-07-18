"use client";

import { ReviewQuiz } from "@/components/review/review-quiz";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconArrow, IconSparkle } from "@/components/ui/icons";
import { useInterviewGate } from "@/hooks/use-interview-gate";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import {
  appendExchange,
  buildClosingMessage,
  buildOfferQuizMessage,
  buildQuizResultsMessage,
  createReviewMessage,
  scoreQuiz,
  stageAllowsTextInput,
  stageChipActions,
} from "@/lib/ai/review-flow";
import { buildLessonContext, findCourseLesson } from "@/lib/learning/lesson-context";
import { ROUTES } from "@/lib/constants";
import { getCourseBySlug, getTrainerById } from "@/lib/courses/mock-data";
import { getLessonsForCourse } from "@/lib/learning/lessons";
import { cn } from "@/lib/cn";
import { generateReviewQuiz, streamReviewReply } from "@/services/ai/client";
import { getLearningService } from "@/services/learning";
import { getReviewService } from "@/services/review";
import type { AiChatMessage } from "@/types/ai";
import type { LessonReviewSession, ReviewContext, ReviewMessage } from "@/types/review";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ReviewScreenProps {
  slug: string;
  lessonId: string;
}

export function ReviewScreen({ slug, lessonId }: ReviewScreenProps) {
  const router = useRouter();
  const { user, authLoading, interviewReady } = useInterviewGate();
  useRequireAuth();

  const [session, setSession] = useState<LessonReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const course = useMemo(() => getCourseBySlug(slug), [slug]);
  const lessonMeta = useMemo(
    () => (course ? findCourseLesson(course, lessonId) : null),
    [course, lessonId],
  );
  const trainer = useMemo(
    () => (course ? getTrainerById(course.trainerId) : undefined),
    [course],
  );

  const reviewContext = useMemo((): ReviewContext | null => {
    if (!course || !lessonMeta) return null;
    const lessonContext = buildLessonContext(course, lessonId);
    if (!lessonContext) return null;

    return {
      courseTitle: course.title,
      courseSummary: course.summary,
      lessonId,
      lessonTitle: lessonMeta.lesson.title,
      moduleTitle: lessonMeta.module.title,
      lessonOutcomes: lessonMeta.lesson.outcomes,
      lessonContext,
      trainerName: trainer?.name,
    };
  }, [course, lessonId, lessonMeta, trainer?.name]);

  const persist = useCallback(async (next: LessonReviewSession) => {
    setSession(next);
    await getReviewService().saveSession(next);
  }, []);

  const load = useCallback(async () => {
    if (!user || !course || !lessonMeta) return;

    setLoading(true);
    const enrollment = await getLearningService().getEnrollment(user.id, slug);
    if (!enrollment?.completedLessons.includes(lessonId)) {
      router.replace(ROUTES.learn(slug));
      return;
    }

    const existing = await getReviewService().getOrCreateSession({
      userId: user.id,
      courseSlug: slug,
      lessonId,
      courseTitle: course.title,
      lessonTitle: lessonMeta.lesson.title,
    });

    setSession(existing);
    setLoading(false);
  }, [user, course, lessonMeta, slug, lessonId, router]);

  useEffect(() => {
    if (!interviewReady || !user) return;
    void load();
  }, [interviewReady, user, load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [session?.messages, isTyping, session?.stage]);

  async function streamAiReply(
    current: LessonReviewSession,
    userText: string,
    history: AiChatMessage[],
  ) {
    if (!reviewContext) return;

    const userMessage = createReviewMessage("user", userText);
    const aiId = createReviewMessage("ai", "").id;
    const withUser: LessonReviewSession = {
      ...current,
      messages: [...current.messages, userMessage, { ...createReviewMessage("ai", ""), id: aiId }],
    };
    setSession(withUser);
    setIsTyping(true);
    setError("");

    try {
      const reply = await streamReviewReply({
        messages: [...history, { role: "user", text: userText }],
        context: reviewContext,
        onChunk: (chunk) => {
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  messages: prev.messages.map((m) => (m.id === aiId ? { ...m, text: chunk } : m)),
                }
              : prev,
          );
        },
      });

      const next: LessonReviewSession = {
        ...withUser,
        messages: withUser.messages.map((m) => (m.id === aiId ? { ...m, text: reply } : m)),
        aiHistory: [...history, { role: "user", text: userText }, { role: "model", text: reply }],
        updatedAt: new Date().toISOString(),
      };
      await persist(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحصول على رد");
      setSession((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== aiId) } : prev,
      );
    } finally {
      setIsTyping(false);
    }
  }

  async function handleChip(value: string) {
    if (!session) return;

    if (value === "yes_questions") {
      const exchange = appendExchange(session, "نعم، لدي أسئلة", "تفضل — ما سؤالك حول الدرس؟");
      await persist({ ...session, ...exchange, stage: "qna" });
      return;
    }

    if (value === "no_questions") {
      const exchange = appendExchange(session, "لا، شكرًا", buildOfferQuizMessage());
      await persist({ ...session, ...exchange, stage: "offer_quiz" });
      return;
    }

    if (value === "summarize") {
      await streamAiReply(session, "لخّص لي الدرس في نقاط قصيرة", session.aiHistory);
      return;
    }

    if (value === "example_help") {
      await streamAiReply(session, "لم أفهم المثال في الدرس — وضّحه لي", session.aiHistory);
      return;
    }

    if (value === "done_questions") {
      const exchange = appendExchange(session, "لا مزيد من الأسئلة", buildOfferQuizMessage());
      await persist({ ...session, ...exchange, stage: "offer_quiz" });
      return;
    }

    if (value === "yes_quiz") {
      if (!reviewContext) return;
      setIsGeneratingQuiz(true);
      setError("");

      const withPrompt = appendExchange(session, "نعم، اختبار قصير", "جاري إعداد اختبار قصير…");
      await persist({ ...session, ...withPrompt, stage: "quiz" });

      try {
        const questions = await generateReviewQuiz(reviewContext);
        await persist({
          ...session,
          ...withPrompt,
          stage: "quiz",
          messages: [
            ...withPrompt.messages.slice(0, -1),
            createReviewMessage("ai", "إليك اختبارًا قصيرًا — 4 أسئلة:"),
          ],
          quiz: { questions, answers: [] },
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذّر إنشاء الاختبار");
        await persist({ ...session, stage: "offer_quiz" });
      } finally {
        setIsGeneratingQuiz(false);
      }
      return;
    }

    if (value === "no_quiz") {
      const exchange = appendExchange(session, "لا، شكرًا", buildClosingMessage());
      await persist({
        ...session,
        ...exchange,
        stage: "closing",
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    }
  }

  async function handleSendQuestion() {
    const text = input.trim();
    if (!text || !session || session.stage !== "qna" || isTyping) return;
    setInput("");
    await streamAiReply(session, text, session.aiHistory);
  }

  async function handleQuizSubmit(answers: number[]) {
    if (!session?.quiz) return;
    const score = scoreQuiz(session.quiz.questions, answers);
    const resultsText = buildQuizResultsMessage(score, session.quiz.questions, answers);
    const exchange = appendExchange(session, "أنهيت الاختبار", resultsText);

    await persist({
      ...session,
      ...exchange,
      stage: "closing",
      status: "completed",
      completedAt: new Date().toISOString(),
      quiz: { ...session.quiz, answers, score },
    });
  }

  async function handleSkip() {
    if (!session) return;
    await persist({
      ...session,
      status: "skipped",
      stage: "closing",
      completedAt: new Date().toISOString(),
    });
    router.push(ROUTES.learn(slug));
  }

  if (!course || !lessonMeta) notFound();

  if (authLoading || !user || !interviewReady || loading || !session) {
    return (
      <Container className="py-24">
        <p className="text-center text-foreground-muted">جاري تحميل جلسة المراجعة…</p>
      </Container>
    );
  }

  const chips = stageChipActions(session.stage);
  const showInput = stageAllowsTextInput(session.stage) && !isTyping;
  const lessons = getLessonsForCourse(course);
  const lessonIndex = lessons.findIndex((l) => l.id === lessonId);
  const nextLesson = lessons[lessonIndex + 1];

  return (
    <Container className="py-10 lg:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={ROUTES.learn(slug)}
            className="inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground"
          >
            <IconArrow className="rotate-180" />
            العودة للتعلّم
          </Link>
          {session.status === "in_progress" && session.stage !== "quiz" && (
            <button
              type="button"
              onClick={() => void handleSkip()}
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              تخطّي الآن
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2">
          <IconSparkle size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">جلسة ما بعد الدرس</p>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-navy-900 lg:text-3xl">{session.lessonTitle}</h1>
        <p className="mt-1 text-sm text-foreground-secondary">{session.courseTitle}</p>

        <Card
          padding="sm"
          className="mt-8 flex min-h-[28rem] flex-col overflow-hidden border-border/60 !p-0 shadow-sm"
        >
          <div className="border-b border-border/60 bg-sage-50/50 px-5 py-4">
            <p className="font-semibold text-navy-900">نور — مرافقة المراجعة</p>
            <p className="text-xs text-foreground-muted">
              أسئلة واختبار على هذا الدرس فقط — منفصلة عن محادثة نور العامة
            </p>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-4 sm:p-5">
            {session.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && (
              <p className="text-sm text-foreground-muted">نور تفكّر…</p>
            )}
            {isGeneratingQuiz && (
              <p className="text-sm text-foreground-muted">جاري إعداد الاختبار…</p>
            )}
          </div>

          {session.stage === "quiz" && session.quiz && !session.quiz.score && (
            <div className="border-t border-border/60 p-4">
              <ReviewQuiz
                questions={session.quiz.questions}
                onSubmit={(answers) => void handleQuizSubmit(answers)}
              />
            </div>
          )}

          {(chips.length > 0 || showInput) && session.stage !== "quiz" && (
            <div className="border-t border-border/60 p-4 space-y-3">
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      disabled={isTyping || isGeneratingQuiz}
                      onClick={() => void handleChip(chip.value)}
                      className="rounded-full border border-sage-300/70 bg-surface px-3 py-1.5 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-100 disabled:opacity-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}

              {showInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleSendQuestion()}
                    placeholder="اكتب سؤالك عن الدرس…"
                    className="flex-1 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm focus:border-sage-400 focus:outline-none"
                  />
                  <Button size="sm" disabled={!input.trim()} onClick={() => void handleSendQuestion()}>
                    إرسال
                  </Button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="border-t border-border/60 px-4 py-3 text-sm text-red-600">{error}</p>
          )}
        </Card>

        {session.status === "completed" && session.stage === "closing" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={ROUTES.learn(slug)} variant="secondary">
              العودة للدورة
            </Button>
            <Button href={ROUTES.activity}>سجل التعلّm</Button>
            {nextLesson && (
              <Button href={ROUTES.learn(slug)}>الدرس التالي</Button>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

function MessageBubble({ message }: { message: ReviewMessage }) {
  return (
    <div
      className={cn(
        "max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
        message.role === "ai"
          ? "bg-sage-50 text-foreground"
          : "ms-auto bg-navy-900 text-[#f2eee6]",
      )}
    >
      {message.text}
    </div>
  );
}
