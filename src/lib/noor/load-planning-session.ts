import { withTimeout } from "@/lib/async/with-timeout";
import { getNoorService } from "@/services/noor";
import { readPlanningSession } from "@/services/noor/mock-noor-storage";
import type { PlanningSession } from "@/types/noor";

export async function loadPlanningSessionLocalFirst(
  userId: string,
  remoteTimeoutMs = 4_000,
): Promise<PlanningSession | null> {
  const local = readPlanningSession(userId);
  if (local) return local;

  try {
    return await withTimeout(
      getNoorService().getPlanningSession(userId),
      remoteTimeoutMs,
      "مزامنة الخطة",
    );
  } catch {
    return null;
  }
}
