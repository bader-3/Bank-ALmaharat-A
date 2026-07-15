export function splitDecimalHours(valueHours: number): { hours: number; minutes: number } {
  const totalMinutes = Math.round(valueHours * 60);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

/** يعرض المدة بصيغة ساعة:دقيقة (مثل 29:01) */
export function formatHoursAndMinutes(valueHours: number, _compact = false): string {
  const { hours, minutes } = splitDecimalHours(valueHours);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function formatMinutesDuration(totalMinutes: number, compact = false): string {
  return formatHoursAndMinutes(totalMinutes / 60, compact);
}

/** للمقارنة دون أخطاء الكسور العائمة */
export function hoursToTotalMinutes(valueHours: number): number {
  return Math.round(valueHours * 60);
}

export function hasEnoughHours(balanceHours: number, requiredHours: number): boolean {
  return hoursToTotalMinutes(balanceHours) >= hoursToTotalMinutes(requiredHours);
}
