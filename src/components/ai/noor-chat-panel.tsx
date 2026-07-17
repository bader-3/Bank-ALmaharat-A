"use client";

import { NoorMessageCourseCard } from "@/components/ai/noor-message-course-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";
import type { NoorMessage } from "@/hooks/use-noor-assistant";
import Link from "next/link";
import type { ReactNode, RefObject } from "react";

interface NoorChatPanelProps {
  messages: NoorMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  suggestions: string[];
  isLoadingReply: boolean;
  loadingThinkingText?: string;
  error: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  interviewCompleted: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onActionClick?: () => void;
  className?: string;
  messagesClassName?: string;
  afterMessages?: ReactNode;
  interactionLocked?: boolean;
  onFeedback?: (messageId: string, feedback: "up" | "down") => void;
  onRetry?: () => void;
  canRetry?: boolean;
}

export function NoorChatPanel({
  messages,
  input,
  onInputChange,
  onSend,
  suggestions,
  isLoadingReply,
  loadingThinkingText = "يفكّر…",
  error,
  isLoading,
  isAuthenticated,
  interviewCompleted,
  scrollRef,
  onActionClick,
  className,
  messagesClassName,
  afterMessages,
  interactionLocked = false,
  onFeedback,
  onRetry,
  canRetry = false,
}: NoorChatPanelProps) {
  const lastAiId = [...messages].reverse().find((msg) => msg.role === "ai")?.id;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {!isLoading && !isAuthenticated && (
        <div className="border-b border-border/60 px-4 py-2.5">
          <Link
            href={ROUTES.register}
            className="text-sm font-medium text-sage-600 hover:underline"
            onClick={onActionClick}
          >
            سجّل مجانًا للبدء ←
          </Link>
        </div>
      )}

      {!isLoading && isAuthenticated && !interviewCompleted && (
        <div className="border-b border-border/60 px-4 py-2.5">
          <Link
            href={ROUTES.interview}
            className="text-sm font-medium text-sage-600 hover:underline"
            onClick={onActionClick}
          >
            أكمل المقابلة الذكية ←
          </Link>
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn("flex-1 space-y-2.5 overflow-y-auto p-4", messagesClassName)}
      >
        {messages.map((msg) => {
          const isWelcome = msg.id.startsWith("welcome");
          const isPendingAi =
            msg.role === "ai" && !msg.text && isLoadingReply && msg.id === lastAiId;
          const showFeedback =
            msg.role === "ai" &&
            Boolean(onFeedback) &&
            !isWelcome &&
            !isPendingAi &&
            Boolean(msg.text);

          return (
            <div
              key={msg.id}
              className={cn(
                "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                msg.role === "ai"
                  ? "bg-sage-50/80 text-foreground dark:bg-surface-elevated dark:ring-1 dark:ring-border/50"
                  : "ms-6 bg-navy-900 text-[#f2eee6] dark:bg-sage-600 dark:text-white",
              )}
            >
              {msg.text || (isPendingAi ? loadingThinkingText || "يفكّر…" : "")}
              {msg.role === "ai" &&
                msg.recommendedCourseSlugs?.map((slug) => (
                  <NoorMessageCourseCard key={slug} slug={slug} onNavigate={onActionClick} />
                ))}
              {msg.actionHref && msg.actionLabel && (
                <Link
                  href={msg.actionHref}
                  onClick={onActionClick}
                  className="mt-2 inline-flex rounded-full border border-sage-300/70 bg-surface px-3 py-1.5 font-medium text-sage-700 hover:bg-sage-100 dark:border-sage-700/50 dark:text-sage-300 dark:hover:bg-sage-900/30"
                >
                  {msg.actionLabel}
                </Link>
              )}
              {showFeedback && (
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="تقييم إيجابي"
                    onClick={() => onFeedback?.(msg.id, "up")}
                    className={cn(
                      "rounded-lg px-2 py-1 text-sm transition-colors",
                      msg.feedback === "up"
                        ? "bg-sage-500/20 text-sage-700"
                        : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
                    )}
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    aria-label="تقييم سلبي"
                    onClick={() => onFeedback?.(msg.id, "down")}
                    className={cn(
                      "rounded-lg px-2 py-1 text-sm transition-colors",
                      msg.feedback === "down"
                        ? "bg-red-500/15 text-red-600"
                        : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
                    )}
                  >
                    👎
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {afterMessages}
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
          <p className="text-sm text-red-600">{error}</p>
          {canRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoadingReply}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      )}

      <div className="border-t border-border/60 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={isLoadingReply || interactionLocked}
              onClick={() => void onSend(suggestion)}
              className="rounded-full border border-sage-200/60 bg-sage-50/50 px-2.5 py-1 text-sm text-sage-700 transition-colors hover:bg-sage-100/80 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !interactionLocked && void onSend(input)
            }
            placeholder={interactionLocked ? "أكمل الاختيار أعلاه…" : "اسأل نور…"}
            disabled={isLoadingReply || interactionLocked}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-sage-400/60"
          />
          <Button
            size="sm"
            disabled={!input.trim() || isLoadingReply || interactionLocked}
            onClick={() => void onSend(input)}
          >
            {isLoadingReply ? "…" : "إرسال"}
          </Button>
        </div>
      </div>
    </div>
  );
}
