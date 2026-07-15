import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AiRecommendationReason } from "@/components/ai/ai-recommendation-reason";
import { FavoriteButton } from "@/components/courses/favorite-button";
import { IconClock, IconCompass } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { DELIVERY_LABELS, LEVEL_LABELS, type Course } from "@/types/course";
import { getSpecialtyById, getTrainerById } from "@/lib/courses/mock-data";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";

interface CourseCardProps {
  course: Course;
  highlighted?: boolean;
  aiReason?: string;
}

const SPECIALTY_ACCENTS: Record<
  string,
  { card: string; icon: string; badge: "blue" | "purple" | "orange" | "sage" | "gold" | "navy" }
> = {
  tech: { card: "border-accent-blue-100/80", icon: "bg-accent-blue-100 text-accent-blue-600", badge: "blue" },
  ai: { card: "border-accent-purple-100/80", icon: "bg-accent-purple-100 text-accent-purple-600", badge: "purple" },
  design: { card: "border-accent-orange-100/80", icon: "bg-accent-orange-100 text-accent-orange-600", badge: "orange" },
  business: { card: "border-navy-100/80", icon: "bg-navy-100 text-navy-700", badge: "navy" },
  marketing: { card: "border-gold-100/80", icon: "bg-gold-100 text-gold-700", badge: "gold" },
  accounting: { card: "border-sage-100/80", icon: "bg-sage-100 text-sage-700", badge: "sage" },
};

const DEFAULT_ACCENT = {
  card: "border-border/60",
  icon: "bg-background-subtle text-foreground-muted",
  badge: "sage" as const,
};

export function CourseCard({ course, highlighted, aiReason }: CourseCardProps) {
  const specialty = getSpecialtyById(course.specialtyId);
  const trainer = getTrainerById(course.trainerId);
  const accent = SPECIALTY_ACCENTS[course.specialtyId] ?? DEFAULT_ACCENT;

  return (
    <div className="group relative h-full">
      <div className="absolute start-4 top-4 z-10">
        <FavoriteButton courseSlug={course.slug} />
      </div>
      <Link href={`${ROUTES.courses}/${course.slug}`} className="block h-full">
        <Card
          interactive
          padding="md"
          className={cn(
            "flex h-full flex-col transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md",
            accent.card,
          )}
        >
          <div className="flex items-start gap-3 pe-8">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                accent.icon,
              )}
            >
              <IconCompass size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {specialty && <Badge variant={accent.badge}>{specialty.name}</Badge>}
                {highlighted && <Badge variant="gold">مقترح لك</Badge>}
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug text-navy-900">{course.title}</h3>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-foreground-secondary">
            {course.summary}
          </p>

          {aiReason && (
            <div className="mt-4">
              <AiRecommendationReason reason={aiReason} compact />
            </div>
          )}

          <div className="mt-5 space-y-3 border-t border-border/50 pt-4">
            {trainer && (
              <p className="truncate text-xs text-foreground-muted">{trainer.name}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{LEVEL_LABELS[course.level]}</Badge>
              <Badge variant="neutral">{DELIVERY_LABELS[course.deliveryMode]}</Badge>
              <span className="inline-flex items-center gap-1 rounded-full bg-background-subtle px-2.5 py-1 text-xs font-medium text-foreground-secondary">
                <IconClock size={12} />
                {formatHoursAndMinutes(course.hours, true)}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
