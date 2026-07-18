import type { InterviewConversation, LearningProfile } from "@/types/interview";
import { ensureInterviewCompletion } from "@/lib/auth/interview-access";
import {
  mergeLearningProfileEdits,
  type LearningProfileEdits,
} from "@/lib/interview/update-learning-profile";
import { mockWriteDelay } from "@/lib/mock-delay";
import {
  readInterviewConversation,
  readLearningProfile,
  saveAiLearningProfile,
  saveAiLearningProfileAsync,
  saveInterviewConversation,
} from "@/services/interview/mock-profile-storage";
import { getLearningService } from "@/services/learning";

export interface InterviewService {
  saveProfile(profile: LearningProfile): Promise<LearningProfile>;
  saveProfileAndSync(profile: LearningProfile): Promise<LearningProfile>;
  updateProfileAnswers(userId: string, edits: LearningProfileEdits): Promise<LearningProfile>;
  getProfile(userId: string): Promise<LearningProfile | null>;
  finalizeInterview(userId: string, profileHint?: LearningProfile | null): Promise<boolean>;
  getConversation(userId: string): Promise<InterviewConversation | null>;
  saveConversation(
    conversation: Omit<InterviewConversation, "updatedAt">,
  ): Promise<InterviewConversation>;
}

export class MockInterviewService implements InterviewService {
  async saveProfile(profile: LearningProfile): Promise<LearningProfile> {
    await mockWriteDelay(80);
    return saveAiLearningProfile(profile);
  }

  async saveProfileAndSync(profile: LearningProfile): Promise<LearningProfile> {
    await mockWriteDelay(80);
    return saveAiLearningProfileAsync(profile);
  }

  async updateProfileAnswers(userId: string, edits: LearningProfileEdits): Promise<LearningProfile> {
    await mockWriteDelay(80);
    const current = readLearningProfile(userId);
    if (!current) {
      throw new Error("لا يوجد ملف تعليمي للتعديل. أكمل المقابلة أولًا.");
    }

    const next = mergeLearningProfileEdits(current, edits);
    const saved = await saveAiLearningProfileAsync(next);

    // إعادة جدولة أهداف الدروس المشتراة حسب الأيام/الوقت الجديد
    await getLearningService().getEnrollments(userId).catch(() => undefined);

    return saved;
  }

  async getProfile(userId: string): Promise<LearningProfile | null> {
    return readLearningProfile(userId);
  }

  async finalizeInterview(userId: string, profileHint?: LearningProfile | null): Promise<boolean> {
    return ensureInterviewCompletion(userId, profileHint ?? readLearningProfile(userId));
  }

  async getConversation(userId: string) {
    return readInterviewConversation(userId);
  }

  async saveConversation(conversation: Omit<InterviewConversation, "updatedAt">) {
    return saveInterviewConversation(conversation);
  }
}

let instance: MockInterviewService | null = null;

export function getInterviewService(): InterviewService {
  if (!instance) instance = new MockInterviewService();
  return instance;
}
