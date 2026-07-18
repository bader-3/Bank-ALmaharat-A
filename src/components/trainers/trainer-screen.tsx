"use client";

import { CourseCard } from "@/components/courses/course-card";
import { TrainerRating } from "@/components/trainers/trainer-rating";
import { TrainerReviewList } from "@/components/trainers/trainer-review-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconArrow, IconClock, IconCompass, IconUser } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import {
  getCoursesByTrainerId,
  getTrainerRatingSummary,
  getTrainerReviews,
} from "@/lib/courses/trainer-profiles";
import { getTrainerById } from "@/lib/courses/mock-data";
import { DELIVERY_LABELS } from "@/types/course";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMemo, type ReactNode } from "react";

interface TrainerScreenProps {
  trainerId: string;
}

export function TrainerScreen({ trainerId }: TrainerScreenProps) {
  const trainer = getTrainerById(trainerId);
  const courses = useMemo(() => getCoursesByTrainerId(trainerId), [trainerId]);
  const reviews = useMemo(() => getTrainerReviews(trainerId), [trainerId]);
  const rating = useMemo(() => getTrainerRatingSummary(trainerId), [trainerId]);

  if (!trainer) notFound();

  const totalHours = courses.reduce((sum, course) => sum + course.hours, 0);
  const deliveryModes = [...new Set(courses.map((course) => course.deliveryMode))];

  return (
    <Container className="py-10 lg:py-14">
      <Link
        href={ROUTES.trainers}
        className="inline-flex items-center gap-1 text-sm text-foreground-secondary transition-colors hover:text-foreground"
      >
        <IconArrow className="rotate-180" />
        العودة للمدربين
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem] lg:gap-12">
        <div>
          <div className="flex flex-wrap items-start gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-2xl font-bold text-sage-700">
              {trainer.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <IconUser size={16} className="text-gold-500" />
                <p className="text-xs font-semibold tracking-wide text-sage-600">المدرب</p>
              </div>
              <h1 className="mt-2 text-3xl font-bold text-navy-900 lg:text-4xl">{trainer.name}</h1>
              <p className="mt-2 text-lg text-foreground-secondary">{trainer.title}</p>
              {rating.count > 0 && (
                <div className="mt-4">
                  <TrainerRating value={rating.average} count={rating.count} />
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-pretty leading-relaxed text-foreground-secondary">
            {trainer.bio}
          </p>

          <section className="mt-12">
            <div className="flex items-center gap-2">
              <IconCompass size={18} className="text-gold-500" />
              <h2 className="text-xl font-semibold text-navy-900">دورات المدرب</h2>
              <Badge variant="neutral">{courses.length.toLocaleString("ar-SA")}</Badge>
            </div>
            <p className="mt-2 text-sm text-foreground-secondary">
              جرّب درسًا بساعات قليلة من أي دورة قبل أن تلتزم بإكمالها.
            </p>

            {courses.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            ) : (
              <Card padding="md" className="mt-6">
                <p className="text-sm text-foreground-secondary">لا توجد دورات منشورة حاليًا.</p>
              </Card>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-xl font-semibold text-navy-900">مراجعات المتعلّمين</h2>
            <p className="mt-2 text-sm text-foreground-secondary">
              تجارب حقيقية من من جرّبوا دورات هذا المدرب.
            </p>
            <div className="mt-6">
              <TrainerReviewList reviews={reviews} />
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card padding="lg" className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-foreground-muted">نظرة سريعة</p>
              <div className="mt-4 space-y-4">
                <StatRow
                  label="عدد الدورات"
                  value={courses.length.toLocaleString("ar-SA")}
                />
                <StatRow
                  label="إجمالي الساعات"
                  value={formatHoursAndMinutes(totalHours, true)}
                  icon={<IconClock size={16} />}
                />
                {rating.count > 0 && (
                  <div>
                    <p className="text-sm text-foreground-secondary">متوسط التقييم</p>
                    <div className="mt-2">
                      <TrainerRating value={rating.average} count={rating.count} size="sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {deliveryModes.length > 0 && (
              <>
                <div className="section-rule" />
                <div>
                  <p className="text-xs font-semibold text-foreground-muted">طرق التقديم</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {deliveryModes.map((mode) => (
                      <Badge key={mode} variant="neutral">
                        {DELIVERY_LABELS[mode]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {rating.count > 0 && (
              <>
                <div className="section-rule" />
                <div>
                  <p className="text-xs font-semibold text-foreground-muted">توزيع التقييمات</p>
                  <ul className="mt-3 space-y-2">
                    {([5, 4, 3, 2, 1] as const).map((star) => (
                      <li key={star} className="flex items-center gap-3 text-sm">
                        <span className="w-8 text-foreground-muted">{star} ★</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-muted">
                          <div
                            className="h-full rounded-full bg-gold-400"
                            style={{
                              width: `${rating.count ? (rating.breakdown[star] / rating.count) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 text-end tabular-nums text-foreground-muted">
                          {rating.breakdown[star].toLocaleString("ar-SA")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Button href={ROUTES.courses} variant="secondary" fullWidth>
              استكشف كل الدورات
            </Button>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground-secondary">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-semibold text-navy-900">
        {icon}
        {value}
      </span>
    </div>
  );
}
