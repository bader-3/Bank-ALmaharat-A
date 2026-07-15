import { CourseDetailView } from "@/components/courses/course-detail-view";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { notFound } from "next/navigation";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();
  return <CourseDetailView course={course} />;
}
