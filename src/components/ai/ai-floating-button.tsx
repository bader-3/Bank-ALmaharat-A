"use client";

import dynamic from "next/dynamic";
import { IconClose, IconCompass, IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useNoorProactiveNudge } from "@/hooks/use-noor-proactive-nudge";
import { useOnboardingWelcome } from "@/hooks/use-onboarding-welcome";
import { usePageTourBubble } from "@/hooks/use-page-tour-bubble";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NoorFloatingPanel = dynamic(
  () => import("@/components/ai/noor-floating-panel").then((m) => m.NoorFloatingPanel),
  { ssr: false, loading: () => null },
);

const PAGE_TOUR_AUTO_DISMISS_MS = 8_000;

function isFloatingExcluded(pathname: string) {
  return (
    pathname.startsWith("/interview") ||
    pathname.startsWith("/noor") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  );
}

type BubbleKind = "welcome" | "tour" | "nudge";

type ActiveBubble = {
  kind: BubbleKind;
  text: string;
  href?: string;
  ctaLabel?: string;
  onDismiss: () => void;
  /** فتح لوحة نور بدل التنقل (لاقتراح /noor فقط) */
  openNoorOnCta?: boolean;
};

export function AiFloatingButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const { welcome, dismiss: dismissWelcome } = useOnboardingWelcome();
  const { tour, dismiss: dismissTour } = usePageTourBubble();
  const { nudge, dismiss: dismissNudge } = useNoorProactiveNudge();

  // أولوية: ترحيب بعد المقابلة → جولة الصفحة → اقتراح استباقي
  const activeBubble: ActiveBubble | null = welcome
    ? {
        kind: "welcome",
        text: welcome.text,
        href: welcome.href,
        ctaLabel: welcome.ctaLabel,
        onDismiss: dismissWelcome,
      }
    : tour
      ? {
          kind: "tour",
          text: tour.text,
          onDismiss: dismissTour,
        }
      : nudge
        ? {
            kind: "nudge",
            text: nudge.text,
            href: nudge.href,
            ctaLabel: nudge.ctaLabel,
            onDismiss: dismissNudge,
            openNoorOnCta: nudge.href === "/noor",
          }
        : null;

  useEffect(() => {
    if (activeBubble?.kind !== "tour" || open) return;
    const timer = window.setTimeout(() => {
      dismissTour();
    }, PAGE_TOUR_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [activeBubble?.kind, dismissTour, open, tour?.pageKey]);

  if (isFloatingExcluded(pathname)) {
    return null;
  }

  const showBubble = Boolean(activeBubble) && !open;
  const bubbleTone =
    activeBubble?.kind === "welcome"
      ? "border-gold-300/90 bg-gold-50/40 dark:border-gold-700/40"
      : activeBubble?.kind === "tour"
        ? "border-sage-300 bg-sage-50/50 dark:border-sage-600/50"
        : "border-sage-200/80 dark:border-sage-700/40";

  if (!armed) {
    return (
      <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-2">
        {showBubble && activeBubble && (
          <div
            role="status"
            className={cn(
              "max-w-[16.5rem] rounded-2xl border bg-surface p-3 shadow-float",
              "animate-[reveal_0.25s_ease-out_both]",
              bubbleTone,
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  activeBubble.kind === "welcome"
                    ? "bg-gold-500/20 text-gold-700"
                    : activeBubble.kind === "tour"
                      ? "bg-sage-500/20 text-sage-700"
                      : "bg-sage-500/15 text-sage-600",
                )}
              >
                {activeBubble.kind === "tour" ? (
                  <IconCompass size={14} />
                ) : (
                  <IconSparkle size={14} />
                )}
              </span>
              <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                {activeBubble.text}
              </p>
              <button
                type="button"
                onClick={activeBubble.onDismiss}
                className="shrink-0 rounded-lg p-1 text-foreground-muted hover:bg-background-muted hover:text-foreground"
                aria-label={
                  activeBubble.kind === "welcome"
                    ? "إغلاق الترحيب"
                    : activeBubble.kind === "tour"
                      ? "إغلاق الجولة"
                      : "إغلاق الاقتراح"
                }
              >
                <IconClose size={14} />
              </button>
            </div>
            {activeBubble.ctaLabel && activeBubble.href && (
              <div className="mt-2.5 flex items-center gap-2 ps-9">
                {activeBubble.openNoorOnCta ? (
                  <button
                    type="button"
                    onClick={() => {
                      activeBubble.onDismiss();
                      setArmed(true);
                      setOpen(true);
                    }}
                    className="rounded-full bg-navy-900 px-3 py-1 text-xs font-medium text-[#f2eee6] hover:bg-sage-600"
                  >
                    {activeBubble.ctaLabel}
                  </button>
                ) : (
                  <Link
                    href={activeBubble.href}
                    onClick={activeBubble.onDismiss}
                    className="rounded-full bg-navy-900 px-3 py-1 text-xs font-medium text-[#f2eee6] hover:bg-sage-600"
                  >
                    {activeBubble.ctaLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setArmed(true);
            setOpen(true);
          }}
          aria-label="فتح نور، المساعد الذكي"
          className={cn(
            "group relative flex h-14 w-14 items-center justify-center rounded-full",
            "bg-navy-900 text-[#f2eee6] shadow-float",
            "ring-4 ring-sage-500/15 transition-all duration-300",
            "hover:scale-105 hover:bg-sage-600 hover:ring-sage-500/25",
          )}
        >
          <span
            className="absolute inset-0 animate-ping rounded-full bg-sage-400/20 group-hover:hidden"
            aria-hidden="true"
          />
          <IconSparkle size={22} />
          {showBubble && (
            <span className="absolute -top-0.5 -start-0.5 h-3 w-3 rounded-full bg-gold-500 ring-2 ring-navy-900" />
          )}
        </button>
      </div>
    );
  }

  return <NoorFloatingPanel open={open} onOpenChange={setOpen} />;
}
