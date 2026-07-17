"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconArrow } from "@/components/ui/icons";
import { usePrimaryCta } from "@/hooks/use-primary-cta";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import { seedDemoAccount } from "@/services/demo/seed-demo-account";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroActions() {
  const cta = usePrimaryCta();
  const router = useRouter();
  const { refreshSession, isAuthenticated } = useAuth();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  async function handleDemoLogin() {
    setIsDemoLoading(true);
    try {
      seedDemoAccount();
      await refreshSession();
      router.push(ROUTES.platformHome);
    } catch {
      setIsDemoLoading(false);
    }
  }

  return (
    <div className="animate-reveal-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Button href={cta.href} size="lg">
        {cta.label}
        <IconArrow className="transition-transform duration-300 group-hover/btn:-translate-x-0.5" />
      </Button>
      <Button href="#how-it-works" variant="secondary" size="lg">
        كيف يعمل
      </Button>
      {!isAuthenticated && (
        <div className="flex flex-col gap-1.5 sm:ms-1">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            disabled={isDemoLoading}
            onClick={() => void handleDemoLogin()}
            className="border border-dashed border-gold-500/35 bg-gold-500/[0.05]"
          >
            {isDemoLoading ? "جاري التجهيز…" : "جرّب كحساب تجريبي"}
          </Button>
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
            <Badge variant="gold">تجريبي</Badge>
            دخول فوري للعرض — بدون تسجيل
          </span>
        </div>
      )}
    </div>
  );
}
