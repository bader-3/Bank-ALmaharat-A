import { firestore } from "@/lib/firebase/client";
import { withoutUndefined } from "@/services/firebase/common";
import type { PlanVersion, SuggestionDecision } from "@/types/adaptation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export const ADAPTATION_COLLECTION = "adaptation_state";

export type CloudAdaptationState = {
  decisions: Record<string, SuggestionDecision>;
  versions: PlanVersion[];
  activeVersionId?: string;
};

function adaptationRef(userId: string) {
  return doc(firestore, ADAPTATION_COLLECTION, userId);
}

export async function getCloudAdaptationState(
  userId: string,
): Promise<CloudAdaptationState | null> {
  const snapshot = await getDoc(adaptationRef(userId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    decisions: (data.decisions as CloudAdaptationState["decisions"]) ?? {},
    versions: (data.versions as PlanVersion[]) ?? [],
    activeVersionId: data.activeVersionId as string | undefined,
  };
}

export async function saveCloudAdaptationState(
  userId: string,
  state: CloudAdaptationState,
) {
  const clean = withoutUndefined(state);
  await setDoc(
    adaptationRef(userId),
    {
      userId,
      ...clean,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return clean;
}
