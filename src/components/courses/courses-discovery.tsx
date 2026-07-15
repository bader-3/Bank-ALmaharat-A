"use client";

import { CourseCard } from "@/components/courses/course-card";
import { CourseFiltersBar } from "@/components/courses/course-filters";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconCompass, IconSparkle } from "@/components/ui/icons";
import { useAuth } from "@/providers/auth-provider";
import { getInterviewService } from "@/services/interview";
import { getAiRecommendedCourses } from "@/lib/courses/ai-recommendations";
import { filterCourses } from "@/lib/courses/recommendations";
import type { CourseFilters } from "@/types/course";
import type { RecommendedCourse } from "@/lib/courses/ai-recommendations";
import { useEffect, useMemo, useState } from "react";

export function CoursesDiscovery() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<CourseFilters>({
    specialtyId: "all",
    level: "all",
    deliveryMode: "all",
    query: "",
  });
  const [recommended, setRecommended] = useState<RecommendedCourse[]>([]);

  const courses = useMemo(() => filterCourses(filters), [filters]);

  useEffect(() => {
    let active = true;

    async function loadRecommendations() {
      if (!user?.interviewCompleted) {
        setRecommended([]);
        return;
      }
      const profile = await getInterviewService().getProfile(user.id);
      if (!active) return;
      setRecommended(getAiRecommendedCourses(profile, 4));
    }

    void loadRecommendations();
    return () => {
      active = false;
    };
  }, [user]);

  const recommendedIds = useMemo(() => new Set(recommended.map((r) => r.course.id)), [recommended]);
  const showRecommended = Boolean(user?.interviewCompleted && recommended.length > 0);
  const otherCourses = useMemo(
    () =>
      showRecommended
        ? courses.filter((course) => !recommendedIds.has(course.id))
        : courses,
    [courses, recommendedIds, showRecommended],
  );

  return (
    <Container className="py-10 lg:py-14">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <IconCompass size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">استكشاف المحتوى</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">الدورات</h1>
        <p className="mt-2 text-pretty text-foreground-secondary">
          استكشف مدربين ودورات بساعات قليلة — قرارك يأتي بعد التجربة، والشهادة بعد الإكمال.
        </p>
      </div>

      <Card padding="md" className="mt-8">
        <CourseFiltersBar filters={filters} onChange={setFilters} resultCount={courses.length} />
      </Card>

      {showRecommended && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <IconSparkle size={18} className="text-gold-500" />
            <h2 className="text-lg font-semibold text-navy-900">مقترح لك</h2>
          </div>
          <p className="mt-1 text-sm text-foreground-secondary">
            توصيات مبنية على مقابلتك — مع سبب واضح لكل دورة.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
            {recommended.map(({ course, reason }) => (
              <CourseCard key={course.id} course={course} highlighted aiReason={reason} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy-900">
            {showRecommended ? "باقي الدورات" : "كل الدورات"}
          </h2>
        </div>

        {otherCourses.length === 0 && !showRecommended ? (
          <Card padding="lg" className="mt-6 text-center">
            <p className="text-lg font-semibold text-navy-900">لا توجد دورات مطابقة</p>
            <p className="mt-2 text-sm text-foreground-secondary">
              جرّب تغيير الفلاتر أو البحث بكلمات مختلفة.
            </p>
          </Card>
        ) : otherCourses.length === 0 ? (
          <p className="mt-6 text-sm text-foreground-muted">كل الدورات المطابقة ظهرت في المقترحات.</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {otherCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                highlighted={recommendedIds.has(course.id) && showRecommended}
              />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
