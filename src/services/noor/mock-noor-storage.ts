import { isBrowser } from "@/services/firebase/common";
import type { NoorConversation, NoorMessage, PlanningSession } from "@/types/noor";
import { getPlanningStage } from "@/lib/ai/planning";
import { rebuildPlanDraft } from "@/lib/ai/plan-draft";

const NOOR_STORAGE_KEY = "asb-noor";
export const NOOR_CHANGED_EVENT = "asb-noor-changed";

type NoorStore = {
  schemaVersion: 1;
  conversations: Record<string, NoorConversation>;
  planningSessions: Record<string, PlanningSession>;
};

function emptyStore(): NoorStore {
  return {
    schemaVersion: 1,
    conversations: {},
    planningSessions: {},
  };
}

function isMessage(value: unknown): value is NoorMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<NoorMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "ai") &&
    typeof message.text === "string" &&
    typeof message.createdAt === "string"
  );
}

function isConversation(value: unknown): value is NoorConversation {
  if (!value || typeof value !== "object") return false;
  const conversation = value as Partial<NoorConversation>;
  return (
    conversation.schemaVersion === 1 &&
    typeof conversation.ownerId === "string" &&
    typeof conversation.createdAt === "string" &&
    typeof conversation.updatedAt === "string" &&
    Array.isArray(conversation.messages) &&
    conversation.messages.every(isMessage)
  );
}

function normalizeDraft(value: PlanningSession["draft"], preferences: PlanningSession["preferences"]) {
  if (!value || !Array.isArray(value.courses)) return undefined;
  const hasCurrentSchedule = Array.isArray(value.schedule) && value.schedule.every(
    (item) =>
      typeof item.scheduledDate === "string" &&
      typeof item.startTime === "string" &&
      typeof item.durationMinutes === "number",
  );
  const draft = {
    ...value,
    preferredTimes: value.preferredTimes?.length
      ? value.preferredTimes
      : preferences.preferredTimes ?? ["مساءً"],
    durationWeeks: value.durationWeeks ?? preferences.durationWeeks ?? value.totalWeeks ?? 1,
    breakMinutes: value.breakMinutes ?? 15,
  };
  return hasCurrentSchedule ? draft : rebuildPlanDraft(draft);
}

function normalizePlanningSession(value: unknown): PlanningSession | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Partial<PlanningSession>;
  if (
    typeof session.id !== "string" ||
    typeof session.ownerId !== "string" ||
    !session.preferences ||
    typeof session.preferences !== "object" ||
    !Array.isArray(session.versions) ||
    typeof session.createdAt !== "string" ||
    typeof session.updatedAt !== "string"
  ) {
    return null;
  }

  const preferences = {
    ...session.preferences,
    deliveryModes: Array.isArray(session.preferences.deliveryModes)
      ? session.preferences.deliveryModes
      : [],
  };
  const courseSelections = Array.isArray(session.courseSelections)
    ? session.courseSelections.flatMap((selection) => {
        if (
          !selection ||
          typeof selection.courseSlug !== "string" ||
          !["suggested", "selected", "excluded"].includes(selection.status)
        ) {
          return [];
        }
        return [{
          ...selection,
          selectedLessonIds: Array.isArray(selection.selectedLessonIds)
            ? selection.selectedLessonIds.filter((id): id is string => typeof id === "string")
            : [],
          order: typeof selection.order === "number" ? selection.order : 0,
        }];
      })
    : [];
  const stage = getPlanningStage(preferences);
  const draft = normalizeDraft(session.draft, preferences);
  const versions = session.versions.map((version) => ({
    ...version,
    draft: normalizeDraft(version.draft, preferences) ?? version.draft,
  }));
  const allowedStatuses = [
    "collecting_preferences",
    "course_selection",
    "drafting",
    "reviewing",
    "accepted",
    "cancelled",
  ];
  const status =
    stage === "course_selection" && session.status === "collecting_preferences"
      ? "course_selection"
      : allowedStatuses.includes(session.status ?? "")
        ? session.status!
        : "collecting_preferences";

  return {
    ...session,
    status,
    stage: session.stage ?? stage,
    preferences,
    courseSelections,
    draft,
    versions,
  } as PlanningSession;
}

function readStore(): NoorStore {
  if (!isBrowser()) return emptyStore();

  try {
    const raw = window.localStorage.getItem(NOOR_STORAGE_KEY);
    if (!raw) return emptyStore();

    const parsed = JSON.parse(raw) as Partial<NoorStore>;
    if (parsed.schemaVersion !== 1) return emptyStore();

    const conversations = Object.fromEntries(
      Object.entries(parsed.conversations ?? {}).filter(([, value]) => isConversation(value)),
    );

    const planningSessions = Object.fromEntries(
      Object.entries(parsed.planningSessions ?? {}).flatMap(([ownerId, value]) => {
        const session = normalizePlanningSession(value);
        return session ? [[ownerId, session]] : [];
      }),
    );

    return {
      schemaVersion: 1,
      conversations,
      planningSessions,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: NoorStore, ownerId: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(NOOR_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(NOOR_CHANGED_EVENT, { detail: { ownerId } }));
}

export function readNoorConversation(ownerId: string): NoorConversation | null {
  return readStore().conversations[ownerId] ?? null;
}

export function writeNoorConversation(
  ownerId: string,
  messages: NoorMessage[],
): NoorConversation {
  const store = readStore();
  const current = store.conversations[ownerId];
  const now = new Date().toISOString();
  const conversation: NoorConversation = {
    schemaVersion: 1,
    ownerId,
    messages,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };

  store.conversations[ownerId] = conversation;
  writeStore(store, ownerId);
  return conversation;
}

export function deleteNoorConversation(ownerId: string) {
  const store = readStore();
  delete store.conversations[ownerId];
  writeStore(store, ownerId);
}

export function readPlanningSession(ownerId: string): PlanningSession | null {
  return readStore().planningSessions[ownerId] ?? null;
}

export function writePlanningSession(session: PlanningSession): PlanningSession {
  const store = readStore();
  store.planningSessions[session.ownerId] = session;
  writeStore(store, session.ownerId);
  return session;
}

export function deletePlanningSession(ownerId: string) {
  const store = readStore();
  delete store.planningSessions[ownerId];
  writeStore(store, ownerId);
}

/**
 * source "local" = a write in this same tab (custom event).
 * source "remote" = a write from another tab (native storage event).
 */
export function subscribeToNoorChanges(
  ownerId: string,
  listener: (source: "local" | "remote") => void,
) {
  if (!isBrowser()) return () => undefined;

  const handleCustomEvent = (event: Event) => {
    const changedOwnerId = (event as CustomEvent<{ ownerId?: string }>).detail?.ownerId;
    if (changedOwnerId === ownerId) listener("local");
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === NOOR_STORAGE_KEY) listener("remote");
  };

  window.addEventListener(NOOR_CHANGED_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(NOOR_CHANGED_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
