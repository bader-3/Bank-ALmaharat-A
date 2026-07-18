"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconSparkle } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { getPackageById, formatPrice } from "@/lib/wallet/packages";
import type { LearningPlan } from "@/types/ai";

interface LearningPlanCardProps {
  plan: LearningPlan;
  compact?: boolean;
}

export function LearningPlanCard({ plan, compact }: LearningPlanCardProps) {
  const pkg = getPackageById(plan.suggestedPackageId);

  return (
    <Card padding="md" className="border-sage-200/50 bg-sage-50/30">
      <div className="flex items-center gap-2">
        <IconSparkle size={18} className="text-sage-600" />
        <p className="type-label text-sage-600">خطة التعلّم الذكية</p>
        <Badge variant="gold">AI</Badge>
      </div>

      <p className="type-body mt-3 text-foreground">
        {plan.totalWeeks} أسابيع — {plan.totalHours} ساعة إجمالية
      </p>

      {!compact && (
        <ol className="mt-4 space-y-3">
          {plan.weeks.map((week) => {
            const course = getCourseBySlug(week.courseSlug);
            return (
              <li
                key={week.week}
                className="rounded-sm border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="type-label text-foreground-muted">الأسبوع {week.week}</span>
                  <Badge variant="neutral">{week.hours} س</Badge>
                </div>
                <p className="type-card-title mt-1 text-foreground">
                  {course?.title ?? week.title}
                </p>
                <p className="type-small mt-2 text-foreground-secondary">{week.focus}</p>
              </li>
            );
          })}
        </ol>
      )}

      <p className="type-small mt-4 text-foreground-secondary">
        الأهداف اليومية في التقويم تُنشأ بعد شراء دروس من الدورات المقترحة — وفق أيام دراستك في الملف.
      </p>

      {pkg && (
        <div className="mt-4 rounded-sm border border-gold-200/60 bg-gold-50/45 px-4 py-3">
          <p className="type-label text-gold-700">الباقة المقترحة</p>
          <p className="type-card-title mt-1 text-foreground">
            {pkg.name} — {pkg.hours} س ({formatPrice(pkg.price)})
          </p>
          <p className="type-small mt-2 text-foreground-secondary">{plan.packageReason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button href={ROUTES.wallet} size="sm">
              شراء الباقة
            </Button>
            <Button href={ROUTES.courses} size="sm" variant="secondary">
              استكشف الدورات
            </Button>
          </div>
        </div>
      )}

      {!compact && !pkg && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href={ROUTES.courses} size="sm">
            استكشف الدورات
          </Button>
          <Button href={ROUTES.wallet} size="sm" variant="secondary">
            شحن المحفظة
          </Button>
        </div>
      )}
    </Card>
  );
}
