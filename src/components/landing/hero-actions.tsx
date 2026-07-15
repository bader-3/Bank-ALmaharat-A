"use client";

import { Button } from "@/components/ui/button";
import { IconArrow } from "@/components/ui/icons";
import { usePrimaryCta } from "@/hooks/use-primary-cta";

export function HeroActions() {
  const cta = usePrimaryCta();

  return (
    <div className="animate-reveal-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button href={cta.href} size="lg">
        {cta.label}
        <IconArrow className="transition-transform duration-300 group-hover/btn:-translate-x-0.5" />
      </Button>
      <Button href="#how-it-works" variant="secondary" size="lg">
        كيف يعمل
      </Button>
    </div>
  );
}
