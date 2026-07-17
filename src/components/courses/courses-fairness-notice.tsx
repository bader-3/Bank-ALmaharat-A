import { IconScale } from "@/components/ui/icons";

/** Short demo-facing note: catalog is not ranked by sales or ratings. */
export function CoursesFairnessNotice() {
  return (
    <p
      className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-sage-200/70 bg-sage-50/70 px-3 py-1.5 text-xs text-sage-800 dark:border-sage-800/40 dark:bg-sage-900/20 dark:text-sage-200"
      title="المنصة لا ترتّب الدورات حسب الأكثر مبيعًا أو الأعلى تقييمًا حفاظًا على عدالة المدربين."
    >
      <IconScale size={14} className="shrink-0 text-sage-600" aria-hidden />
      <span className="text-pretty">
        كل الدورات معروضة بعدالة — بدون ترتيب حسب الأكثر مبيعًا
      </span>
    </p>
  );
}
