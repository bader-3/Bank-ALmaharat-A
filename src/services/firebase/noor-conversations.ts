import { firestore } from "@/lib/firebase/client";
import { withoutUndefined } from "@/services/firebase/common";
import type { NoorConversation } from "@/types/noor";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export const NOOR_CONVERSATIONS_COLLECTION = "noor_conversations";

function conversationRef(ownerId: string) {
  return doc(firestore, NOOR_CONVERSATIONS_COLLECTION, ownerId);
}

export async function getCloudNoorConversation(
  ownerId: string,
): Promise<NoorConversation | null> {
  const snapshot = await getDoc(conversationRef(ownerId));
  if (!snapshot.exists()) return null;
  return (snapshot.data().conversation as NoorConversation | undefined) ?? null;
}

export async function saveCloudNoorConversation(conversation: NoorConversation) {
  const clean = withoutUndefined(conversation);
  await setDoc(
    conversationRef(conversation.ownerId),
    {
      ownerId: conversation.ownerId,
      conversation: clean,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return clean;
}

export function deleteCloudNoorConversation(ownerId: string) {
  return deleteDoc(conversationRef(ownerId));
}
