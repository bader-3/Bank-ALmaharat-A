import { firestore } from "@/lib/firebase/client";
import { withoutUndefined } from "@/services/firebase/common";
import type { PlanningSession } from "@/types/noor";
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export const LEARNING_PLANS_COLLECTION = "learning_plans";

function planRef(ownerId: string) {
  return doc(firestore, LEARNING_PLANS_COLLECTION, ownerId);
}

export async function getCloudLearningPlan(
  ownerId: string,
): Promise<PlanningSession | null> {
  const snapshot = await getDoc(planRef(ownerId));
  if (!snapshot.exists()) return null;
  return (snapshot.data().session as PlanningSession | undefined) ?? null;
}

export async function saveCloudLearningPlan(session: PlanningSession) {
  const cleanSession = withoutUndefined(session);

  await setDoc(
    planRef(session.ownerId),
    {
      ownerId: session.ownerId,
      status: session.status,
      stage: session.stage,
      session: cleanSession,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return cleanSession;
}

export function deleteCloudLearningPlan(ownerId: string) {
  return deleteDoc(planRef(ownerId));
}

export function subscribeToCloudLearningPlan(
  ownerId: string,
  listener: (session: PlanningSession | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    planRef(ownerId),
    (snapshot) => {
      listener(
        snapshot.exists()
          ? ((snapshot.data().session as PlanningSession | undefined) ?? null)
          : null,
      );
    },
    onError,
  );
}
