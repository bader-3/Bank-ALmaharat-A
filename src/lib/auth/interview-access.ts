import { getUserById, markInterviewCompleted } from "@/services/auth/mock-storage";
import {
  readLearningProfile,
  saveAiLearningProfile,
} from "@/services/interview/mock-profile-storage";
import type { LearningProfile } from "@/types/interview";
import type { User } from "@/types/auth";

export function hasSavedLearningProfile(userId: string): boolean {
  return Boolean(readLearningProfile(userId));
}

/**
 * Explicit unlock flag only — a saved profile is not enough.
 * Platform unlock happens when the user presses «انتقل للموقع».
 */
export function isInterviewCompleteForUser(user: Pick<User, "id" | "interviewCompleted">): boolean {
  if (user.interviewCompleted) return true;

  const stored = getUserById(user.id);
  return Boolean(stored?.interviewCompleted);
}

/** True when the user has not unlocked the platform yet. */
export function shouldRedirectToInterview(user: Pick<User, "id" | "interviewCompleted">): boolean {
  return !isInterviewCompleteForUser(user);
}

/** Whether the user may use gated app routes (flag must be set). */
export function resolveAppAccessForUser(userId: string): boolean {
  return isInterviewCompleteForUser({ id: userId, interviewCompleted: false });
}

/** Persist profile without unlocking the platform. */
export function ensureInterviewCompletion(userId: string, profile?: LearningProfile | null): boolean {
  if (profile) {
    saveAiLearningProfile(profile);
  }

  return Boolean(
    isInterviewCompleteForUser({ id: userId, interviewCompleted: false }) ||
      hasSavedLearningProfile(userId),
  );
}

/**
 * Finalize interview and unlock the full platform (all app routes).
 * Call only when the user presses «انتقل للموقع».
 */
export function completePlatformAccess(userId: string, profile: LearningProfile): boolean {
  saveAiLearningProfile(profile);

  if (!readLearningProfile(userId)) {
    return false;
  }

  markInterviewCompleted(userId);

  return resolveAppAccessForUser(userId);
}
