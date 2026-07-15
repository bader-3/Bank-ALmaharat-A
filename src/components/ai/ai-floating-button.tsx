"use client";

import dynamic from "next/dynamic";
import { IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NoorFloatingPanel = dynamic(
  () => import("@/components/ai/noor-floating-panel").then((m) => m.NoorFloatingPanel),
  { ssr: false, loading: () => null },
);

export function AiFloatingButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);

  if (
    pathname.startsWith("/interview") ||
    pathname.startsWith("/noor") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) {
    return null;
  }

  if (!armed) {
    return (
      <div className="fixed bottom-6 end-6 z-50">
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
        </button>
      </div>
    );
  }

  return <NoorFloatingPanel open={open} onOpenChange={setOpen} />;
}
