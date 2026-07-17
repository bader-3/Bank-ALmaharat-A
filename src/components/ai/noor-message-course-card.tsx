"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconClock } from "@/components/ui/icons";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import { getCourseBySlug, getSpecialtyById, getTrainerById } from "@/lib/courses/mock-data";
import { DELIVERY_LABELS, LEVEL_LABELS } from "@/types/course";
import Link from "next/link";

interface NoorMessageCourseCardProps {
  slug: string;
  onNavigate?: () => void;
}

/** بطاقة دورة مصغّرة داخل فقاعة محادثة نور */
export function NoorMessageCourseCard({ slug, onNavigate }: NoorMessageCourseCardProps) {
  const course = getCourseBySlug(slug);
  if (!course) return null;

  const trainer = getTrainerById(course.trainerId);
  const specialty = getSpecialtyById(course.specialtyId);

  return (
    <Link
      href={`${ROUTES.courses}/${course.slug}`}
      onClick={onNavigate}
      className="mt-2 block"
    >
      <Card
        padding="sm"
        className="border-sage-200/70 bg-surface transition-colors hover:border-sage-400/60 hover:bg-sage-50/40 dark:border-sage-700/40 dark:hover:bg-sage-900/20"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-900 line-clamp-2">{course.title}</p>
            <p className="mt-1 text-xs text-foreground-secondary">
              {trainer?.name ?? "مدرب المنصة"}
              {specialty ? ` · ${specialty.name}` : ""}
            </p>
          </div>
          <Badge variant="sage" className="shrink-0">
            {LEVEL_LABELS[course.level]}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1">
            <IconClock size={12} />
            {formatHoursAndMinutes(course.hours)}
          </span>
          <span>{DELIVERY_LABELS[course.deliveryMode]}</span>
        </div>
      </Card>
    </Link>
  );
}
