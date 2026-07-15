import type { LearningProfile } from "@/types/interview";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/interview/labels";
import { Badge } from "@/components/ui/badge";
import { LearningPlanCard } from "@/components/ai/learning-plan-card";

interface ProfileSummaryProps {
  profile: LearningProfile;
  showPlan?: boolean;
}

export function ProfileSummary({ profile, showPlan = true }: ProfileSummaryProps) {
  const answers = profile.answers;
  const skills = profile.suggestedSkills ?? [];

  return (
    <div className="space-y-5">
      {profile.aiGenerated && (
        <Badge variant="gold">ملف مولّد بالذكاء الاصطناعي</Badge>
      )}

      {profile.summary && (
        <p className="type-body text-navy-700">{profile.summary}</p>
      )}

      {answers && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem label="الهدف" value={GOAL_LABELS[answers.goal] ?? answers.goal} />
          <SummaryItem
            label="المستوى"
            value={LEVEL_LABELS[answers.currentLevel] ?? answers.currentLevel}
          />
          <SummaryItem label="الساعات الأسبوعية" value={answers.weeklyHours} />
          <SummaryItem
            label="أسلوب التعلّم"
            value={preferenceLabel(answers.learningPreference)}
          />
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <p className="type-label text-sage-600">المهارات المقترحة</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="sage">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {profile.suggestedPath && (
        <div className="rounded-2xl border border-sage-200/60 bg-sage-50/50 px-4 py-3">
          <p className="type-label text-sage-600">مسارك الأولي</p>
          <p className="type-small mt-1 text-navy-700">{profile.suggestedPath}</p>
        </div>
      )}

      {showPlan && profile.learningPlan && (
        <LearningPlanCard plan={profile.learningPlan} compact />
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#ded2c4] bg-[#efe6da] px-4 py-3">
      <p className="type-label text-navy-400">{label}</p>
      <p className="type-small mt-1 text-navy-800">{value}</p>
    </div>
  );
}

function preferenceLabel(pref: string) {
  if (pref === "live") return "جلسات مباشرة";
  if (pref === "recorded") return "دورات مسجّلة";
  return "مزيج من الاثنين";
}
