import { logFirestoreError } from "@/services/firebase/common";
import { markInterviewCompleted } from "@/services/auth/mock-storage";
import { getCloudAdaptationState, saveCloudAdaptationState } from "@/services/firebase/adaptation-state";
import { getCloudEnrollments, saveCloudEnrollments } from "@/services/firebase/enrollments";
import { getCloudGoalPlan, saveCloudGoalPlan } from "@/services/firebase/learning-goals";
import { getCloudLearningPlan, saveCloudLearningPlan } from "@/services/firebase/learning-plans";
import {
  getCloudInterviewConversation,
  saveCloudInterviewConversation,
} from "@/services/firebase/interview-conversations";
import { getCloudNoorConversation, saveCloudNoorConversation } from "@/services/firebase/noor-conversations";
import {
  getCloudUserProfile,
  saveCloudLearningProfile,
  saveCloudWallet,
} from "@/services/firebase/user-profiles";
import { getGoalPlan } from "@/services/goals/mock-goals-storage";
import {
  readInterviewConversation,
  readLearningProfile,
  readProfilesStore,
  writeProfilesStore,
} from "@/services/interview/mock-profile-storage";
import {
  getEnrollmentsForUser,
  replaceUserEnrollments,
} from "@/services/learning/mock-enrollment-storage";
import {
  readNoorConversation,
  readPlanningSession,
  writeNoorConversation,
  writePlanningSession,
} from "@/services/noor/mock-noor-storage";
import { getWalletStats } from "@/services/wallet/mock-wallet-storage";

import type { PlanVersion, SuggestionDecision } from "@/types/adaptation";

const ADAPTATION_KEY = "asb-tracking-adaptation";

type AdaptationStore = Record<
  string,
  {
    decisions: Record<string, SuggestionDecision>;
    versions: PlanVersion[];
    activeVersionId?: string;
  }
>;

function readAdaptationStore(): AdaptationStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(ADAPTATION_KEY) ?? "{}") as AdaptationStore;
  } catch {
    return {};
  }
}

function writeAdaptationStore(store: AdaptationStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADAPTATION_KEY, JSON.stringify(store));
}

function readInterviewConversationsLocal() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("asb-interview-conversations");
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function writeInterviewConversationsLocal(store: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("asb-interview-conversations", JSON.stringify(store));
}

/**
 * Pulls cloud data into localStorage (cloud-first) and uploads any local-only
 * records that do not yet exist in Firestore.
 */
export async function syncUserDataFromCloud(userId: string) {
  if (typeof window === "undefined" || !userId || userId === "guest") return;

  try {
    const cloudProfile = await getCloudUserProfile(userId);
    const localProfile = readLearningProfile(userId);
    if (cloudProfile?.learningProfile) {
      const profiles = readProfilesStore();
      profiles[userId] = cloudProfile.learningProfile;
      writeProfilesStore(profiles);
      markInterviewCompleted(userId);
    } else if (localProfile) {
      await saveCloudLearningProfile(localProfile);
    }

    const localWallet = getWalletStats(userId);
    if (cloudProfile?.wallet) {
      const store = JSON.parse(window.localStorage.getItem("asb-wallet") ?? "{}") as Record<
        string,
        unknown
      >;
      store[userId] = cloudProfile.wallet;
      window.localStorage.setItem("asb-wallet", JSON.stringify(store));
      window.dispatchEvent(new CustomEvent("asb-wallet-changed"));
    } else if (localWallet.balance || localWallet.totalPurchased || localWallet.totalUsed) {
      await saveCloudWallet(userId, localWallet);
    }

    const cloudPlan = await getCloudLearningPlan(userId);
    const localPlan = readPlanningSession(userId);
    if (cloudPlan) writePlanningSession(cloudPlan);
    else if (localPlan) await saveCloudLearningPlan(localPlan);

    const cloudGoals = await getCloudGoalPlan(userId);
    const localGoals = getGoalPlan(userId);
    if (cloudGoals) {
      const store = JSON.parse(window.localStorage.getItem("asb-goals") ?? "{}") as Record<
        string,
        unknown
      >;
      store[userId] = cloudGoals;
      window.localStorage.setItem("asb-goals", JSON.stringify(store));
    } else if (localGoals.goals.length || localGoals.acceptedAt) {
      await saveCloudGoalPlan(userId, localGoals);
    }

    const cloudEnrollments = await getCloudEnrollments(userId);
    const localEnrollments = getEnrollmentsForUser(userId);
    if (cloudEnrollments.length) replaceUserEnrollments(userId, cloudEnrollments);
    else if (localEnrollments.length) await saveCloudEnrollments(userId, localEnrollments);

    const cloudAdaptation = await getCloudAdaptationState(userId);
    const localAdaptation = readAdaptationStore()[userId];
    if (cloudAdaptation) {
      const store = readAdaptationStore();
      store[userId] = cloudAdaptation;
      writeAdaptationStore(store);
    } else if (localAdaptation) {
      await saveCloudAdaptationState(userId, localAdaptation);
    }

    const cloudConversation = await getCloudNoorConversation(userId);
    const localConversation = readNoorConversation(userId);
    if (cloudConversation) writeNoorConversation(userId, cloudConversation.messages);
    else if (localConversation) await saveCloudNoorConversation(localConversation);

    const cloudInterview = await getCloudInterviewConversation(userId);
    const localInterview = readInterviewConversation(userId);
    if (cloudInterview) {
      const store = readInterviewConversationsLocal();
      store[userId] = cloudInterview;
      writeInterviewConversationsLocal(store);
    } else if (localInterview) {
      await saveCloudInterviewConversation(localInterview);
    }
  } catch (error) {
    logFirestoreError("syncUserDataFromCloud", error);
  }
}
