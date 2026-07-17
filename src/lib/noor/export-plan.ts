import type { PlanningSession } from "@/types/noor";

/** ملخص نصي قابل للنسخ/المشاركة لخطة نور المعتمدة */
export function formatPlanExportText(session: PlanningSession): string {
  const draft = session.draft;
  if (!draft) return "لا توجد مسودة خطة للتصدير.";

  const lines: string[] = [
    `خطة التعلّم: ${draft.title}`,
    draft.summary,
    "",
    `المدة: ${draft.totalWeeks} أسابيع · إجمالي الساعات: ${draft.totalHours}`,
    `ساعات أسبوعية: ${draft.weeklyHours}`,
    `أيام الدراسة: ${draft.availableDays.join("، ") || "—"}`,
    `الأوقات المفضّلة: ${draft.preferredTimes?.join("، ") || "—"}`,
    "",
    "الدورات:",
  ];

  const courses = draft.courses
    .filter((course) => course.included)
    .sort((a, b) => a.order - b.order);

  courses.forEach((course, index) => {
    const lessonCount = course.lessons.filter((lesson) => lesson.included).length;
    lines.push(
      `${index + 1}. ${course.title} — ${lessonCount.toLocaleString("ar-SA")} درس`,
    );
  });

  if (draft.schedule.length) {
    lines.push("", "أول مواعيد مجدولة:");
    draft.schedule.slice(0, 8).forEach((item) => {
      lines.push(
        `• ${item.scheduledDate} ${item.startTime} — ${item.title} (${item.day})`,
      );
    });
  }

  if (session.acceptedAt) {
    lines.push("", `تاريخ الاعتماد: ${new Date(session.acceptedAt).toLocaleString("ar-SA")}`);
  }

  lines.push("", "— بنك المهارات العربي · نور");
  return lines.join("\n");
}

export async function shareOrCopyPlanText(text: string): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "خطة التعلّم — نور", text });
      return "shared";
    } catch {
      // fall through to clipboard
    }
  }

  await navigator.clipboard.writeText(text);
  return "copied";
}
