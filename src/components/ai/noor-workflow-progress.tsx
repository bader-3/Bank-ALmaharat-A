"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { getPlanningCompleteness } from "@/lib/ai/planning";
import type { PlanningSession } from "@/types/noor";

const STEPS = [
  { label: "بيانات الخطة", hint: "الهدف والوقت والتفضيلات" },
  { label: "اختيار الدورات", hint: "من فهرس المنصة" },
  { label: "مراجعة المسودة", hint: "تعديل قبل الاعتماد" },
  { label: "الاعتماد والمتابعة", hint: "تقدّم وتكيّف بموافقتك" },
] as const;

export function NoorWorkflowProgress({ session }: { session: PlanningSession | null }) {
  const completeness = getPlanningCompleteness(session?.preferences ?? { deliveryModes: [] });
  const currentStep = !session
    ? 0
    : session.status === "accepted"
      ? 3
      : session.stage === "draft_approval"
        ? 2
        : session.stage === "course_selection"
          ? 1
          : 0;

  return (
    <Card padding="md" className="mt-8 border-border/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-navy-900">رحلة بناء المسار مع نور</h2>
          <p className="mt-1 text-xs text-foreground-muted">
            كل مرحلة محفوظة في هذا المتصفح ويمكن استئنافها لاحقًا.
          </p>
        </div>
        <Badge variant={completeness.percent === 100 ? "sage" : "gold"}>
          اكتمال البيانات {completeness.percent}٪
        </Badge>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-background-muted">
        <div
          className="h-full rounded-full bg-sage-500 transition-all"
          style={{ width: `${completeness.percent}%` }}
        />
      </div>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step, index) => {
          const complete = index < currentStep || session?.status === "accepted";
          const active = index === currentStep && session?.status !== "accepted";
          return (
            <li
              key={step.label}
              className={cn(
                "rounded-xl border p-3",
                complete && "border-sage-200 bg-sage-50/50",
                active && "border-gold-300 bg-gold-50/40",
                !complete && !active && "border-border/60 bg-background-subtle/40",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    complete
                      ? "bg-sage-600 text-white"
                      : active
                        ? "bg-gold-500 text-navy-900"
                        : "bg-background-muted text-foreground-muted",
                  )}
                >
                  {complete ? "✓" : index + 1}
                </span>
                <p className="text-sm font-semibold text-navy-900">{step.label}</p>
              </div>
              <p className="mt-2 text-xs text-foreground-muted">{step.hint}</p>
            </li>
          );
        })}
      </ol>

      {session?.status === "cancelled" && (
        <p className="mt-4 text-sm text-foreground-secondary">
          المسودة السابقة غير معتمدة. اطلبي من نور إنشاء خطة جديدة للبدء مجددًا.
        </p>
      )}
    </Card>
  );
}
