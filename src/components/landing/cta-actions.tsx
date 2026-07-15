"use client";

import { Button } from "@/components/ui/button";
import { IconArrow } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { usePrimaryCta } from "@/hooks/use-primary-cta";
import { useAuth } from "@/providers/auth-provider";

export function CtaActions() {
  const cta = usePrimaryCta();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button href={cta.href} size="lg">
          {isAuthenticated ? cta.label : "إنشاء حساب"}
          <IconArrow className="transition-transform duration-300 group-hover/btn:-translate-x-0.5" />
        </Button>
        <Button href={ROUTES.courses} variant="secondary" size="lg">
          استكشف الدورات
        </Button>
      </div>

      <p className="mt-5 text-sm text-foreground-muted">
        {isAuthenticated
          ? "تابع رحلتك — استكشف، تعلّم، وتقدّم."
          : "الخطوة التالية: المقابلة الذكية وبناء ملفك التعليمي"}
      </p>
    </>
  );
}
