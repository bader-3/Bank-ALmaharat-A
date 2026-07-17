"use client";

import { NoorChatPanel } from "@/components/ai/noor-chat-panel";
import { NoorChatExtras, getNoorChatInteractionLocked } from "@/components/ai/noor-chat-extras";
import { Button } from "@/components/ui/button";
import { IconClose, IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { ROUTES, SITE } from "@/lib/constants";
import { useNoorAssistant } from "@/hooks/use-noor-assistant";
import { useEffect, useRef } from "react";

interface NoorFloatingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoorFloatingPanel({ open, onOpenChange }: NoorFloatingPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const assistant = useNoorAssistant();
  const interactionLocked = getNoorChatInteractionLocked(assistant.planningSession);
  const needsFullNoorPage =
    assistant.planningSession &&
    assistant.planningSession.status !== "cancelled" &&
    assistant.planningSession.status !== "accepted" &&
    (assistant.planningSession.stage === "course_selection" ||
      assistant.planningSession.stage === "draft_approval");

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [assistant.messages, open, assistant.isLoadingReply]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="إغلاق نور"
          className="fixed inset-0 z-40 bg-navy-900/20 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3">
        {open && (
          <div
            role="dialog"
            aria-label="نور، المساعد الذكي"
            className={cn(
              "flex w-[min(24rem,calc(100vw-3rem))] flex-col overflow-hidden rounded-md",
              "border border-border-subtle bg-surface surface-content shadow-float",
              "animate-[reveal_0.3s_cubic-bezier(0.22,1,0.36,1)_both]",
              "max-h-[min(32rem,70vh)]",
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-sage-50/50 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-sage-500/15 text-sage-600">
                  <IconSparkle size={16} />
                </span>
                <div>
                  <p className="type-card-title text-foreground">نور</p>
                  <p className="type-small text-foreground-muted">{SITE.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-background hover:text-foreground"
                aria-label="إغلاق"
              >
                <IconClose size={16} />
              </button>
            </div>

            {needsFullNoorPage && (
              <div className="border-b border-border-subtle bg-gold-50/40 px-4 py-3">
                <p className="text-sm font-semibold text-navy-900">الخطوة التالية في صفحة نور</p>
                <p className="mt-1 text-xs text-foreground-secondary">
                  اختيار الدورات ومراجعة المسودة يتمان في مساحة أوسع. المحادثة والتخطيط الأولي
                  متاحان هنا أيضًا.
                </p>
                <Button
                  href={ROUTES.noor}
                  size="sm"
                  fullWidth
                  className="mt-3"
                  onClick={() => onOpenChange(false)}
                >
                  فتح صفحة نور
                </Button>
              </div>
            )}

            <NoorChatPanel
              scrollRef={scrollRef}
              messages={assistant.messages}
              input={assistant.input}
              onInputChange={assistant.setInput}
              onSend={(text) => void assistant.sendQuestion(text)}
              suggestions={assistant.suggestions}
              isLoadingReply={assistant.isLoadingReply}
              loadingThinkingText={assistant.loadingThinkingText}
              error={assistant.error}
              isLoading={assistant.isLoading}
              isAuthenticated={assistant.isAuthenticated}
              interviewCompleted={assistant.interviewCompleted}
              onActionClick={() => onOpenChange(false)}
              interactionLocked={interactionLocked}
              onFeedback={assistant.setMessageFeedback}
              onRetry={assistant.retryLastFailed}
              canRetry={Boolean(assistant.lastFailedMessage)}
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
          </div>
        )}

        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-label={open ? "إغلاق نور" : "فتح نور، المساعد الذكي"}
          className={cn(
            "group relative flex h-14 w-14 items-center justify-center rounded-full",
            "bg-navy-900 text-[#f2eee6] shadow-float",
            "ring-4 ring-sage-500/15 transition-all duration-300",
            "hover:scale-105 hover:bg-sage-600 hover:ring-sage-500/25",
            open && "rotate-0 bg-sage-600",
          )}
        >
          <span
            className="absolute inset-0 animate-ping rounded-full bg-sage-400/20 group-hover:hidden"
            aria-hidden="true"
          />
          {open ? <IconClose size={22} /> : <IconSparkle size={22} />}
        </button>
      </div>
    </>
  );
}
