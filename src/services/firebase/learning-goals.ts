import { firestore } from "@/lib/firebase/client";
import { withoutUndefined } from "@/services/firebase/common";
import type { GoalPlan } from "@/types/goals";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export const LEARNING_GOALS_COLLECTION = "learning_goals";

function goalsRef(userId: string) {
  return doc(firestore, LEARNING_GOALS_COLLECTION, userId);
}

export async function getCloudGoalPlan(userId: string): Promise<GoalPlan | null> {
  const snapshot = await getDoc(goalsRef(userId));
  if (!snapshot.exists()) return null;
  return (snapshot.data().plan as GoalPlan | undefined) ?? null;
}

export async function saveCloudGoalPlan(userId: string, plan: GoalPlan) {
  const clean = withoutUndefined(plan);
  await setDoc(
    goalsRef(userId),
    {
      userId,
      plan: clean,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return clean;
}

export function deleteCloudGoalPlan(userId: string) {
  return deleteDoc(goalsRef(userId));
}
