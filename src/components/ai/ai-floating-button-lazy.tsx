"use client";

import dynamic from "next/dynamic";

const AiFloatingButton = dynamic(
  () => import("@/components/ai/ai-floating-button").then((m) => m.AiFloatingButton),
  { ssr: false, loading: () => null },
);

export function AiFloatingButtonLazy() {
  return <AiFloatingButton />;
}
