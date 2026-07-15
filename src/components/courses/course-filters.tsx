"use client";

import { cn } from "@/lib/cn";
import { SPECIALTIES } from "@/lib/courses/mock-data";
import {
  DELIVERY_LABELS,
  LEVEL_LABELS,
  type CourseFilters,
  type CourseLevel,
  type DeliveryMode,
} from "@/types/course";
import { IconClose } from "@/components/ui/icons";
import type { ReactNode } from "react";

interface CourseFiltersBarProps {
  filters: CourseFilters;
  onChange: (filters: CourseFilters) => void;
  resultCount?: number;
}

const LEVELS: { value: CourseLevel | "all"; label: string }[] = [
  { value: "all", label: "كل المستويات" },
  { value: "beginner", label: LEVEL_LABELS.beginner },
  { value: "intermediate", label: LEVEL_LABELS.intermediate },
  { value: "advanced", label: LEVEL_LABELS.advanced },
];

const DELIVERY: { value: DeliveryMode | "all"; label: string }[] = [
  { value: "all", label: "كل الأنواع" },
  { value: "recorded", label: DELIVERY_LABELS.recorded },
  { value: "live", label: DELIVERY_LABELS.live },
  { value: "hybrid", label: DELIVERY_LABELS.hybrid },
];

export function CourseFiltersBar({ filters, onChange, resultCount }: CourseFiltersBarProps) {
  const hasActiveFilters =
    (filters.specialtyId && filters.specialtyId !== "all") ||
    (filters.level && filters.level !== "all") ||
    (filters.deliveryMode && filters.deliveryMode !== "all") ||
    Boolean(filters.query?.trim());

  function resetFilters() {
    onChange({
      specialtyId: "all",
      level: "all",
      deliveryMode: "all",
      query: "",
    });
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <input
          type="search"
          value={filters.query ?? ""}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="ابحث باسم الدورة أو المدرب…"
          className="h-12 w-full rounded-2xl border border-border/70 bg-surface pe-4 ps-11 text-sm text-foreground shadow-sm outline-none transition focus:border-sage-400 focus:ring-2 focus:ring-sage-400/15"
        />
        <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-foreground-muted">
          ⌕
        </span>
      </div>

      <FilterGroup label="التخصص">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <FilterChip
            active={!filters.specialtyId || filters.specialtyId === "all"}
            onClick={() => onChange({ ...filters, specialtyId: "all" })}
          >
            الكل
          </FilterChip>
          {SPECIALTIES.map((specialty) => (
            <FilterChip
              key={specialty.id}
              active={filters.specialtyId === specialty.id}
              onClick={() => onChange({ ...filters, specialtyId: specialty.id })}
            >
              {specialty.name}
            </FilterChip>
          ))}
        </div>
      </FilterGroup>

      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <FilterGroup label="المستوى">
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <FilterChip
                key={level.value}
                active={(filters.level ?? "all") === level.value}
                onClick={() => onChange({ ...filters, level: level.value })}
              >
                {level.label}
              </FilterChip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="طريقة التقديم">
          <div className="flex flex-wrap gap-2">
            {DELIVERY.map((mode) => (
              <FilterChip
                key={mode.value}
                active={(filters.deliveryMode ?? "all") === mode.value}
                onClick={() => onChange({ ...filters, deliveryMode: mode.value })}
              >
                {mode.label}
              </FilterChip>
            ))}
          </div>
        </FilterGroup>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <p className="text-sm text-foreground-secondary">
          {typeof resultCount === "number" ? (
            <>
              <span className="font-semibold text-navy-900">{resultCount.toLocaleString("ar-SA")}</span>{" "}
              {resultCount === 1 ? "دورة متاحة" : "دورات متاحة"}
            </>
          ) : (
            "استكشف الدورات بحرّية"
          )}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-secondary transition hover:border-sage-300 hover:text-sage-700"
          >
            <IconClose size={12} />
            مسح الفلاتر
          </button>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-foreground-muted">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-sage-500 bg-sage-500 text-white shadow-sm"
          : "border-border/70 bg-surface text-foreground-secondary hover:border-sage-300 hover:text-navy-900",
      )}
    >
      {children}
    </button>
  );
}
