"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SPECIALTIES, getTrainerById } from "@/lib/courses/mock-data";
import { getCoursesByDiscovery } from "@/lib/courses/recommendations";
import { DELIVERY_LABELS, LEVEL_LABELS, type CourseLevel, type DeliveryMode } from "@/types/course";
import type { PlanDiscovery } from "@/types/noor";

type NoorDiscoveryPanelProps = {
  discovery: PlanDiscovery;
  onChooseMode: (mode: "edit_current" | "new_courses") => void;
  onChooseSpecialty: (specialtyId: string) => void;
  onChooseLevel: (level: CourseLevel) => void;
  onChooseDelivery: (modes: DeliveryMode[]) => void;
  onToggleCourse: (courseSlug: string) => void;
  onBuild: () => void;
  onCancel: () => void;
};

const LEVELS: CourseLevel[] = ["beginner", "intermediate", "advanced"];

const DELIVERY_OPTIONS: Array<{ label: string; modes: DeliveryMode[] }> = [
  { label: "مسجّلة", modes: ["recorded"] },
  { label: "مباشرة", modes: ["live"] },
  { label: "كلتاهما", modes: ["recorded", "live"] },
];

export function NoorDiscoveryPanel({
  discovery,
  onChooseMode,
  onChooseSpecialty,
  onChooseLevel,
  onChooseDelivery,
  onToggleCourse,
  onBuild,
  onCancel,
}: NoorDiscoveryPanelProps) {
  if (!discovery.active) return null;

  return (
    <div className="rounded-2xl border border-sage-200/70 bg-sage-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="gold">استكشاف الدورات</Badge>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-foreground-muted hover:text-foreground"
        >
          إلغاء
        </button>
      </div>

      {discovery.step === "mode" && (
        <div className="flex flex-wrap gap-2">
          <Chip onClick={() => onChooseMode("edit_current")}>تعديل الدورات الحالية</Chip>
          <Chip onClick={() => onChooseMode("new_courses")} primary>
            استكشاف دورات أخرى
          </Chip>
        </div>
      )}

      {discovery.step === "specialty" && (
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((specialty) => (
            <Chip key={specialty.id} onClick={() => onChooseSpecialty(specialty.id)}>
              {specialty.name}
            </Chip>
          ))}
        </div>
      )}

      {discovery.step === "level" && (
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((level) => (
            <Chip key={level} onClick={() => onChooseLevel(level)}>
              {LEVEL_LABELS[level]}
            </Chip>
          ))}
        </div>
      )}

      {discovery.step === "delivery" && (
        <div className="flex flex-wrap gap-2">
          {DELIVERY_OPTIONS.map((option) => (
            <Chip key={option.label} onClick={() => onChooseDelivery(option.modes)}>
              {option.label}
            </Chip>
          ))}
        </div>
      )}

      {discovery.step === "results" && (
        <DiscoveryResults
          discovery={discovery}
          onToggleCourse={onToggleCourse}
          onBuild={onBuild}
        />
      )}
    </div>
  );
}

function DiscoveryResults({
  discovery,
  onToggleCourse,
  onBuild,
}: {
  discovery: PlanDiscovery;
  onToggleCourse: (courseSlug: string) => void;
  onBuild: () => void;
}) {
  const courses =
    discovery.specialtyId && discovery.level
      ? getCoursesByDiscovery({
          specialtyId: discovery.specialtyId,
          level: discovery.level,
          deliveryModes: discovery.deliveryModes ?? [],
        })
      : [];

  if (!courses.length) {
    return (
      <p className="text-sm text-foreground-secondary">
        لا توجد دورات في الفهرس تطابق هذه الفلاتر. اضغط «إلغاء» وجرّب تخصصًا أو مستوى مختلفًا.
      </p>
    );
  }

  const selectedCount = discovery.selectedSlugs.length;

  return (
    <div>
      <div className="space-y-2">
        {courses.map((course) => {
          const selected = discovery.selectedSlugs.includes(course.slug);
          const trainer = getTrainerById(course.trainerId);
          return (
            <button
              key={course.slug}
              type="button"
              onClick={() => onToggleCourse(course.slug)}
              className={`w-full rounded-xl border p-3 text-right transition-colors ${
                selected
                  ? "border-sage-400 bg-sage-100/60"
                  : "border-border bg-surface hover:border-sage-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-900">{course.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">
                    {course.summary}
                  </p>
                  {trainer && (
                    <p className="mt-1 text-xs text-foreground-secondary">المدرب: {trainer.name}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={selected ? "sage" : "neutral"}>
                    {selected ? "مختارة ✓" : "اختيار"}
                  </Badge>
                  <span className="text-xs text-foreground-muted">
                    {LEVEL_LABELS[course.level]} · {DELIVERY_LABELS[course.deliveryMode]} ·{" "}
                    {course.hours} س
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-foreground-muted">
          {selectedCount ? `${selectedCount} دورة مختارة` : "اختر دورة واحدة على الأقل"}
        </span>
        <Button size="sm" disabled={!selectedCount} onClick={onBuild}>
          ابنِ الخطة واربطها بالأهداف
        </Button>
      </div>
    </div>
  );
}

function Chip({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        primary
          ? "border-sage-500 bg-sage-500 text-white hover:bg-sage-600"
          : "border-sage-300/70 bg-surface text-sage-700 hover:bg-sage-100"
      }`}
    >
      {children}
    </button>
  );
}
