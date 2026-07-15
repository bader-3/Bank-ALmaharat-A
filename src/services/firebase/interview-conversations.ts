import { firestore } from "@/lib/firebase/client";
import { withoutUndefined } from "@/services/firebase/common";
import type { InterviewConversation } from "@/types/interview";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export const INTERVIEW_CONVERSATIONS_COLLECTION = "interview_conversations";

function interviewConversationRef(userId: string) {
  return doc(firestore, INTERVIEW_CONVERSATIONS_COLLECTION, userId);
}

export async function getCloudInterviewConversation(
  userId: string,
): Promise<InterviewConversation | null> {
  const snapshot = await getDoc(interviewConversationRef(userId));
  if (!snapshot.exists()) return null;
  return (snapshot.data().conversation as InterviewConversation | undefined) ?? null;
}

export async function saveCloudInterviewConversation(conversation: InterviewConversation) {
  const clean = withoutUndefined(conversation);
  await setDoc(
    interviewConversationRef(conversation.userId),
    {
      userId: conversation.userId,
      conversation: clean,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return clean;
}
