"use client";

import { InterviewCompletionPanel } from "@/components/interview/interview-completion-panel";
import { ProfileSummary } from "@/components/interview/profile-summary";
import { InterviewShell } from "@/components/interview/interview-shell";
import { InterviewStructuredFlow } from "@/components/interview/interview-structured-flow";
import AuthShellLayout from "@/components/layout/auth-shell-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconSparkle } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { completePlatformAccess } from "@/lib/auth/interview-access";
import { useAuth } from "@/providers/auth-provider";
import { getInterviewService } from "@/services/interview";
import { createSessionForUser, getUserById, readSession } from "@/services/auth/mock-storage";
import {
  enrichDemoAccountAfterInterview,
  isDemoAccountEmail,
} from "@/services/demo/seed-demo-account";
import type { AiChatMessage } from "@/types/ai";
import type { InterviewConversationMessage, LearningProfile } from "@/types/interview";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRequireAuth } from "@/hooks/use-auth-redirect";

export function InterviewChat() {
  const { user, refreshSession } = useAuth();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const interview = getInterviewService();
  const userId = user?.id;

  const [messages, setMessages] = useState<InterviewConversationMessage[]>([]);
  const [aiHistory, setAiHistory] = useState<AiChatMessage[]>([]);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [pendingProfile, setPendingProfile] = useState<LearningProfile | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [navigating, setNavigating] = useState(false);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, profile]);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    void Promise.all([interview.getConversation(userId), interview.getProfile(userId)]).then(
      ([conversation, savedProfile]) => {
        if (!active) return;

        // Never auto-navigate — user must press «انتقل للموقع».
        if (savedProfile) {
          setPendingProfile(savedProfile);
          setHydratedUserId(userId);
          return;
        }

        if (conversation) {
          setMessages(conversation.messages);
          setAiHistory(conversation.aiHistory);
          setStarted(conversation.started);
        }

        setHydratedUserId(userId);
      },
    );

    return () => {
      active = false;
    };
  }, [interview, userId]);

  useEffect(() => {
    if (!userId || hydratedUserId !== userId || !started) return;
    void interview.saveConversation({
      userId,
      messages,
      aiHistory,
      started,
    });
  }, [aiHistory, hydratedUserId, interview, messages, started, userId]);

  const handleMessagesChange = useCallback(
    (nextMessages: InterviewConversationMessage[], nextHistory: AiChatMessage[]) => {
      setMessages(nextMessages);
      setAiHistory(nextHistory);
    },
    [],
  );

  async function handleProfileBuilt(built: LearningProfile) {
    if (!user) return;

    try {
      // Save profile only — do NOT unlock or navigate until the user presses the button.
      const saved = await interview.saveProfileAndSync(built);
      setProfile(saved);
      setPendingProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر بناء الملف");
    }
  }

  function startInterview() {
    setPendingProfile(null);
    setProfile(null);
    setMessages([]);
    setAiHistory([]);
    setError("");
    setStarted(true);
  }

  async function enterPlatform() {
    if (!user || navigating) return;

    setNavigating(true);
    setError("");

    try {
      const savedProfile =
        profile ?? pendingProfile ?? (await interview.getProfile(user.id));
      if (!savedProfile) {
        throw new Error("أكمل المقابلة أولًا لبناء ملفك.");
      }

      if (!completePlatformAccess(user.id, savedProfile)) {
        throw new Error("لم تُفتح المنصة. تأكد من السماح بالتخزين في المتصفح ثم حاول مرة أخرى.");
      }

      const stored = getUserById(user.id);
      if (!stored?.interviewCompleted) {
        throw new Error("تعذّر تأكيد فتح المنصة. حدّث الصفحة ثم حاول مرة أخرى.");
      }

      // Force a fresh session write so the next page load always finds the user logged in.
      createSessionForUser(stored);
      await refreshSession();

      const session = readSession();
      if (!session || session.user.id !== user.id || !session.user.interviewCompleted) {
        throw new Error("تعذّر حفظ جلسة الدخول. تأكد من السماح بالتخزين في المتصفح.");
      }

      // الحساب التجريبي: الملف من المقابلة + إنجازات جاهزة للعرض بعد الدخول
      if (isDemoAccountEmail(user.email)) {
        await enrichDemoAccountAfterInterview(user.id);
      }

      const specialtyId = savedProfile.answers.specialtyId;
      const destination =
        specialtyId && typeof specialtyId === "string"
          ? `${ROUTES.platformHome}?specialty=${encodeURIComponent(specialtyId)}`
          : ROUTES.platformHome;

      window.location.assign(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر فتح المنصة");
      setNavigating(false);
    }
  }

  if (isLoading) {
    return (
      <AuthShellLayout>
        <Container className="flex min-h-screen items-center justify-center py-24">
          <p className="text-foreground-muted">جاري التحميل…</p>
        </Container>
      </AuthShellLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AuthShellLayout>
        <Container className="flex min-h-screen items-center justify-center py-24">
          <Card padding="lg" className="max-w-md border-red-200 bg-red-50 text-center">
            <p className="text-sm font-semibold text-red-800">انتهت جلسة الدخول</p>
            <p className="mt-2 text-sm text-red-700">
              سجّل دخولك من جديد ثم أكمل المقابلة أو انتقل للموقع.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button href={ROUTES.login}>تسجيل الدخول</Button>
            </div>
          </Card>
        </Container>
      </AuthShellLayout>
    );
  }

  if (hydratedUserId !== user.id) {
    return (
      <AuthShellLayout>
        <Container className="flex min-h-screen items-center justify-center py-24">
          <p className="text-foreground-muted">جاري تحميل المقابلة…</p>
        </Container>
      </AuthShellLayout>
    );
  }

  const stepCount = messages.filter((m) => m.role === "user").length;
  const eyebrow = profile
    ? "تم الانتهاء — ملفك جاهز"
    : started
      ? `خطوات المقابلة — ${stepCount.toLocaleString("ar-SA")}/10`
      : "المقابلة الذكية";

  return (
    <InterviewShell
      eyebrow={eyebrow}
      title="المقابلة الذكية"
      description="خطوات منظمة مع نور — اختر إجاباتك، ووزّع ساعاتك على أيام الأسبوع، ثم راجع ملفك قبل الدخول للمنصة."
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-sage-50/50 px-4 py-3 sm:px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-500/15 text-sage-600">
            <IconSparkle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy-900">محادثة مع نور</p>
            <p className="text-xs text-foreground-muted">{eyebrow}</p>
          </div>
        </div>

        {!started && pendingProfile ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-6 text-center">
              <Card variant="tint" padding="md" className="max-w-md text-start">
                <ProfileSummary profile={pendingProfile} showPlan={false} />
              </Card>
              <p className="mt-5 max-w-sm text-sm text-foreground-secondary">
                لديك ملف محفوظ من مقابلة سابقة. انتقل للموقع أو ابدأ مقابلة جديدة.
              </p>
            </div>
            <div className="shrink-0 space-y-3 border-t border-border/60 p-3 sm:p-4">
              <Button size="lg" fullWidth onClick={() => void enterPlatform()} disabled={navigating}>
                {navigating ? "جاري فتح المنصة…" : "انتقل للموقع"}
              </Button>
              <Button size="lg" fullWidth variant="secondary" onClick={startInterview}>
                بدء مقابلة جديدة
              </Button>
            </div>
          </div>
        ) : !started ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500/15 text-sage-600">
                <IconSparkle size={24} />
              </span>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-foreground-secondary">
                مقابلة منظمة بخطوات واضحة — اختر هدفك، مجالك من تخصصات المنصة، مستواك، ساعاتك
                الأسبوعية، أيام الدراسة، ووقت البدء. نور تبني ملفك من إجاباتك الفعلية.
              </p>
            </div>
            <div className="shrink-0 border-t border-border/60 p-3 sm:p-4">
              <Button size="lg" fullWidth onClick={startInterview}>
                ابدأ المقابلة
              </Button>
            </div>
          </div>
        ) : !profile ? (
          <InterviewStructuredFlow
            scrollRef={scrollRef}
            userId={user.id}
            onMessagesChange={handleMessagesChange}
            onProfileBuilt={(built) => void handleProfileBuilt(built)}
            onError={setError}
          />
        ) : (
          <InterviewCompletionPanel
            profile={profile}
            navigating={navigating}
            onEnterPlatform={() => void enterPlatform()}
          />
        )}

        {error && (
          <p className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </InterviewShell>
  );
}
