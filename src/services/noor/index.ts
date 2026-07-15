import {
  deleteNoorConversation,
  deletePlanningSession,
  readNoorConversation,
  readPlanningSession,
  subscribeToNoorChanges,
  writeNoorConversation,
  writePlanningSession,
} from "@/services/noor/mock-noor-storage";
import {
  deleteCloudLearningPlan,
  getCloudLearningPlan,
  saveCloudLearningPlan,
  subscribeToCloudLearningPlan,
} from "@/services/firebase/learning-plans";
import {
  deleteCloudNoorConversation,
  getCloudNoorConversation,
  saveCloudNoorConversation,
} from "@/services/firebase/noor-conversations";
import type { NoorConversation, NoorMessage, PlanningSession } from "@/types/noor";

export interface NoorService {
  getConversation(ownerId: string): Promise<NoorConversation | null>;
  saveConversation(ownerId: string, messages: NoorMessage[]): Promise<NoorConversation>;
  clearConversation(ownerId: string): Promise<void>;
  getPlanningSession(ownerId: string): Promise<PlanningSession | null>;
  savePlanningSession(session: PlanningSession): Promise<PlanningSession>;
  clearPlanningSession(ownerId: string): Promise<void>;
  subscribe(ownerId: string, listener: (source: "local" | "remote") => void): () => void;
}

export class MockNoorService implements NoorService {
  async getConversation(ownerId: string) {
    return readNoorConversation(ownerId);
  }

  async saveConversation(ownerId: string, messages: NoorMessage[]) {
    return writeNoorConversation(ownerId, messages);
  }

  async clearConversation(ownerId: string) {
    deleteNoorConversation(ownerId);
  }

  async getPlanningSession(ownerId: string) {
    return readPlanningSession(ownerId);
  }

  async savePlanningSession(session: PlanningSession) {
    return writePlanningSession(session);
  }

  async clearPlanningSession(ownerId: string) {
    deletePlanningSession(ownerId);
  }

  subscribe(ownerId: string, listener: (source: "local" | "remote") => void) {
    return subscribeToNoorChanges(ownerId, listener);
  }
}

/**
 * Firestore-backed Noor service. Conversations and planning sessions are
 * mirrored locally for offline fallback and migrated on first read.
 */
export class FirestoreNoorService extends MockNoorService {
  private readonly initializedOwners = new Set<string>();

  override async getConversation(ownerId: string) {
    try {
      const cloudConversation = await getCloudNoorConversation(ownerId);
      if (cloudConversation) {
        const localConversation = readNoorConversation(ownerId);
        if (JSON.stringify(localConversation) !== JSON.stringify(cloudConversation)) {
          writeNoorConversation(ownerId, cloudConversation.messages);
        }
        return cloudConversation;
      }

      const localConversation = readNoorConversation(ownerId);
      if (localConversation) await saveCloudNoorConversation(localConversation);
      return localConversation;
    } catch (error) {
      console.error("[Firestore] تعذّرت قراءة محادثة نور، استُخدمت النسخة المحلية:", error);
      return readNoorConversation(ownerId);
    }
  }

  override async saveConversation(ownerId: string, messages: NoorMessage[]) {
    const localConversation = writeNoorConversation(ownerId, messages);
    try {
      await saveCloudNoorConversation(localConversation);
    } catch (error) {
      console.error("[Firestore] تعذّر حفظ محادثة نور سحابيًا:", error);
    }
    return localConversation;
  }

  override async clearConversation(ownerId: string) {
    deleteNoorConversation(ownerId);
    try {
      await deleteCloudNoorConversation(ownerId);
    } catch (error) {
      console.error("[Firestore] تعذّر حذف محادثة نور السحابية:", error);
    }
  }

  override async getPlanningSession(ownerId: string) {
    try {
      const cloudSession = await getCloudLearningPlan(ownerId);
      this.initializedOwners.add(ownerId);
      if (cloudSession) {
        const localSession = readPlanningSession(ownerId);
        if (JSON.stringify(localSession) !== JSON.stringify(cloudSession)) {
          writePlanningSession(cloudSession);
        }
        return cloudSession;
      }

      const localSession = readPlanningSession(ownerId);
      if (localSession) await saveCloudLearningPlan(localSession);
      return localSession;
    } catch (error) {
      console.error("[Firestore] تعذّرت قراءة خطة نور، استُخدمت النسخة المحلية:", error);
      return readPlanningSession(ownerId);
    }
  }

  override async savePlanningSession(session: PlanningSession) {
    const localSession = writePlanningSession(session);
    try {
      await saveCloudLearningPlan(localSession);
    } catch (error) {
      console.error("[Firestore] تعذّر حفظ خطة نور سحابيًا:", error);
    }
    return localSession;
  }

  override async clearPlanningSession(ownerId: string) {
    deletePlanningSession(ownerId);
    try {
      await deleteCloudLearningPlan(ownerId);
    } catch (error) {
      console.error("[Firestore] تعذّر حذف خطة نور السحابية:", error);
    }
  }

  override subscribe(
    ownerId: string,
    listener: (source: "local" | "remote") => void,
  ) {
    const unsubscribeLocal = subscribeToNoorChanges(ownerId, (source) => {
      // Same-tab writes are already represented in React state. Reload only
      // when another tab changes the local fallback store.
      if (source === "remote") listener("remote");
    });
    const unsubscribeCloud = subscribeToCloudLearningPlan(
      ownerId,
      (session) => {
        if (!session && this.initializedOwners.has(ownerId)) {
          deletePlanningSession(ownerId);
        }
        listener("remote");
      },
      (error) => {
        console.error("[Firestore] تعذّرت مزامنة خطة نور:", error);
      },
    );

    return () => {
      unsubscribeLocal();
      unsubscribeCloud();
    };
  }
}

let instance: NoorService | null = null;

export function getNoorService(): NoorService {
  if (!instance) instance = new FirestoreNoorService();
  return instance;
}
