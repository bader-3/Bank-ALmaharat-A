"use client";

import { InterviewStepPanel } from "@/components/interview/interview-step-panel";
import { buildLocalStructuredProfile } from "@/lib/interview/build-structured-profile";
import {
  BUDGET_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  LEARNING_PREFERENCE_OPTIONS,
  LEVEL_OPTIONS,
  WEEKLY_HOUR_OPTIONS,
  distributeWeeklyHours,
  formatDistributionMessage,
  getNextStep,
  getStepPrompt,
  getWelcomeMessage,
  type InterviewStepId,
  type StructuredInterviewDraft,
} from "@/lib/interview/steps";
import type { AiChatMessage } from "@/types/ai";
import type { InterviewConversationMessage, LearningProfile } from "@/types/interview";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type InterviewStructuredFlowProps = {
  scrollRef?: RefObject<HTMLDivElement | null>;
  onMessagesChange: (messages: InterviewConversationMessage[], aiHistory: AiChatMessage[]) => void;
  onProfileBuilt: (profile: LearningProfile) => void;
  onError: (message: string) => void;
  userId: string;
};

type EditableConfirmField = "learningTopic" | "currentLevel" | "weeklyHours";

export function InterviewStructuredFlow({
  scrollRef,
  onMessagesChange,
  onProfileBuilt,
  onError,
  userId,
}: InterviewStructuredFlowProps) {
  const [step, setStep] = useState<InterviewStepId>("goal");
  const [draft, setDraft] = useState<StructuredInterviewDraft>({});
  const [messages, setMessages] = useState<InterviewConversationMessage[]>([]);
  const [aiHistory, setAiHistory] = useState<AiChatMessage[]>([]);
  const [building, setBuilding] = useState(false);
  const [resumeConfirm, setResumeConfirm] = useState(false);
  const welcomeInitialized = useRef(false);
  const localScrollRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = scrollRef ?? localScrollRef;
  const onMessagesChangeRef = useRef(onMessagesChange);

  useEffect(() => {
    onMessagesChangeRef.current = onMessagesChange;
  }, [onMessagesChange]);

  const pushUserThenAi = useCallback((userText: string, aiText: string) => {
    const userMsg: InterviewConversationMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText,
    };
    const aiMsg: InterviewConversationMessage = {
      id: `ai-${Date.now() + 1}`,
      role: "ai",
      text: aiText,
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setAiHistory((prev) => [
      ...prev,
      { role: "user", text: userText },
      { role: "model", text: aiText },
    ]);
  }, []);

  useEffect(() => {
    if (welcomeInitialized.current) return;
    welcomeInitialized.current = true;

    const welcome = getWelcomeMessage();
    const goalQuestion = getStepPrompt("goal", {});
    const initialMessages: InterviewConversationMessage[] = [
      { id: "welcome", role: "ai", text: welcome },
      { id: "goal-q", role: "ai", text: goalQuestion },
    ];
    setMessages(initialMessages);
    setAiHistory([]);
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    onMessagesChangeRef.current(messages, aiHistory);
  }, [messages, aiHistory]);

  useEffect(() => {
    messagesScrollRef.current?.scrollTo({
      top: messagesScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, building, step, messagesScrollRef]);

  const goToConfirm = useCallback(
    (nextDraft: StructuredInterviewDraft, userLabel: string) => {
      pushUserThenAi(userLabel, getStepPrompt("confirm", nextDraft));
      setDraft(nextDraft);
      setStep("confirm");
      setResumeConfirm(false);
    },
    [pushUserThenAi],
  );

  const advance = useCallback(
    (nextDraft: StructuredInterviewDraft, userLabel: string, extraAi?: string) => {
      if (resumeConfirm) {
        if (step === "learningTopic") {
          pushUserThenAi(userLabel, getStepPrompt("learningFocus", nextDraft));
          setDraft(nextDraft);
          setStep("learningFocus");
          return;
        }

        goToConfirm(nextDraft, userLabel);
        return;
      }

      const nextStep = getNextStep(step);
      if (!nextStep) return;

      const aiPrompt = extraAi ?? getStepPrompt(nextStep, nextDraft);
      pushUserThenAi(userLabel, aiPrompt);
      setDraft(nextDraft);
      setStep(nextStep);
    },
    [goToConfirm, pushUserThenAi, resumeConfirm, step],
  );

  function labelFor<T extends { value: string | number; label: string }>(
    options: readonly T[],
    value: string | number,
  ) {
    return options.find((option) => option.value === value)?.label ?? String(value);
  }

  async function buildProfile(finalDraft: StructuredInterviewDraft) {
    setBuilding(true);
    onError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const profile = buildLocalStructuredProfile(userId, finalDraft, aiHistory);
      onProfileBuilt(profile);
    } catch (error) {
      onError(error instanceof Error ? error.message : "تعذّر بناء الملف");
    } finally {
      setBuilding(false);
    }
  }

  function handleConfirmSummary() {
    void buildProfile(draft);
  }

  function handleEditField(field: EditableConfirmField) {
    setResumeConfirm(true);
    setStep(field);
    const prompts: Record<EditableConfirmField, string> = {
      learningTopic: "عدّل مجال التعلّم — اختر من تخصصات المنصة.",
      currentLevel: "عدّل مستواك الحالي.",
      weeklyHours: "عدّل ساعاتك الأسبوعية.",
    };
    setMessages((prev) => [
      ...prev,
      { id: `edit-${field}-${Date.now()}`, role: "ai", text: prompts[field] },
    ]);
  }

  function handleRestartInterview() {
    welcomeInitialized.current = false;
    setResumeConfirm(false);
    setStep("goal");
    setDraft({});
    const welcome = getWelcomeMessage();
    const goalQuestion = getStepPrompt("goal", {});
    const initialMessages: InterviewConversationMessage[] = [
      { id: `welcome-${Date.now()}`, role: "ai", text: welcome },
      { id: `goal-q-${Date.now()}`, role: "ai", text: goalQuestion },
    ];
    setMessages(initialMessages);
    setAiHistory([]);
    welcomeInitialized.current = true;
  }

  const panelProps = {
    step,
    draft,
    onSelectGoal: (value: string) => advance({ ...draft, goal: value }, labelFor(GOAL_OPTIONS, value)),
    onSelectLearningTopic: (specialtyId: string, label: string) =>
      advance(
        {
          ...draft,
          specialtyId,
          learningTopic: label,
          learningFocus: undefined,
          learningFocusSlug: undefined,
        },
        label,
      ),
    onSelectLearningFocus: (slug: string | null, label: string | null) =>
      advance(
        {
          ...draft,
          learningFocus: label ?? undefined,
          learningFocusSlug: slug ?? undefined,
        },
        label ?? "اكتفيت بالمجال العام",
      ),
    onSelectLevel: (value: string) =>
      advance({ ...draft, currentLevel: value }, labelFor(LEVEL_OPTIONS, value)),
    onSelectExperience: (value: string) =>
      advance({ ...draft, priorExperience: value }, labelFor(EXPERIENCE_OPTIONS, value)),
    onSelectWeeklyHours: (hours: number) =>
      advance({ ...draft, weeklyHours: hours }, labelFor(WEEKLY_HOUR_OPTIONS, hours)),
    onSelectPreference: (value: StructuredInterviewDraft["learningPreference"]) =>
      advance(
        { ...draft, learningPreference: value },
        labelFor(LEARNING_PREFERENCE_OPTIONS, value ?? "both"),
      ),
    onSelectBudget: (value: string) =>
      advance({ ...draft, budgetOrHours: value }, labelFor(BUDGET_OPTIONS, value)),
    onConfirmDays: (days: string[]) => {
      const hoursPerDay = draft.weeklyHours
        ? distributeWeeklyHours(draft.weeklyHours, days.length)
        : 0;
      const nextDraft = { ...draft, availableDays: days, hoursPerDay };
      const distributionNote = draft.weeklyHours
        ? formatDistributionMessage(draft.weeklyHours, days, hoursPerDay)
        : days.join("، ");
      advance(
        nextDraft,
        days.join("، "),
        `${getStepPrompt("preferredTime", nextDraft)}\n\n${distributionNote}`,
      );
    },
    onConfirmTime: (hour: number, period: "صباحًا" | "مساءً") => {
      const nextDraft = {
        ...draft,
        preferredStudyHour: hour,
        preferredStudyPeriod: period,
      };
      const userLabel = `${hour.toLocaleString("ar-SA")}:٠٠ ${period}`;
      advance(nextDraft, userLabel);
    },
    onConfirmSummary: handleConfirmSummary,
    onEditField: handleEditField,
    onRestartInterview: handleRestartInterview,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={messagesScrollRef}
        className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-4 sm:p-5"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "ai" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                message.role === "ai"
                  ? "bg-sage-50/80 text-foreground dark:bg-surface-elevated dark:ring-1 dark:ring-border/50"
                  : "bg-navy-900 text-[#f2eee6] dark:bg-sage-600 dark:text-white"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {building && (
          <p className="text-center text-sm text-foreground-muted">جاري بناء ملفك التعليمي…</p>
        )}
      </div>

      {!building && (
        <div className="max-h-[min(18rem,45%)] shrink-0 overflow-y-auto overscroll-contain border-t border-border/60 bg-surface/95 p-3 sm:p-4">
          <InterviewStepPanel {...panelProps} />
        </div>
      )}
    </div>
  );
}
