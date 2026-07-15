export type TrainerReview = {
  id: string;
  trainerId: string;
  authorName: string;
  rating: number;
  courseSlug?: string;
  courseTitle?: string;
  text: string;
  createdAt: string;
};

export type TrainerRatingSummary = {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};
