"use client";

import { ROUTES, SITE } from "@/lib/constants";
import {
  createPlanningSession,
  extractPlanningAnswerFallback,
  extractionFromSuggestedPreferences,
  formatPlanningSuggestionLabel,
  getNextPlanningQuestion,
  getPlanningRepromptMessage,
  isPlanningInterviewActive,
  planningPreferencesFromProfile,
  updatePlanningSession,
  upgradePlanningQuestionnaire,
  type PlanPreferenceKey,
  type PlanningExtraction,
} from "@/lib/ai/planning";
import {
  createPlanDraft,
  draftToLearningPlan,
  rebuildPlanDraft,
  replaceDraftCourse,
} from "@/lib/ai/plan-draft";
import type { AssistantRecommendedCourse } from "@/lib/ai/prompts";
import { isCourseRecommendationQuestion } from "@/lib/ai/mock-fallback";
import { getAiRecommendedCourses } from "@/lib/courses/ai-recommendations";
import { getSpecialtyById } from "@/lib/courses/mock-data";
import { LEVEL_LABELS, DELIVERY_LABELS, type CourseLevel, type DeliveryMode } from "@/types/course";
import { formatLearningInterest } from "@/lib/interview/steps";
import {
  PROFILE_CHANGED_EVENT,
} from "@/lib/interview/update-learning-profile";
import { syncUserDataFromCloud } from "@/services/firebase/sync-user-data";
import {
  getNoorUserLearningContext,
  summarizeNoorUserContext,
} from "@/services/firebase/user-learning-context";
import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import { useAuth } from "@/providers/auth-provider";
import { streamAssistantReply } from "@/services/ai/client";
import { getGoalsService } from "@/services/goals";
import { getInterviewService } from "@/services/interview";
import { loadPlanningSessionLocalFirst } from "@/lib/noor/load-planning-session";
import { getNoorService } from "@/services/noor";
import { getWalletService } from "@/services/wallet";
import type { AiChatMessage } from "@/types/ai";
import type {
  CourseSelection,
  NoorMessage,
  PlanDiscovery,
  PlanDraft,
  PlanVersion,
  PlanningSession,
} from "@/types/noor";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type { NoorMessage } from "@/types/noor";

function normalizeArabic(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا");
}

function getPlanRequest(text: string) {
  const normalized = normalizeArabic(text);
  const mentionsPlan = /خط[ةهت]/.test(normalized);
  const requestWords = [
    "اعد",
    "جهز",
    "انشئ",
    "اعمل",
    "ابني",
    "سوي",
    "ضع لي",
    "اريد",
    "ابي",
    "ابغى",
    "ودي",
    "احتاج",
    "غير",
    "بدل",
    "جدد",
    "حدث",
  ];
  const asksForPlan =
    mentionsPlan &&
    (requestWords.some((word) => normalized.includes(word)) ||
      normalized.includes("خطة جديدة") ||
      normalized.includes("خطه جديده"));
  const replaceExisting =
    asksForPlan &&
    ["جديد", "غير", "بدل", "جدد", "حدث"].some((word) => normalized.includes(word));

  return { asksForPlan, replaceExisting };
}

function getSuggestions(isAuthenticated: boolean, interviewCompleted: boolean) {
  if (!isAuthenticated) {
    return ["ما هي المنصة؟", "كيف يعمل اقتصاد الساعات؟", "كيف أبدأ؟"];
  }
  if (!interviewCompleted) {
    return ["لماذا المقابلة الذكية؟", "ماذا بعد التسجيل؟", "ما هي الساعات؟"];
  }
  return ["وش تقدري تساعديني فيه؟", "ما الدورة المناسبة لي؟", "أعد لي خطة تعلّم"];
}

function buildWelcomeMessage(
  isAuthenticated: boolean,
  interviewCompleted: boolean,
  firstName?: string,
): string {
  if (!isAuthenticated) {
    return `أهلًا! أنا نور، مساعدتك الذكية في ${SITE.name}. اسألني عن المنصة أو كيف تبدأ.`;
  }
  if (!interviewCompleted) {
    return "أنا نور. أكمل المقابلة الذكية لبناء ملفك — أو اسألني عن أي شيء.";
  }
  return `مرحبًا ${firstName ?? ""}! أنا نور، كيف أساعدك في مسارك التعليمي؟`;
}

function createMessage(role: NoorMessage["role"], text: string, idPrefix: string): NoorMessage {
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function useNoorAssistant() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const noorService = useMemo(() => getNoorService(), []);
  const ownerId = user?.id ?? "guest";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<NoorMessage[]>([]);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [isAcceptingDraft, setIsAcceptingDraft] = useState(false);
  const [error, setError] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [planningSession, setPlanningSession] = useState<PlanningSession | null>(null);
  const [hydratedOwnerId, setHydratedOwnerId] = useState<string | null>(null);
  const skipNextSaveRef = useRef(false);
  const isLoadingReplyRef = useRef(false);
  const planningSessionRef = useRef<PlanningSession | null>(null);
  const userContextSummaryRef = useRef("");
  const recommendedCoursesRef = useRef<AssistantRecommendedCourse[]>([]);
  const learningTopicRef = useRef<string | undefined>(undefined);
  const specialtyIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    isLoadingReplyRef.current = isLoadingReply;
  }, [isLoadingReply]);

  useEffect(() => {
    planningSessionRef.current = planningSession;
  }, [planningSession]);

  useEffect(() => {
    if (!user?.id) {
      userContextSummaryRef.current = "";
      recommendedCoursesRef.current = [];
      learningTopicRef.current = undefined;
      specialtyIdRef.current = undefined;
      return;
    }

    let active = true;

    async function refreshProfileContext() {
      if (!user?.id) return;
      try {
        await syncUserDataFromCloud(user.id);
        const [cloudContext, localProfile] = await Promise.all([
          getNoorUserLearningContext(user.id),
          getInterviewService().getProfile(user.id),
        ]);
        if (!active) return;

        const profile = localProfile ?? cloudContext.learningProfile;
        const mergedContext = profile
          ? { ...cloudContext, learningProfile: profile }
          : cloudContext;
        userContextSummaryRef.current = summarizeNoorUserContext(mergedContext);

        const topic = profile
          ? formatLearningInterest({
              learningTopic: profile.answers?.learningTopic,
              learningFocus: profile.answers?.learningFocus,
            })
          : "—";
        learningTopicRef.current = topic !== "—" ? topic : profile?.answers?.learningTopic;
        specialtyIdRef.current = profile?.answers?.specialtyId;

        recommendedCoursesRef.current = getAiRecommendedCourses(profile ?? null, 3).map(
          ({ course, reason }) => ({
            slug: course.slug,
            title: course.title,
            reason: reason ?? `مناسبة لمستواك واهتمامك في ${course.specialtyId}`,
            specialty: getSpecialtyById(course.specialtyId)?.name,
            levelLabel: LEVEL_LABELS[course.level],
            hours: course.hours,
          }),
        );
      } catch {
        // ignore context load errors — assistant still works without profile
      }
    }

    void refreshProfileContext();

    const handleProfileChanged = (event: Event) => {
      const changedUserId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      if (changedUserId && changedUserId !== user.id) return;
      void refreshProfileContext();
    };

    window.addEventListener(PROFILE_CHANGED_EVENT, handleProfileChanged);
    return () => {
      active = false;
      window.removeEventListener(PROFILE_CHANGED_EVENT, handleProfileChanged);
    };
  }, [user?.id]);

  const interviewCompleted = user ? isInterviewCompleteForUser(user) : false;
  const suggestions = useMemo(
    () => getSuggestions(isAuthenticated, interviewCompleted),
    [isAuthenticated, interviewCompleted],
  );

  const resetConversation = useCallback(() => {
    const welcome = createMessage(
      "ai",
      buildWelcomeMessage(isAuthenticated, interviewCompleted, user?.fullName.split(" ")[0]),
      "welcome",
    );
    setMessages([welcome]);
    setInput("");
    setError("");
    void noorService.clearConversation(ownerId).catch(() => undefined);
  }, [interviewCompleted, isAuthenticated, noorService, ownerId, user?.fullName]);

  const startNewChat = useCallback(() => {
    setPlanningSession(null);
    planningSessionRef.current = null;
    void noorService.clearPlanningSession(ownerId).catch(() => undefined);
    resetConversation();
  }, [noorService, ownerId, resetConversation]);

  const appendAiMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, createMessage("ai", text, "a")]);
  }, []);

  const submitStructuredPlanningAnswer = useCallback(
    (answerText: string, extraction: PlanningExtraction) => {
      const current = planningSessionRef.current;
      if (!current || !isPlanningInterviewActive(current)) return;

      const next = updatePlanningSession(current, extraction);
      setPlanningSession(next);
      planningSessionRef.current = next;
      void noorService.savePlanningSession(next).catch(() => undefined);

      const nextQuestion = getNextPlanningQuestion(next.preferences);
      const reply =
        nextQuestion ??
        "اكتملت معلومات الخطة. اختر الآن الدورات المناسبة من القائمة أعلاه لبناء المسودة.";
      setMessages((previous) => [
        ...previous,
        createMessage("user", answerText, "u"),
        createMessage("ai", reply, "a"),
      ]);
    },
    [noorService],
  );

  const confirmPlanningDays = useCallback(
    (days: string[]) => {
      if (!days.length) return;
      submitStructuredPlanningAnswer(`الأيام المختارة: ${days.join("، ")}`, {
        availableDays: days,
      });
    },
    [submitStructuredPlanningAnswer],
  );

  const confirmPlanningTime = useCallback(
    (hour: number, period: "صباحًا" | "مساءً") => {
      if (!Number.isInteger(hour) || hour < 1 || hour > 12) return;
      const preferredTime = `${hour}:00 ${period}`;
      submitStructuredPlanningAnswer(`الوقت المفضّل: الساعة ${preferredTime}`, {
        preferredTimes: [preferredTime],
        // Delivery is intentionally confirmed after time in the structured
        // flow, including sessions created before this picker was added.
        deliveryModes: [],
      });
    },
    [submitStructuredPlanningAnswer],
  );

  const confirmPlanningDelivery = useCallback(
    (deliveryModes: DeliveryMode[]) => {
      if (!deliveryModes.length) return;
      const label =
        deliveryModes.includes("recorded") && deliveryModes.includes("live")
          ? "مسجّلة ومباشرة"
          : DELIVERY_LABELS[deliveryModes[0]];
      submitStructuredPlanningAnswer(`طريقة التقديم: ${label}`, { deliveryModes });
    },
    [submitStructuredPlanningAnswer],
  );

  const confirmPlanningSpecialty = useCallback(
    (specialtyId: string) => {
      const specialty = getSpecialtyById(specialtyId);
      if (!specialty) return;
      submitStructuredPlanningAnswer(`التخصص: ${specialty.name}`, {
        specialtyId,
        domain: specialty.name,
      });
    },
    [submitStructuredPlanningAnswer],
  );

  const confirmPlanningLevel = useCallback(
    (level: CourseLevel) => {
      submitStructuredPlanningAnswer(`المستوى: ${LEVEL_LABELS[level]}`, { currentLevel: level });
    },
    [submitStructuredPlanningAnswer],
  );

  const acceptPlanningSuggestion = useCallback(
    (key: PlanPreferenceKey) => {
      const current = planningSessionRef.current;
      if (!current?.suggestedPreferences) return;
      const extraction = extractionFromSuggestedPreferences(key, current.suggestedPreferences);
      if (!Object.keys(extraction).length) return;
      const label = formatPlanningSuggestionLabel(key, current.suggestedPreferences);
      submitStructuredPlanningAnswer(
        label ? `من ملف المقابلة: ${label}` : "اعتمدت الاقتراح من ملفي",
        extraction,
      );
    },
    [submitStructuredPlanningAnswer],
  );

  const commitDiscovery = useCallback(
    (discovery: PlanDiscovery | undefined) => {
      const base = planningSessionRef.current ?? planningSession;
      if (!base) return;
      const next: PlanningSession = {
        ...base,
        discovery,
        updatedAt: new Date().toISOString(),
      };
      setPlanningSession(next);
      planningSessionRef.current = next;
      void noorService.savePlanningSession(next).catch(() => undefined);
    },
    [noorService, planningSession],
  );

  const startCourseDiscovery = useCallback(() => {
    if (!(planningSessionRef.current ?? planningSession)) return;
    commitDiscovery({
      active: true,
      step: "mode",
      selectedSlugs: [],
      updatedAt: new Date().toISOString(),
    });
    appendAiMessage(
      "هل تريد تعديل دورات خطتك الحالية، أم تفضّل استكشاف دورات أخرى من الفهرس؟",
    );
  }, [appendAiMessage, commitDiscovery, planningSession]);

  const chooseDiscoveryMode = useCallback(
    (mode: "edit_current" | "new_courses") => {
      const session = planningSessionRef.current ?? planningSession;
      if (!session?.discovery) return;
      if (mode === "edit_current") {
        commitDiscovery({ ...session.discovery, active: false, mode, step: "done", updatedAt: new Date().toISOString() });
        appendAiMessage(
          "تمام — يمكنك تعديل دورات ودروس خطتك الحالية من محرر المسودة بالأسفل.",
        );
        return;
      }
      commitDiscovery({
        ...session.discovery,
        active: true,
        mode,
        step: "specialty",
        updatedAt: new Date().toISOString(),
      });
      appendAiMessage("ما التخصص الذي تريد استكشاف دوراته؟ اختر من القائمة.");
    },
    [appendAiMessage, commitDiscovery, planningSession],
  );

  const chooseDiscoverySpecialty = useCallback(
    (specialtyId: string) => {
      const session = planningSessionRef.current ?? planningSession;
      if (!session?.discovery) return;
      commitDiscovery({
        ...session.discovery,
        specialtyId,
        step: "level",
        updatedAt: new Date().toISOString(),
      });
      const specialty = getSpecialtyById(specialtyId);
      appendAiMessage(`اخترت «${specialty?.name ?? specialtyId}». ما المستوى المناسب لك؟`);
    },
    [appendAiMessage, commitDiscovery, planningSession],
  );

  const chooseDiscoveryLevel = useCallback(
    (level: CourseLevel) => {
      const session = planningSessionRef.current ?? planningSession;
      if (!session?.discovery) return;
      commitDiscovery({
        ...session.discovery,
        level,
        step: "delivery",
        updatedAt: new Date().toISOString(),
      });
      appendAiMessage(`المستوى: ${LEVEL_LABELS[level]}. وما طريقة التقديم المفضّلة؟`);
    },
    [appendAiMessage, commitDiscovery, planningSession],
  );

  const chooseDiscoveryDelivery = useCallback(
    (deliveryModes: DeliveryMode[]) => {
      const session = planningSessionRef.current ?? planningSession;
      if (!session?.discovery) return;
      commitDiscovery({
        ...session.discovery,
        deliveryModes,
        step: "results",
        selectedSlugs: [],
        updatedAt: new Date().toISOString(),
      });
      const labels = deliveryModes.map((mode) => DELIVERY_LABELS[mode]).join(" + ");
      appendAiMessage(
        `طريقة التقديم: ${labels}. هذه الدورات المطابقة من الفهرس — اختر ما يناسبك ثم اضغط «ابنِ الخطة».`,
      );
    },
    [appendAiMessage, commitDiscovery, planningSession],
  );

  const toggleDiscoveryCourse = useCallback(
    (courseSlug: string) => {
      const session = planningSessionRef.current ?? planningSession;
      if (!session?.discovery) return;
      const current = session.discovery.selectedSlugs;
      const selectedSlugs = current.includes(courseSlug)
        ? current.filter((slug) => slug !== courseSlug)
        : [...current, courseSlug];
      commitDiscovery({
        ...session.discovery,
        selectedSlugs,
        updatedAt: new Date().toISOString(),
      });
    },
    [commitDiscovery, planningSession],
  );

  const cancelDiscovery = useCallback(() => {
    const session = planningSessionRef.current ?? planningSession;
    if (!session?.discovery) return;
    commitDiscovery(undefined);
  }, [commitDiscovery, planningSession]);

  const buildPlanFromDiscovery = useCallback(() => {
    const session = planningSessionRef.current ?? planningSession;
    if (!session?.discovery?.selectedSlugs.length) return;
    const discovery = session.discovery;
    const now = new Date().toISOString();

    const selections: CourseSelection[] = discovery.selectedSlugs.map((courseSlug, index) => ({
      courseSlug,
      status: "selected",
      selectedLessonIds: [],
      order: index,
      reason: "اختيار من استكشاف نور",
      updatedAt: now,
    }));

    const specialty = discovery.specialtyId ? getSpecialtyById(discovery.specialtyId) : undefined;
    const preferences = {
      ...session.preferences,
      domain: specialty?.name ?? session.preferences.domain,
      currentLevel: discovery.level ?? session.preferences.currentLevel,
      deliveryModes: discovery.deliveryModes?.length
        ? discovery.deliveryModes
        : session.preferences.deliveryModes,
    };

    const draft = createPlanDraft(preferences, selections);
    const version: PlanVersion = {
      id: `version-${Date.now()}`,
      version: (session.versions.length ?? 0) + 1,
      draft,
      createdAt: now,
      note: "بناء الخطة من استكشاف الدورات",
      revision: "discovery",
    };

    const next: PlanningSession = {
      ...session,
      preferences,
      courseSelections: selections,
      status: "reviewing",
      stage: "draft_approval",
      draft,
      versions: [...session.versions, version],
      discovery: { ...discovery, active: false, step: "done", updatedAt: now },
      updatedAt: now,
    };
    setPlanningSession(next);
    planningSessionRef.current = next;
    void noorService.savePlanningSession(next).catch(() => undefined);
    appendAiMessage(
      "بنيت لك مسودة الخطة من اختياراتك. راجعها بالأسفل ثم اعتمدها. الأهداف اليومية في التقويم تُضاف بعد شراء دروس من الدورات المختارة — على أيام دراستك فقط.",
    );
  }, [appendAiMessage, noorService, planningSession]);

  useEffect(() => {
    if (isLoading) return;

    let active = true;

    const applyStoredConversation = async () => {
      const [conversation, storedSession] = await Promise.all([
        noorService.getConversation(ownerId),
        loadPlanningSessionLocalFirst(ownerId),
      ]);
      if (!active) return;
      const storedPlanningSession = storedSession
        ? upgradePlanningQuestionnaire(storedSession)
        : null;
      const questionnaireWasReset =
        Boolean(storedSession) && storedPlanningSession !== storedSession;
      if (questionnaireWasReset && storedPlanningSession) {
        await noorService.savePlanningSession(storedPlanningSession);
      }
      if (isLoadingReplyRef.current) {
        setPlanningSession(storedPlanningSession);
        return;
      }

      skipNextSaveRef.current = true;
      setMessages(
        questionnaireWasReset
          ? [
              createMessage(
                "ai",
                `أعدت ترتيب أسئلة الخطة حتى نراجعها كاملة بالتسلسل. ${getNextPlanningQuestion(storedPlanningSession!.preferences)}`,
                "planning-reset",
              ),
            ]
          : conversation?.messages.length
          ? conversation.messages
          : [
              createMessage(
                "ai",
                buildWelcomeMessage(
                  isAuthenticated,
                  interviewCompleted,
                  user?.fullName.split(" ")[0],
                ),
                "welcome",
              ),
            ],
      );
      setInput("");
      setError("");
      setPlanningSession(storedPlanningSession);
      planningSessionRef.current = storedPlanningSession;
      setHydratedOwnerId(ownerId);
    };

    void applyStoredConversation();

    const unsubscribe = noorService.subscribe(ownerId, (source) => {
      void Promise.all([
        noorService.getConversation(ownerId),
        loadPlanningSessionLocalFirst(ownerId),
      ]).then(([conversation, storedPlanningSession]) => {
        if (!active) return;
        const effectivePlanningSession = storedPlanningSession
          ? upgradePlanningQuestionnaire(storedPlanningSession)
          : null;
        if (
          storedPlanningSession &&
          effectivePlanningSession &&
          effectivePlanningSession !== storedPlanningSession
        ) {
          void noorService.savePlanningSession(effectivePlanningSession);
        }
        // Only overwrite messages from a genuinely remote (cross-tab) write.
        // Same-tab writes are already the source of truth in React state, so
        // reloading them here would clobber an in-flight reply.
        if (source === "remote" && conversation && !isLoadingReplyRef.current) {
          setMessages((current) => {
            if (JSON.stringify(current) === JSON.stringify(conversation.messages)) return current;
            skipNextSaveRef.current = true;
            return conversation.messages;
          });
        }
        setPlanningSession((current) => {
          if (JSON.stringify(current) === JSON.stringify(effectivePlanningSession)) return current;
          planningSessionRef.current = effectivePlanningSession;
          return effectivePlanningSession;
        });
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [
    interviewCompleted,
    isAuthenticated,
    isLoading,
    noorService,
    ownerId,
    user?.fullName,
  ]);

  useEffect(() => {
    if (hydratedOwnerId !== ownerId || messages.length === 0 || isLoadingReply) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    void noorService.saveConversation(ownerId, messages).catch(() => undefined);
  }, [hydratedOwnerId, isLoadingReply, messages, noorService, ownerId]);

  const sendQuestion = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || isLoadingReply) return;

      setError("");
      setLastFailedMessage(null);
      setInput("");

      const userMessage = createMessage("user", text, "u");
      const aiMessage = createMessage("ai", "", "a");
      const aiId = aiMessage.id;

      // Mark loading synchronously so the storage subscribe never reloads a
      // stale conversation over the in-flight messages (prevents the reply
      // from being wiped out).
      isLoadingReplyRef.current = true;
      setIsLoadingReply(true);
      setMessages((prev) => [...prev, userMessage, aiMessage]);

      const history: AiChatMessage[] = [
        ...messages
          .filter((m) => !m.id.startsWith("welcome"))
          .map((m) => ({
            role: m.role === "user" ? ("user" as const) : ("model" as const),
            text: m.text,
          })),
        { role: "user", text },
      ];

      try {
        const planRequest = getPlanRequest(text);
        const rawStoredPlanningSession = user
          ? await noorService.getPlanningSession(user.id)
          : null;
        const storedPlanningSession = rawStoredPlanningSession
          ? upgradePlanningQuestionnaire(rawStoredPlanningSession)
          : null;
        if (
          rawStoredPlanningSession &&
          storedPlanningSession &&
          storedPlanningSession !== rawStoredPlanningSession
        ) {
          await noorService.savePlanningSession(storedPlanningSession);
        }
        const activePlanningSession =
          planningSessionRef.current?.ownerId === user?.id &&
          isPlanningInterviewActive(planningSessionRef.current)
            ? planningSessionRef.current
            : storedPlanningSession;
        const continuingPlanning = isPlanningInterviewActive(activePlanningSession);

        if (planRequest.asksForPlan || continuingPlanning) {
          if (!user) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === aiId
                  ? {
                      ...message,
                      text: "يسعدني إعداد خطتك. سجّل أولًا، ثم سأبنيها حسب هدفك ووقتك المتاح.",
                      actionHref: ROUTES.register,
                      actionLabel: "إنشاء حساب",
                    }
                  : message,
              ),
            );
            return;
          }

          let planningSession =
            continuingPlanning && !planRequest.replaceExisting
              ? activePlanningSession!
              : createPlanningSession(user.id);

          const wallet = await getWalletService().getStats(user.id);

          if (!continuingPlanning || planRequest.replaceExisting) {
            const profile = await getInterviewService().getProfile(user.id);
            const suggestedPreferences = profile
              ? planningPreferencesFromProfile(profile)
              : undefined;
            planningSession = createPlanningSession(
              user.id,
              {
                walletBalanceHours: wallet.balance,
                deliveryModes: [],
              },
              suggestedPreferences,
            );
          } else {
            planningSession = {
              ...planningSession,
              preferences: {
                ...planningSession.preferences,
                walletBalanceHours: wallet.balance,
              },
            };
          }

          const startingPlan = !continuingPlanning || planRequest.replaceExisting;

          // Only treat the message as an answer when we're mid-interview.
          const extraction = startingPlan
            ? {}
            : extractPlanningAnswerFallback(text, planningSession.preferences);
          const extractedFields = Object.keys(extraction);

          planningSession = updatePlanningSession(planningSession, extraction);
          await noorService.savePlanningSession(planningSession);
          setPlanningSession(planningSession);
          planningSessionRef.current = planningSession;

          const nextQuestion = getNextPlanningQuestion(planningSession.preferences);
          const completedText =
            "اكتملت معلومات الخطة. اختر الآن الدورات المناسبة من القائمة أعلاه لبناء المسودة.";
          let replyText: string;
          if (startingPlan) {
            const historyHint = userContextSummaryRef.current
              ? `\n\nاطلعت على سجلّك السابق:\n${userContextSummaryRef.current}`
              : "";
            const interviewHint = planningSession.suggestedPreferences
              ? "\n\nلديك اقتراحات من ملف المقابلة — يمكنك اعتمادها من البطاقة أدناه أو كتابة إجابتك."
              : "";
            replyText = nextQuestion
              ? `لنبدأ إعداد خطتك.${historyHint}${interviewHint}\n\n${nextQuestion}`
              : completedText;
          } else if (extractedFields.length > 0) {
            replyText = nextQuestion ?? completedText;
          } else {
            replyText = getPlanningRepromptMessage(planningSession.preferences, text);
          }

          setMessages((prev) =>
            prev.map((message) =>
              message.id === aiId
                ? {
                    ...message,
                    text: replyText,
                  }
                : message,
            ),
          );
          return;
        }

        await streamAssistantReply({
          messages: history,
          context: {
            isAuthenticated,
            interviewCompleted,
            pathname,
            userContextSummary: userContextSummaryRef.current || undefined,
            recommendedCourses: recommendedCoursesRef.current.length
              ? recommendedCoursesRef.current
              : undefined,
            learningTopic: learningTopicRef.current,
            specialtyId: specialtyIdRef.current,
          },
          onChunk: (chunk) => {
            setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, text: chunk } : m)));
          },
        });

        if (isCourseRecommendationQuestion(text) && recommendedCoursesRef.current.length) {
          const slugs = recommendedCoursesRef.current.map((course) => course.slug);
          setMessages((prev) =>
            prev.map((message) =>
              message.id === aiId ? { ...message, recommendedCourseSlugs: slugs } : message,
            ),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذّر الرد — تحقق من الاتصال وحاول مرة أخرى");
        setLastFailedMessage(text);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === aiId
              ? {
                  ...message,
                  text: "تعذّر استلام الرد. يمكنك إعادة المحاولة من الزر أسفل المحادثة.",
                }
              : message,
          ),
        );
      } finally {
        isLoadingReplyRef.current = false;
        setIsLoadingReply(false);
      }
    },
    [
      interviewCompleted,
      isAuthenticated,
      isLoadingReply,
      messages,
      noorService,
      pathname,
      user,
    ],
  );

  const retryLastFailed = useCallback(() => {
    if (!lastFailedMessage || isLoadingReply) return;
    void sendQuestion(lastFailedMessage);
  }, [isLoadingReply, lastFailedMessage, sendQuestion]);

  const saveCourseSelections = useCallback(
    async (courseSelections: CourseSelection[]) => {
      if (!planningSession || planningSession.stage !== "course_selection") return;
      const nextSession: PlanningSession = {
        ...planningSession,
        courseSelections,
        updatedAt: new Date().toISOString(),
      };
      setPlanningSession(nextSession);
      await noorService.savePlanningSession(nextSession);
    },
    [noorService, planningSession],
  );

  const toggleCourseSelection = useCallback(
    (courseSlug: string, selected: boolean, reason: string) => {
      if (!planningSession) return;
      const now = new Date().toISOString();
      const current = planningSession.courseSelections.find(
        (selection) => selection.courseSlug === courseSlug,
      );
      const others = planningSession.courseSelections.filter(
        (selection) => selection.courseSlug !== courseSlug,
      );
      const selectedCount = others.filter((selection) => selection.status === "selected").length;
      const changed: CourseSelection = {
        courseSlug,
        status: selected ? "selected" : "suggested",
        reason,
        selectedLessonIds: selected ? (current?.selectedLessonIds ?? []) : [],
        order: selected ? (current?.order ?? selectedCount) : 0,
        updatedAt: now,
      };
      const next = [...others, changed];
      const reordered = next.map((selection) =>
        selection.status === "selected"
          ? {
              ...selection,
              order: next
                .filter((item) => item.status === "selected")
                .sort((a, b) => a.order - b.order)
                .findIndex((item) => item.courseSlug === selection.courseSlug),
            }
          : selection,
      );
      void saveCourseSelections(reordered);
    },
    [planningSession, saveCourseSelections],
  );

  const toggleLessonSelection = useCallback(
    (courseSlug: string, lessonId: string) => {
      if (!planningSession) return;
      const next = planningSession.courseSelections.map((selection) => {
        if (selection.courseSlug !== courseSlug || selection.status !== "selected") return selection;
        const included = selection.selectedLessonIds.includes(lessonId);
        return {
          ...selection,
          selectedLessonIds: included
            ? selection.selectedLessonIds.filter((id) => id !== lessonId)
            : [...selection.selectedLessonIds, lessonId],
          updatedAt: new Date().toISOString(),
        };
      });
      void saveCourseSelections(next);
    },
    [planningSession, saveCourseSelections],
  );

  const moveCourseSelection = useCallback(
    (courseSlug: string, direction: -1 | 1) => {
      if (!planningSession) return;
      const selected = planningSession.courseSelections
        .filter((selection) => selection.status === "selected")
        .sort((a, b) => a.order - b.order);
      const index = selected.findIndex((selection) => selection.courseSlug === courseSlug);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= selected.length) return;
      [selected[index], selected[targetIndex]] = [selected[targetIndex], selected[index]];
      const orderBySlug = new Map(
        selected.map((selection, order) => [selection.courseSlug, order]),
      );
      void saveCourseSelections(
        planningSession.courseSelections.map((selection) => ({
          ...selection,
          order: orderBySlug.get(selection.courseSlug) ?? selection.order,
          updatedAt:
            orderBySlug.has(selection.courseSlug) ? new Date().toISOString() : selection.updatedAt,
        })),
      );
    },
    [planningSession, saveCourseSelections],
  );

  const persistPlanningSession = useCallback(
    async (nextSession: PlanningSession) => {
      setPlanningSession(nextSession);
      await noorService.savePlanningSession(nextSession);
    },
    [noorService],
  );

  const createDraftFromSelections = useCallback(() => {
    if (!planningSession || planningSession.stage !== "course_selection") return;
    const selected = planningSession.courseSelections.filter(
      (selection) => selection.status === "selected",
    );
    if (!selected.length) return;
    const draft = createPlanDraft(planningSession.preferences, selected);
    const version: PlanVersion = {
      id: `version-${Date.now()}`,
      version: 1,
      draft,
      createdAt: new Date().toISOString(),
      note: "إنشاء المسودة من الاختيارات",
      revision: "initial",
    };
    void persistPlanningSession({
      ...planningSession,
      status: "reviewing",
      stage: "draft_approval",
      draft,
      versions: [version],
      updatedAt: version.createdAt,
    });
  }, [persistPlanningSession, planningSession]);

  const reviseDraft = useCallback(
    (nextDraft: PlanDraft, note: string) => {
      if (!planningSession?.draft || planningSession.status !== "reviewing") return;
      const createdAt = new Date().toISOString();
      const draft = { ...nextDraft, updatedAt: createdAt };
      const version: PlanVersion = {
        id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        version: planningSession.versions.length + 1,
        draft,
        createdAt,
        note,
        revision: note,
      };
      void persistPlanningSession({
        ...planningSession,
        draft,
        versions: [...planningSession.versions, version],
        updatedAt: createdAt,
      });
    },
    [persistPlanningSession, planningSession],
  );

  const changeDraftWeeklyHours = useCallback(
    (hours: number) => {
      if (!planningSession?.draft || !Number.isFinite(hours) || hours < 0.5) return;
      reviseDraft(
        rebuildPlanDraft({ ...planningSession.draft, weeklyHours: Math.min(40, hours) }),
        "تعديل الساعات الأسبوعية",
      );
    },
    [planningSession, reviseDraft],
  );

  const changeDraftDays = useCallback(
    (days: string[]) => {
      if (!planningSession?.draft || !days.length) return;
      reviseDraft(
        rebuildPlanDraft({ ...planningSession.draft, availableDays: days }),
        "تغيير أيام الجدول",
      );
    },
    [planningSession, reviseDraft],
  );

  const moveDraftCourse = useCallback(
    (courseSlug: string, direction: -1 | 1) => {
      if (!planningSession?.draft) return;
      const courses = planningSession.draft.courses.map((course) => ({
        ...course,
        lessons: course.lessons.map((lesson) => ({ ...lesson })),
      }));
      const active = courses.filter((course) => course.included).sort((a, b) => a.order - b.order);
      const index = active.findIndex((course) => course.courseSlug === courseSlug);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= active.length) return;
      const currentOrder = active[index].order;
      active[index].order = active[targetIndex].order;
      active[targetIndex].order = currentOrder;
      reviseDraft(rebuildPlanDraft({ ...planningSession.draft, courses }), "إعادة ترتيب الدورات");
    },
    [planningSession, reviseDraft],
  );

  const toggleDraftCourse = useCallback(
    (courseSlug: string) => {
      if (!planningSession?.draft) return;
      const courses = planningSession.draft.courses.map((course) =>
        course.courseSlug === courseSlug ? { ...course, included: !course.included } : course,
      );
      reviseDraft(
        rebuildPlanDraft({ ...planningSession.draft, courses }),
        courses.find((course) => course.courseSlug === courseSlug)?.included
          ? "إعادة دورة"
          : "إزالة دورة",
      );
    },
    [planningSession, reviseDraft],
  );

  const toggleDraftLesson = useCallback(
    (courseSlug: string, lessonId: string) => {
      if (!planningSession?.draft) return;
      const courses = planningSession.draft.courses.map((course) =>
        course.courseSlug === courseSlug
          ? {
              ...course,
              lessons: course.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, included: !lesson.included } : lesson,
              ),
            }
          : course,
      );
      const included = courses
        .find((course) => course.courseSlug === courseSlug)
        ?.lessons.find((lesson) => lesson.id === lessonId)?.included;
      reviseDraft(
        rebuildPlanDraft({ ...planningSession.draft, courses }),
        included ? "إعادة درس" : "حذف درس",
      );
    },
    [planningSession, reviseDraft],
  );

  const replaceCourseInDraft = useCallback(
    (oldCourseSlug: string, newCourseSlug: string) => {
      if (!planningSession?.draft) return;
      const selection: CourseSelection = {
        courseSlug: newCourseSlug,
        status: "selected",
        selectedLessonIds: [],
        order:
          planningSession.draft.courses.find((course) => course.courseSlug === oldCourseSlug)
            ?.order ?? 0,
        updatedAt: new Date().toISOString(),
      };
      reviseDraft(
        replaceDraftCourse(planningSession.draft, oldCourseSlug, selection),
        "استبدال دورة",
      );
    },
    [planningSession, reviseDraft],
  );

  const makeDraftFaster = useCallback(() => {
    if (!planningSession?.draft) return;
    reviseDraft(
      rebuildPlanDraft({
        ...planningSession.draft,
        weeklyHours: Math.min(40, Math.round(planningSession.draft.weeklyHours * 1.25 * 2) / 2),
      }),
      "جعل الخطة أسرع",
    );
  }, [planningSession, reviseDraft]);

  const makeDraftLighter = useCallback(() => {
    if (!planningSession?.draft) return;
    reviseDraft(
      rebuildPlanDraft({
        ...planningSession.draft,
        weeklyHours: Math.max(0.5, Math.round(planningSession.draft.weeklyHours * 0.75 * 2) / 2),
      }),
      "جعل الخطة أخف أسبوعيًا",
    );
  }, [planningSession, reviseDraft]);

  const restoreDraftVersion = useCallback(
    (version: PlanVersion) => {
      reviseDraft(
        JSON.parse(JSON.stringify(version.draft)) as PlanDraft,
        `الرجوع إلى النسخة ${version.version}`,
      );
    },
    [reviseDraft],
  );

  const rejectDraft = useCallback(() => {
    if (!planningSession?.draft) return;
    void persistPlanningSession({
      ...planningSession,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });
  }, [persistPlanningSession, planningSession]);

  const acceptDraft = useCallback(async () => {
    if (!user || !planningSession?.draft || isAcceptingDraft) return;
    setIsAcceptingDraft(true);
    setError("");
    try {
      const goalsService = getGoalsService();
      const existingPlan = await goalsService.getPlan(user.id, false);
      const replaceExisting = Boolean(existingPlan.acceptedPlanKey);
      if (
        replaceExisting &&
        !window.confirm(
          "لديك خطة معتمدة حاليًا. هل تريد استبدالها بهذه المسودة وإنشاء أهداف جديدة؟",
        )
      ) {
        return;
      }
      const learningPlan = draftToLearningPlan(planningSession.draft);
      await goalsService.acceptPlanDraft(user.id, planningSession.draft, replaceExisting);

      const profileService = getInterviewService();
      const profile = await profileService.getProfile(user.id);
      if (profile) {
        await profileService.saveProfile({ ...profile, learningPlan }).catch(() => undefined);
      }

      const acceptedAt = new Date().toISOString();
      await persistPlanningSession({
        ...planningSession,
        status: "accepted",
        draft: { ...planningSession.draft, updatedAt: acceptedAt },
        acceptedAt,
        updatedAt: acceptedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر اعتماد الخطة");
    } finally {
      setIsAcceptingDraft(false);
    }
  }, [isAcceptingDraft, persistPlanningSession, planningSession, user]);

  const setMessageFeedback = useCallback(
    (messageId: string, feedback: "up" | "down") => {
      setMessages((prev) => {
        const next = prev.map((message) =>
          message.id === messageId
            ? { ...message, feedback: message.feedback === feedback ? null : feedback }
            : message,
        );
        if (ownerId !== "guest") {
          void noorService.saveConversation(ownerId, next).catch(() => undefined);
        }
        return next;
      });
    },
    [noorService, ownerId],
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    interviewCompleted,
    input,
    setInput,
    messages,
    isLoadingReply,
    isAcceptingDraft,
    error,
    planningSession,
    suggestions,
    sendQuestion,
    setMessageFeedback,
    resetConversation,
    startNewChat,
    confirmPlanningDays,
    confirmPlanningTime,
    confirmPlanningDelivery,
    confirmPlanningSpecialty,
    confirmPlanningLevel,
    acceptPlanningSuggestion,
    startCourseDiscovery,
    chooseDiscoveryMode,
    chooseDiscoverySpecialty,
    chooseDiscoveryLevel,
    chooseDiscoveryDelivery,
    toggleDiscoveryCourse,
    buildPlanFromDiscovery,
    cancelDiscovery,
    toggleCourseSelection,
    toggleLessonSelection,
    moveCourseSelection,
    createDraftFromSelections,
    changeDraftWeeklyHours,
    changeDraftDays,
    moveDraftCourse,
    replaceCourseInDraft,
    toggleDraftCourse,
    toggleDraftLesson,
    makeDraftFaster,
    makeDraftLighter,
    restoreDraftVersion,
    rejectDraft,
    acceptDraft,
  };
}
