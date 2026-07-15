import { firestore } from "@/lib/firebase/client";
import { withoutUndefined } from "@/services/firebase/common";
import type { Enrollment } from "@/types/learning";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export const ENROLLMENTS_COLLECTION = "enrollments";

function enrollmentsRef(userId: string) {
  return doc(firestore, ENROLLMENTS_COLLECTION, userId);
}

export async function getCloudEnrollments(userId: string): Promise<Enrollment[]> {
  const snapshot = await getDoc(enrollmentsRef(userId));
  if (!snapshot.exists()) return [];
  const items = snapshot.data().items;
  return Array.isArray(items) ? (items as Enrollment[]) : [];
}

export async function saveCloudEnrollments(userId: string, items: Enrollment[]) {
  const clean = withoutUndefined(items);
  await setDoc(
    enrollmentsRef(userId),
    {
      userId,
      items: clean,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return clean;
}
