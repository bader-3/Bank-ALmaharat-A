import {
  listReviewSessions,
  readReviewSession,
  writeReviewSession,
} from "@/services/review/mock-review-storage";
import { createInitialReviewSession } from "@/lib/ai/review-flow";
import type { LessonReviewSession } from "@/types/review";

export interface ReviewService {
  getSession(
    userId: string,
    courseSlug: string,
    lessonId: string,
  ): Promise<LessonReviewSession | null>;
  getOrCreateSession(params: {
    userId: string;
    courseSlug: string;
    lessonId: string;
    courseTitle: string;
    lessonTitle: string;
  }): Promise<LessonReviewSession>;
  saveSession(session: LessonReviewSession): Promise<void>;
  listSessions(userId: string): Promise<LessonReviewSession[]>;
}

class MockReviewService implements ReviewService {
  async getSession(userId: string, courseSlug: string, lessonId: string) {
    return readReviewSession(userId, courseSlug, lessonId);
  }

  async getOrCreateSession(params: {
    userId: string;
    courseSlug: string;
    lessonId: string;
    courseTitle: string;
    lessonTitle: string;
  }) {
    const existing = await this.getSession(
      params.userId,
      params.courseSlug,
      params.lessonId,
    );
    if (existing) return existing;

    const session = createInitialReviewSession(params);
    await this.saveSession(session);
    return session;
  }

  async saveSession(session: LessonReviewSession) {
    writeReviewSession({ ...session, updatedAt: new Date().toISOString() });
  }

  async listSessions(userId: string) {
    return listReviewSessions(userId);
  }
}

let instance: ReviewService | null = null;

export function getReviewService(): ReviewService {
  if (!instance) instance = new MockReviewService();
  return instance;
}
