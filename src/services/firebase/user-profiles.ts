import { firestore } from "@/lib/firebase/client";
import { withoutUndefined } from "@/services/firebase/common";
import type { WalletStats } from "@/types/account";
import type { LearningProfile } from "@/types/interview";
import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore";

export const USER_PROFILES_COLLECTION = "user_profiles";

export type CloudUserProfile = {
  userId: string;
  learningProfile?: LearningProfile;
  wallet?: WalletStats;
};

function profileRef(userId: string) {
  return doc(firestore, USER_PROFILES_COLLECTION, userId);
}

export async function getCloudUserProfile(
  userId: string,
): Promise<CloudUserProfile | null> {
  const snapshot = await getDoc(profileRef(userId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as DocumentData;
  return {
    userId,
    learningProfile: data.learningProfile as LearningProfile | undefined,
    wallet: data.wallet as WalletStats | undefined,
  };
}

async function mergeUserProfile(
  userId: string,
  fields: Partial<Omit<CloudUserProfile, "userId">> | Record<string, unknown>,
) {
  await setDoc(
    profileRef(userId),
    {
      userId,
      ...withoutUndefined(fields),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function saveCloudLearningProfile(profile: LearningProfile) {
  return mergeUserProfile(profile.userId, { learningProfile: profile });
}

export function saveCloudWallet(userId: string, wallet: WalletStats) {
  return mergeUserProfile(userId, { wallet });
}

/** يمسح الملف التعليمي من السحابة (لا يكفي الحذف المحلي بسبب المزامنة cloud-first). */
export async function clearCloudLearningProfile(userId: string) {
  await setDoc(
    profileRef(userId),
    {
      userId,
      learningProfile: deleteField(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
