import { isBrowser, logFirestoreError } from "@/services/firebase/common";
import { saveCloudGoalPlan } from "@/services/firebase/learning-goals";
import type { GoalInput, GoalPlan, LearningGoal } from "@/types/goals";

const GOALS_KEY = "asb-goals";
const GOALS_CHANGED_EVENT = "asb-goals-changed";

type GoalsStore = Record<string, GoalPlan>;

function emptyPlan(): GoalPlan {
  return { goals: [] };
}

function normalizeGoal(value: unknown): LearningGoal | null {
  if (!value || typeof value !== "object") return null;
  const goal = value as Partial<LearningGoal>;
  if (
    typeof goal.id !== "string" ||
    typeof goal.title !== "string" ||
    typeof goal.scheduledDate !== "string"
  ) {
    return null;
  }
  return {
    ...goal,
    durationMinutes:
      typeof goal.durationMinutes === "number" && goal.durationMinutes > 0
        ? goal.durationMinutes
        : 30,
    source: goal.source === "ai" ? "ai" : "personal",
    originalDate:
      typeof goal.originalDate === "string" ? goal.originalDate : goal.scheduledDate,
    startTime:
      typeof goal.startTime === "string" && /^\d{2}:\d{2}$/.test(goal.startTime)
        ? goal.startTime
        : "18:00",
    createdAt: typeof goal.createdAt === "string" ? goal.createdAt : new Date().toISOString(),
  } as LearningGoal;
}

function readStore(): GoalsStore {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(GOALS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<GoalPlan>>;
    return Object.fromEntries(
      Object.entries(parsed).map(([userId, plan]) => [
        userId,
        {
          acceptedPlanKey: plan.acceptedPlanKey,
          acceptedAt: plan.acceptedAt,
          goals: Array.isArray(plan.goals)
            ? plan.goals.flatMap((goal) => {
                const normalized = normalizeGoal(goal);
                return normalized ? [normalized] : [];
              })
            : [],
        },
      ]),
    );
  } catch {
    return {};
  }
}

function writeStore(store: GoalsStore) {
  if (!isBrowser()) return;
  window.localStorage.setItem(GOALS_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(GOALS_CHANGED_EVENT));
}

function savePlan(userId: string, plan: GoalPlan) {
  const store = readStore();
  store[userId] = plan;
  writeStore(store);
  if (isBrowser()) {
    void saveCloudGoalPlan(userId, plan).catch((error) => {
      logFirestoreError("learning_goals", error);
    });
  }
}

export function setGoalPlan(userId: string, plan: GoalPlan) {
  savePlan(userId, plan);
  return plan;
}

export function replaceGoalPlanGoals(userId: string, goals: LearningGoal[]): GoalPlan {
  const current = getGoalPlan(userId);
  const next = { ...current, goals };
  savePlan(userId, next);
  return next;
}

function makeId(prefix = "goal") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getGoalPlan(userId: string): GoalPlan {
  return readStore()[userId] ?? emptyPlan();
}

export function replaceWithAcceptedPlan(
  userId: string,
  acceptedPlanKey: string,
  acceptedAt: string,
  goals: LearningGoal[],
): GoalPlan {
  const current = getGoalPlan(userId);
  if (current.acceptedPlanKey === acceptedPlanKey) return current;

  const personalGoals = current.goals.filter((goal) => goal.source === "personal");
  const next = { acceptedPlanKey, acceptedAt, goals: [...goals, ...personalGoals] };
  savePlan(userId, next);
  return next;
}

export function upsertAiGoals(
  userId: string,
  acceptedPlanKey: string,
  acceptedAt: string,
  goals: LearningGoal[],
): GoalPlan {
  const current = getGoalPlan(userId);
  if (current.acceptedPlanKey === acceptedPlanKey) return current;

  const existingAi = new Map(
    current.goals
      .filter((goal) => goal.source === "ai")
      .map((goal) => [`${goal.courseSlug ?? ""}:${goal.lessonId ?? goal.id}`, goal]),
  );
  const nextAiGoals = goals.map((goal) => {
    const existing = existingAi.get(`${goal.courseSlug ?? ""}:${goal.lessonId ?? goal.id}`);
    return existing
      ? {
          ...goal,
          completedAt: existing.completedAt,
        }
      : goal;
  });
  const personalGoals = current.goals.filter((goal) => goal.source === "personal");
  const next = { acceptedPlanKey, acceptedAt, goals: [...nextAiGoals, ...personalGoals] };
  savePlan(userId, next);
  return next;
}

/** Remove AI/path goals when there are no purchased lessons — keep personal goals. */
export function clearAiGoals(userId: string): GoalPlan {
  const current = getGoalPlan(userId);
  const personalGoals = current.goals.filter((goal) => goal.source === "personal");
  const hadAi =
    current.goals.some((goal) => goal.source === "ai") || Boolean(current.acceptedPlanKey);
  if (!hadAi) return current;

  const next: GoalPlan = {
    goals: personalGoals,
    acceptedPlanKey: undefined,
    acceptedAt: undefined,
  };
  savePlan(userId, next);
  return next;
}

export function addPersonalGoal(userId: string, input: GoalInput): LearningGoal {
  const plan = getGoalPlan(userId);
  const now = new Date().toISOString();
  const goal: LearningGoal = {
    id: makeId("personal"),
    ...input,
    title: input.title.trim(),
    source: "personal",
    originalDate: input.scheduledDate,
    startTime: input.startTime,
    createdAt: now,
  };
  savePlan(userId, { ...plan, goals: [...plan.goals, goal] });
  return goal;
}

export function updateGoal(
  userId: string,
  goalId: string,
  input: GoalInput,
): LearningGoal | null {
  const plan = getGoalPlan(userId);
  let updated: LearningGoal | null = null;
  const goals = plan.goals.map((goal) => {
    if (goal.id !== goalId) return goal;
    updated = {
      ...goal,
      ...input,
      title: input.title.trim(),
      originalDate:
        goal.source === "personal" && goal.originalDate === goal.scheduledDate
          ? input.scheduledDate
          : goal.originalDate,
    };
    return updated;
  });
  if (updated) savePlan(userId, { ...plan, goals });
  return updated;
}

export function toggleGoalComplete(userId: string, goalId: string): LearningGoal | null {
  const plan = getGoalPlan(userId);
  let updated: LearningGoal | null = null;
  const goals = plan.goals.map((goal) => {
    if (goal.id !== goalId) return goal;
    updated = {
      ...goal,
      completedAt: goal.completedAt ? undefined : new Date().toISOString(),
    };
    return updated;
  });
  if (updated) savePlan(userId, { ...plan, goals });
  return updated;
}

export function completeGoalByLesson(
  userId: string,
  courseSlug: string,
  lessonId: string,
  completedAt = new Date().toISOString(),
): LearningGoal[] {
  const plan = getGoalPlan(userId);
  const matched: LearningGoal[] = [];
  let changed = false;
  const goals = plan.goals.map((goal) => {
    if (
      goal.courseSlug !== courseSlug ||
      goal.lessonId !== lessonId ||
      goal.completedAt
    ) {
      return goal;
    }
    changed = true;
    const completed = { ...goal, completedAt };
    matched.push(completed);
    return completed;
  });
  if (changed) savePlan(userId, { ...plan, goals });
  return matched;
}

export function deleteGoal(userId: string, goalId: string) {
  const plan = getGoalPlan(userId);
  savePlan(userId, { ...plan, goals: plan.goals.filter((goal) => goal.id !== goalId) });
}

export function carryOverdueGoals(userId: string, today: string): GoalPlan {
  const plan = getGoalPlan(userId);
  let changed = false;
  const goals = plan.goals.map((goal) => {
    if (!goal.completedAt && goal.scheduledDate < today) {
      changed = true;
      return { ...goal, scheduledDate: today };
    }
    return goal;
  });

  const next = changed ? { ...plan, goals } : plan;
  if (changed) savePlan(userId, next);
  return next;
}
