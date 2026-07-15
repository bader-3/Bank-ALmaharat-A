"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdaptationService } from "@/services/adaptation";
import type { AdaptationState } from "@/types/adaptation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function TrackingAdaptationPanel({ userId }: { userId: string }) {
  const service = useMemo(() => getAdaptationService(), []);
  const [state, setState] = useState<AdaptationState | null>(null);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setState(await service.getState(userId));
  }, [service, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function decide(id: string, decision: "accept" | "reject") {
    setWorkingId(id);
    setError("");
    try {
      setState(
        decision === "accept"
          ? await service.accept(userId, id)
          : await service.reject(userId, id),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذّر حفظ القرار.");
    } finally {
      setWorkingId("");
    }
  }

  async function rollback(versionId: string) {
    if (!window.confirm("هل تريد استعادة هذه النسخة من الخطة؟")) return;
    setWorkingId(versionId);
    try {
      setState(await service.rollback(userId, versionId));
    } finally {
      setWorkingId("");
    }
  }

  if (!state) {
    return <Card padding="md">جاري تحليل التقدّم…</Card>;
  }

  const { summary } = state;
  const pending = state.suggestions.filter((suggestion) => suggestion.decision === "pending");

  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-navy-900">تقدّمك وتكييف الخطة</h2>
          <Badge variant="sage">متابعة موحّدة</Badge>
        </div>
        <p className="mt-1 text-xs text-foreground-muted">{summary.measurementNote}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="الدروس" value={`${summary.lessons.completed}/${summary.lessons.planned}`} />
        <Metric label="الأهداف" value={`${summary.goals.completed}/${summary.goals.total}`} />
        <Metric
          label="الدقائق المخططة المنجزة"
          value={`${summary.minutes.completedPlanned}/${summary.minutes.planned}`}
        />
        <Metric label="الالتزام" value={`${summary.adherencePercent}٪`} />
      </div>

      <Card padding="md" className="border-border/70">
        <p className="font-semibold text-navy-900">الانحراف عن الخطة</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground-secondary">
          <span>متأخر: {summary.goals.overdue} أهداف</span>
          <span>دقائق متأخرة مخططة: {summary.delayedMinutes}</span>
          <span>تعثر محتمل: {summary.stalledCourses.length} دورة</span>
        </div>
      </Card>

      {pending.length ? (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-navy-900">توصيات نور</h3>
            <p className="mt-1 text-xs text-foreground-muted">
              اقتراحات تكيّف واضحة لا تُطبّق إلا بعد موافقتك.
            </p>
          </div>
          {pending.map((suggestion) => (
            <Card key={suggestion.id} padding="md" className="border-gold-200 bg-gold-50/30">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-2xl">
                  <p className="font-semibold text-navy-900">{suggestion.title}</p>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    السبب: {suggestion.reason}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">{suggestion.impact}</p>
                </div>
                <Badge variant="gold">بانتظار موافقتك</Badge>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <PlanPreview label="قبل" snapshot={suggestion.before} />
                <PlanPreview label="بعد" snapshot={suggestion.after} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={workingId === suggestion.id}
                  onClick={() => void decide(suggestion.id, "accept")}
                >
                  قبول وحفظ نسخة
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={workingId === suggestion.id}
                  onClick={() => void decide(suggestion.id, "reject")}
                >
                  رفض
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="md">
          <p className="text-sm text-foreground-secondary">
            لا توجد اقتراحات معلّقة الآن. لن يغيّر النظام الخطة دون موافقتك.
          </p>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card padding="md">
        <p className="font-semibold text-navy-900">نسخ الخطة</p>
        <ul className="mt-3 space-y-2">
          {[...state.versions].reverse().map((version) => (
            <li
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
            >
              <div>
                <p className="text-sm font-medium">النسخة {version.version} — {version.note}</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {new Date(version.createdAt).toLocaleString("ar-SA")}
                </p>
              </div>
              {state.activeVersionId === version.id ? (
                <Badge variant="sage">الحالية</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={workingId === version.id}
                  onClick={() => void rollback(version.id)}
                >
                  استعادة
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="mt-2 text-xl font-bold text-sage-700">{value}</p>
    </Card>
  );
}

function PlanPreview({
  label,
  snapshot,
}: {
  label: string;
  snapshot: AdaptationState["suggestions"][number]["before"];
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface p-3 text-xs">
      <p className="font-semibold text-navy-900">{label}</p>
      <p className="mt-2 text-foreground-secondary">
        {snapshot.goals.length} هدف · {snapshot.weeklyMinutes} دقيقة هذا الأسبوع ·{" "}
        {snapshot.overdueGoals} متأخر
      </p>
    </div>
  );
}
