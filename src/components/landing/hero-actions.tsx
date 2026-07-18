"use client";

import { Button } from "@/components/ui/button";
import { IconArrow, IconSparkle } from "@/components/ui/icons";
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
    <div className="animate-reveal-delay-3 mt-9 flex w-fit max-w-full flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button href={cta.href} size="lg">
          {cta.label}
          <IconArrow className="transition-transform duration-300 group-hover/btn:-translate-x-0.5" />
        </Button>
        <Button href="#how-it-works" variant="secondary" size="lg">
          كيف يعمل
        </Button>
      </div>

      {!isAuthenticated && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          disabled={isDemoLoading}
          onClick={() => void handleDemoLogin()}
          className="border-sage-200/80 bg-sage-50/70 text-navy-900 hover:border-sage-300 hover:bg-sage-100/80"
          title="دخول فوري للعرض — بدون تسجيل"
        >
          <IconSparkle size={18} className="text-sage-400" />
          {isDemoLoading ? "جاري التجهيز…" : "جرّب كحساب تجريبي"}
        </Button>
      )}
    </div>
  );
}
