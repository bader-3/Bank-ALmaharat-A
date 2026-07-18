"use client";

import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconArrow, IconHeart, IconSparkle } from "@/components/ui/icons";
import { useInterviewGate } from "@/hooks/use-interview-gate";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { ROUTES } from "@/lib/constants";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { getFavoritesService } from "@/services/favorites";
import type { Course } from "@/types/course";
import { useCallback, useEffect, useMemo, useState } from "react";

export function FavoritesScreen() {
  const { user, authLoading, interviewReady } = useInterviewGate();
  const { isAuthenticated } = useRequireAuth();
  const favoritesService = useMemo(() => getFavoritesService(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const slugs = await favoritesService.list(user.id);
    setCourses(slugs.map((slug) => getCourseBySlug(slug)).filter((c): c is Course => Boolean(c)));
    setLoading(false);
  }, [user, favoritesService]);

  useEffect(() => {
    if (!interviewReady || !user) return;
    void load();
  }, [interviewReady, user, load]);

  useEffect(() => {
    function handleStorage() {
      void load();
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [load]);

  if (authLoading || !isAuthenticated || !user || !interviewReady || loading) {
    return (
      <Container className="py-24">
        <p className="type-body text-center text-foreground-muted">جاري تحميل المفضّلة…</p>
      </Container>
    );
  }

  return (
    <Container className="py-10 lg:py-14">
      <div>
        <div className="flex items-center gap-2">
          <IconHeart size={18} className="text-gold-500" filled />
          <p className="text-xs font-semibold tracking-wide text-sage-600">محفوظة للمراجعة</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">المفضّلة</h1>
        <p className="mt-2 max-w-2xl text-pretty text-foreground-secondary">
          الدورات التي أضفتها للمفضّلة — جرّب درسًا بساعات قليلة قبل أن تلتزم بإكمالها.
        </p>
      </div>

      {courses.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      ) : (
        <Card padding="lg" className="mt-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-500/15 text-sage-600">
            <IconSparkle size={24} />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-navy-900">لا توجد دورات في المفضّلة</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground-secondary">
            اضغط على أيقونة القلب في أي دورة لحفظها هنا.
          </p>
          <Button href={ROUTES.courses} size="lg" className="mt-6">
            استكشف الدورات
            <IconArrow />
          </Button>
        </Card>
      )}
    </Container>
  );
}
