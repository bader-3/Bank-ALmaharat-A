"use client";

import { NoorChatPanel } from "@/components/ai/noor-chat-panel";
import { NoorAdaptationStatus } from "@/components/ai/noor-adaptation-status";
import { NoorChatExtras, getNoorChatInteractionLocked } from "@/components/ai/noor-chat-extras";
import { CourseSelectionStep } from "@/components/ai/course-selection-step";
import { PlanDraftEditor } from "@/components/ai/plan-draft-editor";
import { NoorWorkflowProgress } from "@/components/ai/noor-workflow-progress";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconPlus, IconSparkle } from "@/components/ui/icons";
import { SITE } from "@/lib/constants";
import { useNoorAssistant } from "@/hooks/use-noor-assistant";
import { useEffect, useRef } from "react";

const CAPABILITIES = [
  {
    title: "إرشاد المنصة",
    description: "شرح اقتصاد الساعات، الاستكشاف، المحفظة، والشهادة.",
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    title: "خطط تعلّم",
    description: "بناء خطة أسبوعية وتحويلها إلى أهداف يومية.",
    accent: "bg-sage-100 text-sage-700",
  },
  {
    title: "توصيات ذكية",
    description: "اقتراح مدربين ودورات حسب ملفك من المقابلة.",
    accent: "bg-gold-100 text-gold-700",
  },
] as const;

export function NoorScreen() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const assistant = useNoorAssistant();
  const interactionLocked = getNoorChatInteractionLocked(assistant.planningSession);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [assistant.messages, assistant.isLoadingReply]);

  return (
    <Container className="flex min-h-[calc(100vh-5rem)] flex-col py-10 lg:min-h-screen lg:py-14">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <IconSparkle size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">المساعد الذكي</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">نور</h1>
        <p className="mt-2 max-w-2xl text-pretty text-foreground-secondary">
          مرشدتك في {SITE.name} — اسأليها عن اقتصاد الساعات، الاستكشاف، اختيار المدرب،
          أو إعداد خطة تعلّم مخصّصة.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {CAPABILITIES.map((item) => (
          <Card key={item.title} padding="md" className="border-border/60">
            <span
              className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${item.accent}`}
            >
              {item.title}
            </span>
            <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
              {item.description}
            </p>
          </Card>
        ))}
      </div>

      <NoorWorkflowProgress session={assistant.planningSession} />

      {assistant.planningSession?.stage === "course_selection" && (
        <CourseSelectionStep
          session={assistant.planningSession}
          onToggleCourse={assistant.toggleCourseSelection}
          onToggleLesson={assistant.toggleLessonSelection}
          onMoveCourse={assistant.moveCourseSelection}
          onContinue={assistant.createDraftFromSelections}
        />
      )}

      {assistant.planningSession?.stage === "draft_approval" &&
        assistant.planningSession.status === "reviewing" && (
          <PlanDraftEditor
            session={assistant.planningSession}
            isAccepting={assistant.isAcceptingDraft}
            onAccept={() => void assistant.acceptDraft()}
            onReject={assistant.rejectDraft}
            onWeeklyHoursChange={assistant.changeDraftWeeklyHours}
            onDaysChange={assistant.changeDraftDays}
            onMoveCourse={assistant.moveDraftCourse}
            onReplaceCourse={assistant.replaceCourseInDraft}
            onToggleCourse={assistant.toggleDraftCourse}
            onToggleLesson={assistant.toggleDraftLesson}
            onMakeFaster={assistant.makeDraftFaster}
            onMakeLighter={assistant.makeDraftLighter}
            onRestoreVersion={assistant.restoreDraftVersion}
            onStartDiscovery={assistant.startCourseDiscovery}
          />
        )}

      {assistant.planningSession?.status === "accepted" && (
        <Card padding="md" className="mt-8 border-sage-200 bg-sage-50/40">
          <p className="font-semibold text-sage-700">تم اعتماد الخطة وإضافة أهدافها بنجاح.</p>
          <p className="mt-1 text-sm text-foreground-secondary">
            يمكنك متابعة المهام اليومية من صفحة أهدافي، أو طلب خطة جديدة من نور لاحقًا.
          </p>
        </Card>
      )}

      {assistant.user && <NoorAdaptationStatus userId={assistant.user.id} />}

      <Card
        padding="sm"
        className="mt-8 flex min-h-[32rem] flex-1 flex-col overflow-hidden border-border/60 !p-0 shadow-sm"
      >
        <div className="flex items-center gap-3 border-b border-border/60 bg-sage-50/50 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-500/15 text-sage-600">
            <IconSparkle size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-navy-900">محادثة مع نور</p>
            <p className="text-xs text-foreground-muted">متاحة للجميع — سجّل لحفظ خطتك وأهدافك</p>
          </div>
          <button
            type="button"
            onClick={assistant.startNewChat}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sage-300/70 bg-surface px-3 py-1.5 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-100"
          >
            <IconPlus size={16} />
            افتح دردشة جديدة
          </button>
        </div>

        <NoorChatPanel
          scrollRef={scrollRef}
          messages={assistant.messages}
          input={assistant.input}
          onInputChange={assistant.setInput}
          onSend={(text) => void assistant.sendQuestion(text)}
          suggestions={assistant.suggestions}
          isLoadingReply={assistant.isLoadingReply}
          error={assistant.error}
          isLoading={assistant.isLoading}
          isAuthenticated={assistant.isAuthenticated}
          interviewCompleted={assistant.interviewCompleted}
          messagesClassName="min-h-[20rem]"
          interactionLocked={interactionLocked}
          afterMessages={
            <NoorChatExtras
              planningSession={assistant.planningSession}
              onConfirmSpecialty={assistant.confirmPlanningSpecialty}
              onConfirmLevel={assistant.confirmPlanningLevel}
              onConfirmDays={assistant.confirmPlanningDays}
              onConfirmTime={assistant.confirmPlanningTime}
              onConfirmDelivery={assistant.confirmPlanningDelivery}
              onAcceptSuggestion={assistant.acceptPlanningSuggestion}
              onChooseDiscoveryMode={assistant.chooseDiscoveryMode}
              onChooseDiscoverySpecialty={assistant.chooseDiscoverySpecialty}
              onChooseDiscoveryLevel={assistant.chooseDiscoveryLevel}
              onChooseDiscoveryDelivery={assistant.chooseDiscoveryDelivery}
              onToggleDiscoveryCourse={assistant.toggleDiscoveryCourse}
              onBuildFromDiscovery={assistant.buildPlanFromDiscovery}
              onCancelDiscovery={assistant.cancelDiscovery}
            />
          }
        />
      </Card>
    </Container>
  );
}
