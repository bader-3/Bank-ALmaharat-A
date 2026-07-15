"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { getAdaptationService } from "@/services/adaptation";
import type { AdaptationState } from "@/types/adaptation";
import { useEffect, useState } from "react";

export function NoorAdaptationStatus({ userId }: { userId: string }) {
  const [state, setState] = useState<AdaptationState | null>(null);

  useEffect(() => {
    void getAdaptationService().getState(userId).then(setState);
  }, [userId]);

  if (!state) return null;
  const pending = state.suggestions.filter((suggestion) => suggestion.decision === "pending");
  const first = pending[0];

  return (
    <Card padding="md" className="mt-8 border-sage-200 bg-sage-50/40">
      <p className="font-semibold text-sage-700">
        {first
          ? `نور لاحظت فرصة لتكييف خطتك: ${first.title}`
          : "نور راجعت تقدّمك، ولا توجد تعديلات معلّقة الآن."}
      </p>
      <p className="mt-1 text-sm text-foreground-secondary">
        أنجزت {state.summary.goals.completed} من {state.summary.goals.total} أهداف، ولديك{" "}
        {state.summary.goals.overdue} متأخرة. الدقائق المنجزة محسوبة من المدد المخططة المكتملة،
        وليست وقتاً فعلياً مقاساً.
      </p>
      {first && (
        <>
          <p className="mt-2 text-xs text-foreground-muted">السبب: {first.reason}</p>
          <Button href={ROUTES.account} size="sm" className="mt-4">
            مراجعة الاقتراح قبل تطبيقه
          </Button>
        </>
      )}
    </Card>
  );
}
