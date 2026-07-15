"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck, IconSparkle } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { getPackageById, formatPrice } from "@/lib/wallet/packages";
import { useAuth } from "@/providers/auth-provider";
import { getGoalsService, getLearningPlanKey } from "@/services/goals";
import type { LearningPlan } from "@/types/ai";
import { useEffect, useState } from "react";

interface LearningPlanCardProps {
  plan: LearningPlan;
  compact?: boolean;
}

export function LearningPlanCard({ plan, compact }: LearningPlanCardProps) {
  const { user } = useAuth();
  const pkg = getPackageById(plan.suggestedPackageId);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!user) return;
    void getGoalsService()
      .getPlan(user.id, false)
      .then((goalPlan) => {
        setIsAccepted(goalPlan.acceptedPlanKey === getLearningPlanKey(plan));
      });
  }, [user, plan]);

  async function handleAccept() {
    if (!user || isAccepting) return;
    setIsAccepting(true);
    await getGoalsService().acceptLearningPlan(user.id, plan);
    setIsAccepted(true);
    setIsAccepting(false);
  }

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
                <p className="type-small mt-1 text-foreground-secondary">{week.focus}</p>
              </li>
            );
          })}
        </ol>
      )}

      {pkg && (
        <div className="mt-4 rounded-sm border border-gold-200/60 bg-gold-50/45 px-4 py-3">
          <p className="type-label text-gold-700">الباقة المقترحة</p>
          <p className="type-card-title mt-1 text-foreground">
            {pkg.name} — {pkg.hours} س ({formatPrice(pkg.price)})
          </p>
          <p className="type-small mt-2 text-foreground-secondary">{plan.packageReason}</p>
          <Button href={ROUTES.wallet} size="sm" className="mt-3">
            شراء الباقة
          </Button>
        </div>
      )}

      {!compact && user && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {isAccepted ? (
            <>
              <Badge variant="sage">
                <IconCheck size={14} />
                تمت إضافة الخطة إلى أهدافك
              </Badge>
              <Button href={ROUTES.goals} size="sm">
                فتح أهدافي
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={handleAccept} disabled={isAccepting}>
              <IconSparkle size={16} />
              {isAccepting ? "جاري إعداد الأهداف…" : "اعتماد الخطة وإضافة الأهداف"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
