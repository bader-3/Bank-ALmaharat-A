"use client";

import dynamic from "next/dynamic";
import { IconClose, IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { useNoorProactiveNudge } from "@/hooks/use-noor-proactive-nudge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NoorFloatingPanel = dynamic(
  () => import("@/components/ai/noor-floating-panel").then((m) => m.NoorFloatingPanel),
  { ssr: false, loading: () => null },
);

function isFloatingExcluded(pathname: string) {
  return (
    pathname.startsWith("/interview") ||
    pathname.startsWith("/noor") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  );
}

export function AiFloatingButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const { nudge, dismiss } = useNoorProactiveNudge();

  if (isFloatingExcluded(pathname)) {
    return null;
  }

  const showNudge = Boolean(nudge) && !open;

  if (!armed) {
    return (
      <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-2">
        {showNudge && nudge && (
          <div
            role="status"
            className={cn(
              "max-w-[16.5rem] rounded-2xl border border-sage-200/80 bg-surface p-3 shadow-float",
              "animate-[reveal_0.25s_ease-out_both] dark:border-sage-700/40",
            )}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-500/15 text-sage-600">
                <IconSparkle size={14} />
              </span>
              <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">{nudge.text}</p>
              <button
                type="button"
                onClick={dismiss}
                className="shrink-0 rounded-lg p-1 text-foreground-muted hover:bg-background-muted hover:text-foreground"
                aria-label="إغلاق الاقتراح"
              >
                <IconClose size={14} />
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2 ps-9">
              {nudge.href === "/noor" ? (
                <button
                  type="button"
                  onClick={() => {
                    dismiss();
                    setArmed(true);
                    setOpen(true);
                  }}
                  className="rounded-full bg-navy-900 px-3 py-1 text-xs font-medium text-[#f2eee6] hover:bg-sage-600"
                >
                  {nudge.ctaLabel}
                </button>
              ) : (
                <Link
                  href={nudge.href}
                  onClick={dismiss}
                  className="rounded-full bg-navy-900 px-3 py-1 text-xs font-medium text-[#f2eee6] hover:bg-sage-600"
                >
                  {nudge.ctaLabel}
                </Link>
              )}
            </div>
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
          {showNudge && (
            <span className="absolute -top-0.5 -start-0.5 h-3 w-3 rounded-full bg-gold-500 ring-2 ring-navy-900" />
          )}
        </button>
      </div>
    );
  }

  return <NoorFloatingPanel open={open} onOpenChange={setOpen} />;
}
