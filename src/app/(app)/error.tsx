"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ROUTES } from "@/lib/constants";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-xl font-bold text-navy-900">تعذّر تحميل الصفحة</h1>
      <p className="mt-3 max-w-md text-sm text-foreground-secondary">
        حدث خطأ أثناء عرض هذه الصفحة. جرّب إعادة التحميل أو العودة للصفحة الرئيسية.
      </p>
      {error.message && (
        <p className="mt-2 max-w-md text-xs text-foreground-muted">{error.message}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>إعادة المحاولة</Button>
        <Button href={ROUTES.account} variant="secondary">
          حسابي
        </Button>
      </div>
    </Container>
  );
}
