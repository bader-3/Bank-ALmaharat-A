"use client";

import { ProfileSummary } from "@/components/interview/profile-summary";
import { LearningPlanCard } from "@/components/ai/learning-plan-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck, IconSparkle } from "@/components/ui/icons";
import type { LearningProfile } from "@/types/interview";

type InterviewCompletionPanelProps = {
  profile: LearningProfile;
  navigating: boolean;
  onEnterPlatform: () => void;
};

export function InterviewCompletionPanel({
  profile,
  navigating,
  onEnterPlatform,
}: InterviewCompletionPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
        <Card padding="md" className="border-sage-300/70 bg-sage-50/70 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500/15 text-sage-600">
            <IconCheck size={28} />
          </span>
          <h2 className="mt-4 text-lg font-bold text-navy-900">
            تم الانتهاء من بناء ملفك التعريفي
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            نور جهّزت ملفك بناءً على إجاباتك. يمكنك الآن استكشاف الدورات، مسارك، المحفظة،
            الأهداف، ونور — المنصة كاملة بين يديك.
          </p>
        </Card>

        <Card variant="tint" padding="md">
          <div className="mb-3 flex items-center gap-2">
            <IconSparkle size={16} className="text-sage-600" />
            <p className="text-sm font-semibold text-navy-900">ملخص ملفك</p>
          </div>
          <ProfileSummary profile={profile} showPlan={false} />
        </Card>

        {profile.learningPlan ? <LearningPlanCard plan={profile.learningPlan} /> : null}
      </div>

      <div className="shrink-0 space-y-2 border-t border-border/60 bg-surface/95 p-3 sm:p-4">
        <Button size="lg" fullWidth disabled={navigating} onClick={onEnterPlatform}>
          {navigating ? "جاري فتح المنصة…" : "انتقل للموقع"}
        </Button>
        <p className="text-center text-xs text-foreground-muted">
          ستُفتح المنصة كاملة: الدورات، حسابك، مسارك، المحفظة، ونور.
        </p>
      </div>
    </div>
  );
}
