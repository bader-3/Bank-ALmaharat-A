import type { InterviewConversation, LearningProfile } from "@/types/interview";
import { mockWriteDelay } from "@/lib/mock-delay";
import {
  readInterviewConversation,
  readLearningProfile,
  saveAiLearningProfile,
  saveInterviewConversation,
} from "@/services/interview/mock-profile-storage";

export interface InterviewService {
  saveProfile(profile: LearningProfile): Promise<LearningProfile>;
  getProfile(userId: string): Promise<LearningProfile | null>;
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

  async getProfile(userId: string): Promise<LearningProfile | null> {
    return readLearningProfile(userId);
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
