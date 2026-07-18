import { formatHoursAndMinutes } from "@/lib/format/duration";
import { getCloudAdaptationState } from "@/services/firebase/adaptation-state";
import { getCloudEnrollments } from "@/services/firebase/enrollments";
import { getCloudGoalPlan } from "@/services/firebase/learning-goals";
import { getCloudLearningPlan } from "@/services/firebase/learning-plans";
import { getCloudNoorConversation } from "@/services/firebase/noor-conversations";
import { getCloudUserProfile } from "@/services/firebase/user-profiles";
import { readLearningProfile } from "@/services/interview/mock-profile-storage";
import type { WalletStats } from "@/types/account";
import type { PlanVersion } from "@/types/adaptation";
import type { Enrollment } from "@/types/learning";
import type { LearningProfile } from "@/types/interview";
import type { GoalPlan } from "@/types/goals";
import type { NoorConversation, PlanningSession } from "@/types/noor";

export type NoorUserLearningContext = {
  userId: string;
  learningProfile?: LearningProfile;
  wallet?: WalletStats;
  planningSession?: PlanningSession | null;
  goalPlan?: GoalPlan;
  enrollments: Enrollment[];
  adaptationVersions: PlanVersion[];
  conversation?: NoorConversation | null;
};

export async function getNoorUserLearningContext(
  userId: string,
): Promise<NoorUserLearningContext> {
  const [profile, planningSession, goalPlan, enrollments, adaptation, conversation] =
    await Promise.all([
      getCloudUserProfile(userId),
      getCloudLearningPlan(userId),
      getCloudGoalPlan(userId),
      getCloudEnrollments(userId),
      getCloudAdaptationState(userId),
      getCloudNoorConversation(userId),
    ]);

  const localProfile = readLearningProfile(userId);

  return {
    userId,
    learningProfile: localProfile ?? profile?.learningProfile,
    wallet: profile?.wallet,
    planningSession,
    goalPlan: goalPlan ?? undefined,
    enrollments,
    adaptationVersions: adaptation?.versions ?? [],
    conversation,
  };
}

export function summarizeNoorUserContext(context: NoorUserLearningContext): string {
  const lines: string[] = [];

  if (context.learningProfile?.summary) {
    lines.push(`الملف التعليمي: ${context.learningProfile.summary}`);
  }

  if (context.learningProfile?.suggestedPath) {
    lines.push(`المسار المقترح: ${context.learningProfile.suggestedPath}`);
  }

  if (context.learningProfile?.courseRecommendations?.length) {
    const recs = context.learningProfile.courseRecommendations
      .slice(0, 4)
      .map((item) => `${item.slug} (${item.reason})`)
      .join("؛ ");
    lines.push(`توصيات المقابلة: ${recs}`);
  }

  if (context.wallet) {
    lines.push(
      `المحفظة: ${formatHoursAndMinutes(context.wallet.balance)} متبقية، ${formatHoursAndMinutes(context.wallet.totalUsed)} مستخدمة، ${formatHoursAndMinutes(context.wallet.totalPurchased)} مشتراة.`,
    );
  }

  if (context.planningSession?.draft) {
    const draft = context.planningSession.draft;
    lines.push(
      `مسودة خطة: «${draft.title}» — ${draft.totalWeeks} أسابيع، ${formatHoursAndMinutes(draft.totalHours)}، ${draft.courses.filter((c) => c.included).length} دورات.`,
    );
  }

  if (context.goalPlan?.acceptedAt) {
    const completed = context.goalPlan.goals.filter((goal) => goal.completedAt).length;
    lines.push(
      `الخطة المعتمدة: ${context.goalPlan.goals.length} هدف (${completed} مكتمل) — /goals و /path.`,
    );
  }

  if (context.enrollments.length) {
    const enrollmentSummary = context.enrollments
      .slice(0, 5)
      .map(
        (item) =>
          `${item.courseTitle} (${item.progress}%): ${item.purchasedLessons.length} مشتراة، ${item.completedLessons.length} مكتملة`,
      )
      .join("؛ ");
    lines.push(`التسجيلات: ${enrollmentSummary}`);
  }

  if (context.adaptationVersions.length > 1) {
    lines.push(`تعديلات الخطة: ${context.adaptationVersions.length - 1} نسخة — راجع /account.`);
  }

  return lines.join("\n");
}
