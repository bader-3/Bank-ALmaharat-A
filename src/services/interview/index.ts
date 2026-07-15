import type { InterviewConversation, LearningProfile } from "@/types/interview";
import { markInterviewCompleted, getUserById, readSession } from "@/services/auth/mock-storage";
import { mockWriteDelay } from "@/lib/mock-delay";
import {
  readInterviewConversation,
  readLearningProfile,
  saveAiLearningProfile,
  saveAiLearningProfileAsync,
  saveInterviewConversation,
} from "@/services/interview/mock-profile-storage";

export interface InterviewService {
  saveProfile(profile: LearningProfile): Promise<LearningProfile>;
  saveProfileAndSync(profile: LearningProfile): Promise<LearningProfile>;
  getProfile(userId: string): Promise<LearningProfile | null>;
  syncInterviewCompletion(userId: string): Promise<boolean>;
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

  async getProfile(userId: string): Promise<LearningProfile | null> {
    return readLearningProfile(userId);
  }

  async syncInterviewCompletion(userId: string): Promise<boolean> {
    const profile = readLearningProfile(userId);
    if (!profile) return false;

    const storedUser = getUserById(userId);
    const session = readSession();
    if (storedUser?.interviewCompleted && session?.user.interviewCompleted) {
      return true;
    }

    markInterviewCompleted(userId);
    return true;
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
