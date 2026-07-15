import { isBrowser } from "@/services/firebase/common";
import { reviewSessionKey } from "@/lib/ai/review-flow";
import type { LessonReviewSession } from "@/types/review";

const REVIEW_STORAGE_KEY = "asb-review-sessions";
export const REVIEW_CHANGED_EVENT = "asb-review-changed";

type ReviewStore = {
  schemaVersion: 1;
  sessions: Record<string, LessonReviewSession>;
};

function emptyStore(): ReviewStore {
  return { schemaVersion: 1, sessions: {} };
}

function readStore(): ReviewStore {
  if (!isBrowser()) return emptyStore();
  try {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as ReviewStore;
    if (parsed.schemaVersion !== 1 || !parsed.sessions) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ReviewStore) {
  if (!isBrowser()) return;
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(REVIEW_CHANGED_EVENT));
}

export function readReviewSession(
  userId: string,
  courseSlug: string,
  lessonId: string,
): LessonReviewSession | null {
  const key = reviewSessionKey(userId, courseSlug, lessonId);
  return readStore().sessions[key] ?? null;
}

export function writeReviewSession(session: LessonReviewSession) {
  const store = readStore();
  store.sessions[session.id] = session;
  writeStore(store);
}

export function listReviewSessions(userId: string): LessonReviewSession[] {
  return Object.values(readStore().sessions)
    .filter((session) => session.ownerId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function subscribeToReviewChanges(callback: () => void) {
  if (!isBrowser()) return () => undefined;
  window.addEventListener(REVIEW_CHANGED_EVENT, callback);
  return () => window.removeEventListener(REVIEW_CHANGED_EVENT, callback);
}
