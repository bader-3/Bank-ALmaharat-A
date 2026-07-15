import type { InterviewConversation, LearningProfile } from "@/types/interview";
import { markInterviewCompleted } from "@/services/auth/mock-storage";
import { isBrowser, logFirestoreError } from "@/services/firebase/common";
import { saveCloudInterviewConversation } from "@/services/firebase/interview-conversations";
import { saveCloudLearningProfile } from "@/services/firebase/user-profiles";

const PROFILES_KEY = "asb-profiles";
const CONVERSATIONS_KEY = "asb-interview-conversations";

function readProfiles(): Record<string, LearningProfile> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LearningProfile>;
  } catch {
    return {};
  }
}

function writeProfiles(profiles: Record<string, LearningProfile>) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function readProfilesStore() {
  return readProfiles();
}

export function writeProfilesStore(profiles: Record<string, LearningProfile>) {
  writeProfiles(profiles);
}

export function saveAiLearningProfile(profile: LearningProfile): LearningProfile {
  return persistProfile({ ...profile, aiGenerated: true });
}

function persistProfile(profile: LearningProfile): LearningProfile {
  const profiles = readProfiles();
  profiles[profile.userId] = profile;
  writeProfiles(profiles);
  markInterviewCompleted(profile.userId);
  if (isBrowser()) {
    void saveCloudLearningProfile(profile).catch((error) => {
      console.error("[Firestore] تعذّر حفظ الملف التعليمي:", error);
    });
  }
  return profile;
}

export function readLearningProfile(userId: string): LearningProfile | null {
  return readProfiles()[userId] ?? null;
}

function readConversations(): Record<string, InterviewConversation> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, InterviewConversation>) : {};
  } catch {
    return {};
  }
}

export function readInterviewConversation(userId: string): InterviewConversation | null {
  return readConversations()[userId] ?? null;
}

export function saveInterviewConversation(
  conversation: Omit<InterviewConversation, "updatedAt">,
): InterviewConversation {
  const conversations = readConversations();
  const saved = { ...conversation, updatedAt: new Date().toISOString() };
  conversations[conversation.userId] = saved;
  if (isBrowser()) {
    window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    void saveCloudInterviewConversation(saved).catch((error) => {
      logFirestoreError("interview_conversations", error);
    });
  }
  return saved;
}
