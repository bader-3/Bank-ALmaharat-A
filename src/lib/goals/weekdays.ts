/** Arabic weekday labels → JS `Date.getDay()` (0 = Sunday). */
const WEEKDAY_CANONICAL: Array<{ index: number; labels: string[] }> = [
  { index: 0, labels: ["الأحد", "الاحد", "أحد", "احد"] },
  { index: 1, labels: ["الاثنين", "الإثنين", "اثنين", "إثنين"] },
  { index: 2, labels: ["الثلاثاء", "ثلاثاء"] },
  { index: 3, labels: ["الأربعاء", "الاربعاء", "أربعاء", "اربعاء"] },
  { index: 4, labels: ["الخميس", "خميس"] },
  { index: 5, labels: ["الجمعة", "جمعه", "جمعة"] },
  { index: 6, labels: ["السبت", "سبت"] },
];

function normalizeDayToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/^ال/, "");
}

const LOOKUP = new Map<string, number>();
for (const entry of WEEKDAY_CANONICAL) {
  for (const label of entry.labels) {
    LOOKUP.set(normalizeDayToken(label), entry.index);
  }
}

export function weekdayIndexFromLabel(day: string): number | undefined {
  return LOOKUP.get(normalizeDayToken(day));
}

/** Unique sorted weekday indexes from Arabic labels (skips unknown). */
export function resolveAvailableDayIndexes(availableDays?: string[]): number[] {
  if (!availableDays?.length) return [];
  const indexes = [
    ...new Set(
      availableDays
        .map((day) => weekdayIndexFromLabel(day))
        .filter((day): day is number => typeof day === "number"),
    ),
  ];
  return indexes.sort((a, b) => a - b);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Schedule lesson `index` on the next matching available weekday
 * (cycles through available days across weeks). Never falls back to
 * consecutive calendar days — that ignores the learner's study days.
 */
export function scheduleOnAvailableDays(
  index: number,
  availableDays: string[] | undefined,
  fromDate = new Date(),
): Date {
  const dayIndexes = resolveAvailableDayIndexes(availableDays);
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  if (dayIndexes.length === 0) {
    // No valid study days in profile — keep today only as last resort.
    return addDays(start, 0);
  }

  const targetDay = dayIndexes[index % dayIndexes.length];
  const weekOffset = Math.floor(index / dayIndexes.length) * 7;
  const delta = (targetDay - start.getDay() + 7) % 7;
  return addDays(start, delta + weekOffset);
}
