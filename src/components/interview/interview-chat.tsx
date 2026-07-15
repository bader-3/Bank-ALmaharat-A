"use client";

import { ProfileSummary } from "@/components/interview/profile-summary";
import { LearningPlanCard } from "@/components/ai/learning-plan-card";
import { InterviewShell } from "@/components/interview/interview-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconSparkle } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { getInterviewService } from "@/services/interview";
import {
  aiProfileToLearningProfile,
  generateProfileFromConversation,
  streamInterviewReply,
} from "@/services/ai/client";
import type { AiChatMessage } from "@/types/ai";
import type {
  InterviewConversationMessage,
  LearningProfile,
} from "@/types/interview";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth-redirect";

type ChatMessage = InterviewConversationMessage;

export function InterviewChat() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const interview = getInterviewService();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiHistory, setAiHistory] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isBuildingProfile, setIsBuildingProfile] = useState(false);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, profile, isBuildingProfile]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    void Promise.all([interview.getConversation(user.id), interview.getProfile(user.id)]).then(
      ([conversation, savedProfile]) => {
        if (!active) return;
        if (conversation) {
          setMessages(conversation.messages);
          setAiHistory(conversation.aiHistory);
          setStarted(conversation.started);
        }
        if (savedProfile) {
          setProfile(savedProfile);
          setStarted(true);
        }
        setHydratedUserId(user.id);
      },
    );

    return () => {
      active = false;
    };
  }, [interview, user]);

  useEffect(() => {
    if (!user || hydratedUserId !== user.id || !started) return;
    void interview.saveConversation({
      userId: user.id,
      messages,
      aiHistory,
      started,
    });
  }, [aiHistory, hydratedUserId, interview, messages, started, user]);

  async function sendToAi(history: AiChatMessage[], displayUserText?: string) {
    if (displayUserText) {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, role: "user", text: displayUserText },
      ]);
    }

    setIsTyping(true);
    setError("");

    const aiId = `ai-${Date.now()}`;
    setMessages((prev) => [...prev, { id: aiId, role: "ai", text: "" }]);

    try {
      const { text, profileReady } = await streamInterviewReply(history, (chunk) => {
        setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, text: chunk } : m)));
      });

      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, text } : m)));
      setAiHistory([...history, { role: "model", text }]);

      if (profileReady && user) {
        await buildProfile([...history, { role: "model", text }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقّع");
      setMessages((prev) => prev.filter((m) => m.id !== aiId));
    } finally {
      setIsTyping(false);
    }
  }

  async function buildProfile(history: AiChatMessage[]) {
    if (!user) return;

    setIsBuildingProfile(true);
    setError("");

    try {
      const aiProfile = await generateProfileFromConversation(history);
      const fullProfile = aiProfileToLearningProfile(user.id, aiProfile, history);
      const saved = await interview.saveProfileAndSync(fullProfile);
      await refreshSession();
      setProfile(saved);
      setMessages((prev) => [
        ...prev,
        {
          id: "ai-profile-done",
          role: "ai",
          text: "تم بناء ملفك التعليمي! راجع الملخص أدناه ثم تابع إلى لوحتك.",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر بناء الملف");
    } finally {
      setIsBuildingProfile(false);
    }
  }

  async function startInterview() {
    setStarted(true);
    await sendToAi([{ role: "user", text: "ابدأ المقابلة" }]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isTyping || profile || isBuildingProfile) return;

    setInput("");
    const nextHistory: AiChatMessage[] = [...aiHistory, { role: "user", text }];
    setAiHistory(nextHistory);
    await sendToAi(nextHistory, text);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  async function goToAccount() {
    if (!user || navigating) return;

    setNavigating(true);
    setError("");

    try {
      const savedProfile = await interview.getProfile(user.id);
      if (!savedProfile) {
        throw new Error("لم يُحفظ ملفك بعد. انتظر لحظة ثم حاول مرة أخرى.");
      }

      await interview.syncInterviewCompletion(user.id);
      await refreshSession();
      router.replace(ROUTES.account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الانتقال إلى حسابك");
      setNavigating(false);
    }
  }

  if (isLoading || !isAuthenticated || !user || hydratedUserId !== user.id) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center py-24">
        <p className="text-foreground-muted">جاري التحميل…</p>
      </Container>
    );
  }

  const canInput = started && !profile && !isTyping && !isBuildingProfile;
  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const eyebrow = profile
    ? "اكتمل — ملفك جاهز"
    : isBuildingProfile
      ? "جاري بناء ملفك…"
      : started
        ? `محادثة ذكية — ${exchangeCount.toLocaleString("ar-SA")} رسالة`
        : "المقابلة الذكية";

  return (
    <InterviewShell
      eyebrow={eyebrow}
      title="المقابلة الذكية"
      description="محادثة مع نور لفهم أهدافك واقتراح مدربين ودورات مناسبة — قبل أن تشتري ساعات وتستكشف المنصة."
    >
      <div className="flex min-h-[32rem] flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-4 sm:p-5">
          {!started ? (
            <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500/15 text-sage-600">
                <IconSparkle size={24} />
              </span>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-foreground-secondary">
                تحدّث بحرّية بالعربية — نور تفهم أهدافك وتقترح مدربين ودورات مناسبة.
              </p>
              <Button size="lg" className="mt-6" onClick={() => void startInterview()}>
                ابدأ المحادثة
              </Button>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatBubble key={message.id} role={message.role} text={message.text} />
              ))}

              {isTyping && messages.at(-1)?.role !== "ai" && (
                <TypingIndicator label="نور تفكّر…" />
              )}
              {isBuildingProfile && <TypingIndicator label="جاري بناء ملفك…" />}

              {profile && (
                <div className="space-y-4 pt-2">
                  <Card variant="tint" padding="md">
                    <ProfileSummary profile={profile} />
                  </Card>
                  {profile.learningPlan && <LearningPlanCard plan={profile.learningPlan} />}
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {canInput && (
          <div className="border-t border-border/60 p-3 sm:p-4">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب إجابتك… (Enter للإرسال)"
                rows={2}
                className={cn(
                  "flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5",
                  "text-sm text-foreground placeholder:text-foreground-muted",
                  "outline-none focus:border-sage-400/60 focus:ring-[3px] focus:ring-sage-400/12",
                )}
              />
              <Button size="sm" disabled={!input.trim()} onClick={() => void handleSend()}>
                إرسال
              </Button>
            </div>
          </div>
        )}

        {profile && (
          <div className="border-t border-border/60 p-3 sm:p-4">
            <Button
              size="lg"
              fullWidth
              disabled={navigating}
              onClick={() => void goToAccount()}
            >
              {navigating ? "جاري التحميل…" : "انتقل إلى حسابي"}
            </Button>
          </div>
        )}
      </div>
    </InterviewShell>
  );
}

function ChatBubble({ role, text }: { role: "ai" | "user"; text: string }) {
  const isAi = role === "ai";

  return (
    <div className={cn("flex", isAi ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
          isAi ? "bg-sage-50/80 text-foreground dark:bg-surface-elevated dark:ring-1 dark:ring-border/50" : "bg-navy-900 text-[#f2eee6] dark:bg-sage-600 dark:text-white",
        )}
      >
        {text}
      </div>
    </div>
  );
}

function TypingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl bg-sage-50/80 px-3.5 py-2.5 dark:bg-surface-elevated dark:ring-1 dark:ring-border/50">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-400 [animation-delay:300ms]" />
        {label && <span className="text-xs text-sage-600">{label}</span>}
      </div>
    </div>
  );
}
