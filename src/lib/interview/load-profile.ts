import { syncUserDataFromCloud } from "@/services/firebase/sync-user-data";
import { getInterviewService } from "@/services/interview";

const CLOUD_SYNC_TIMEOUT_MS = 4_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.then((value) => value).catch(() => null),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

/** Loads the learning profile locally, then tries a bounded cloud sync if missing. */
export async function loadLearningProfile(userId: string) {
  const interview = getInterviewService();
  let profile = await interview.getProfile(userId);

  if (profile) return profile;

  await withTimeout(syncUserDataFromCloud(userId), CLOUD_SYNC_TIMEOUT_MS);
  profile = await interview.getProfile(userId);

  return profile;
}
