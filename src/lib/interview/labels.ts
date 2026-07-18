export const GOAL_LABELS: Record<string, string> = {
  career_change: "تغيير مساري المهني",
  skill_upgrade: "تطوير مهاراتي الحالية",
  student: "دعم دراستي الجامعية",
  personal: "تعلّم لأغراض شخصية",
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدّم",
};

export const PRIOR_EXPERIENCE_LABELS: Record<string, string> = {
  none: "لا توجد خبرة",
  some: "خبرة محدودة",
  experienced: "خبرة جيدة",
};

export const BUDGET_LABELS: Record<string, string> = {
  explore: "استكشاف فقط",
  "5-10h": "5–10 ساعات",
  "10-20h": "10–20 ساعة",
  "20+h": "20+ ساعة",
};

export function formatWeeklyHoursLabel(value: string, numeric?: number): string {
  if (numeric && numeric > 0) {
    return `${numeric.toLocaleString("ar-SA")} ساعة`;
  }
  if (/^\d+\s*ساع/.test(value)) return value;
  const bucketLabels: Record<string, string> = {
    "1-3": "1–3 ساعات",
    "3-5": "3–5 ساعات",
    "5-10": "5–10 ساعات",
    "10+": "10+ ساعات",
  };
  return bucketLabels[value] ?? value;
}
