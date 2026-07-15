import { ReviewScreen } from "@/components/review/review-screen";

interface ReviewPageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { slug, lessonId } = await params;
  return <ReviewScreen slug={slug} lessonId={lessonId} />;
}
