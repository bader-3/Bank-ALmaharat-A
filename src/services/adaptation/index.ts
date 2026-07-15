import {
  buildProgressSummary,
  generateAdaptationSuggestions,
} from "@/lib/adaptation/adaptation-engine";
import { logFirestoreError } from "@/services/firebase/common";
import {
  saveCloudAdaptationState,
  type CloudAdaptationState,
} from "@/services/firebase/adaptation-state";
import { getGoalPlan, replaceGoalPlanGoals } from "@/services/goals/mock-goals-storage";
import { getEnrollmentsForUser } from "@/services/learning/mock-enrollment-storage";
import type {
  AdaptationState,
  PlanVersion,
  SuggestionDecision,
} from "@/types/adaptation";

const STORAGE_KEY = "asb-tracking-adaptation";

type StoredUserState = {
  decisions: Record<string, SuggestionDecision>;
  versions: PlanVersion[];
  activeVersionId?: string;
};

type Store = Record<string, StoredUserState>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  for (const [userId, state] of Object.entries(store)) {
    void saveCloudAdaptationState(userId, state as CloudAdaptationState).catch((error) => {
      logFirestoreError("adaptation_state", error);
    });
  }
}

function ensureUserState(userId: string): StoredUserState {
  const store = readStore();
  const current = store[userId];
  if (current) return current;
  const now = new Date().toISOString();
  const initial: PlanVersion = {
    id: `plan_version_${Date.now()}`,
    version: 1,
    userId,
    goals: getGoalPlan(userId).goals,
    createdAt: now,
    note: "نسخة الخطة قبل التكيّف",
  };
  const created = {
    decisions: {},
    versions: [initial],
    activeVersionId: initial.id,
  };
  store[userId] = created;
  writeStore(store);
  return created;
}

export interface AdaptationService {
  getState(userId: string): Promise<AdaptationState>;
  accept(userId: string, suggestionId: string): Promise<AdaptationState>;
  reject(userId: string, suggestionId: string): Promise<AdaptationState>;
  rollback(userId: string, versionId: string): Promise<AdaptationState>;
}

export class LocalAdaptationService implements AdaptationService {
  async getState(userId: string): Promise<AdaptationState> {
    const stored = ensureUserState(userId);
    const plan = getGoalPlan(userId);
    const enrollments = getEnrollmentsForUser(userId);
    return {
      summary: buildProgressSummary(plan, enrollments),
      suggestions: generateAdaptationSuggestions(plan, enrollments).map((suggestion) => ({
        ...suggestion,
        decision: stored.decisions[suggestion.id] ?? "pending",
      })),
      versions: stored.versions,
      activeVersionId: stored.activeVersionId,
    };
  }

  async accept(userId: string, suggestionId: string) {
    const current = await this.getState(userId);
    const suggestion = current.suggestions.find((item) => item.id === suggestionId);
    if (!suggestion) throw new Error("لم يعد الاقتراح صالحاً للحالة الحالية.");

    const store = readStore();
    const stored = ensureUserState(userId);
    const now = new Date().toISOString();
    const version: PlanVersion = {
      id: `plan_version_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      version: stored.versions.length + 1,
      userId,
      goals: suggestion.after.goals,
      createdAt: now,
      note: `قبول: ${suggestion.title}`,
      suggestionId,
    };
    replaceGoalPlanGoals(userId, suggestion.after.goals);
    store[userId] = {
      decisions: { ...stored.decisions, [suggestionId]: "accepted" },
      versions: [...stored.versions, version],
      activeVersionId: version.id,
    };
    writeStore(store);
    return this.getState(userId);
  }

  async reject(userId: string, suggestionId: string) {
    const store = readStore();
    const stored = ensureUserState(userId);
    store[userId] = {
      ...stored,
      decisions: { ...stored.decisions, [suggestionId]: "rejected" },
    };
    writeStore(store);
    return this.getState(userId);
  }

  async rollback(userId: string, versionId: string) {
    const store = readStore();
    const stored = ensureUserState(userId);
    const target = stored.versions.find((version) => version.id === versionId);
    if (!target) throw new Error("نسخة الخطة غير موجودة.");
    replaceGoalPlanGoals(userId, target.goals);
    const now = new Date().toISOString();
    const rollbackVersion: PlanVersion = {
      id: `plan_version_${Date.now()}_rollback`,
      version: stored.versions.length + 1,
      userId,
      goals: target.goals,
      createdAt: now,
      note: `رجوع إلى النسخة ${target.version}`,
    };
    store[userId] = {
      ...stored,
      versions: [...stored.versions, rollbackVersion],
      activeVersionId: rollbackVersion.id,
    };
    writeStore(store);
    return this.getState(userId);
  }
}

let instance: AdaptationService | null = null;

export function getAdaptationService(): AdaptationService {
  if (!instance) instance = new LocalAdaptationService();
  return instance;
}
