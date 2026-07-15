import { Card } from "@/components/ui/card";
import { TrainerRating } from "@/components/trainers/trainer-rating";
import { ROUTES } from "@/lib/constants";
import type { TrainerReview } from "@/types/trainer";
import Link from "next/link";

export function TrainerReviewList({ reviews }: { reviews: TrainerReview[] }) {
  if (!reviews.length) {
    return (
      <Card padding="md">
        <p className="text-sm text-foreground-secondary">لا توجد مراجعات بعد.</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <Card padding="md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy-900">{review.authorName}</p>
                {review.courseTitle && review.courseSlug && (
                  <Link
                    href={`${ROUTES.courses}/${review.courseSlug}`}
                    className="mt-1 inline-block text-xs text-sage-600 hover:underline"
                  >
                    دورة: {review.courseTitle}
                  </Link>
                )}
              </div>
              <TrainerRating value={review.rating} size="sm" showValue={false} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">{review.text}</p>
            <p className="mt-3 text-xs text-foreground-muted">
              {new Date(review.createdAt).toLocaleDateString("ar-SA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
