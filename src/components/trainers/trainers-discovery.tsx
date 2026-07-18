"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconUsers } from "@/components/ui/icons";
import { TrainerRating } from "@/components/trainers/trainer-rating";
import {
  getCoursesByTrainerId,
  getTrainerRatingSummary,
} from "@/lib/courses/trainer-profiles";
import { TRAINERS } from "@/lib/courses/mock-data";
import { ROUTES } from "@/lib/constants";
import Link from "next/link";

export function TrainersDiscovery() {
  return (
    <Container className="py-10 lg:py-14">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <IconUsers size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">استكشاف المحتوى</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">المدربين</h1>
        <p className="mt-2 text-pretty text-foreground-secondary">
          تصفّح ملفات المدربين، اطّلع على تقييماتهم ودوراتهم، ثم اختر من يناسب أسلوب تعلّمك.
        </p>
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy-900">كل المدربين</h2>
          <Badge variant="neutral">{TRAINERS.length.toLocaleString("ar-SA")}</Badge>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {TRAINERS.map((trainer) => {
            const courses = getCoursesByTrainerId(trainer.id);
            const rating = getTrainerRatingSummary(trainer.id);

            return (
              <Link key={trainer.id} href={ROUTES.trainer(trainer.id)} className="group block h-full">
                <Card
                  interactive
                  padding="md"
                  className="flex h-full flex-col border-border/60 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-lg font-bold text-sage-700 dark:bg-sage-500/20 dark:text-sage-300">
                      {trainer.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-navy-900">{trainer.name}</h3>
                      <p className="mt-1 text-sm text-foreground-secondary">{trainer.title}</p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-foreground-secondary">
                    {trainer.bio}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                    <Badge variant="sage">
                      {courses.length.toLocaleString("ar-SA")} دورة
                    </Badge>
                    {rating.count > 0 ? (
                      <TrainerRating value={rating.average} count={rating.count} size="sm" />
                    ) : (
                      <span className="text-xs text-foreground-muted">بدون تقييمات بعد</span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </Container>
  );
}
