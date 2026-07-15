import type { InterviewAnswers } from "@/types/interview";
import type { HourPackage } from "@/types/wallet";

export const HOUR_PACKAGES: HourPackage[] = [
  {
    id: "explore",
    name: "باقة الاستكشاف",
    hours: 5,
    price: 89,
    description: "مثالية للاستكشاف — جرّب مدربًا أو درسًا دون التزام بدورة كاملة.",
    highlight: "للبداية",
  },
  {
    id: "standard",
    name: "باقة النمو",
    hours: 15,
    price: 229,
    description: "توازن جيد للاستكشاف والتعمّق — قبل أن تلتزم بإكمال دورة كاملة.",
  },
  {
    id: "intensive",
    name: "باقة التركيز",
    hours: 30,
    price: 399,
    description: "لمن يريد إكمال دورة كاملة — ساعات أكثر بسعر أوفر للساعة.",
    highlight: "أفضل قيمة",
  },
];

export function getRecommendedPackageId(answers?: InterviewAnswers): string {
  if (!answers) return "standard";

  switch (answers.budgetOrHours) {
    case "explore":
      return "explore";
    case "5-10h":
      return "explore";
    case "10-20h":
      return "standard";
    case "20+h":
      return "intensive";
    default:
      return "standard";
  }
}

export function getPackageById(id: string): HourPackage | undefined {
  return HOUR_PACKAGES.find((pkg) => pkg.id === id);
}

export function formatPrice(sar: number) {
  return `${sar.toLocaleString("ar-SA")} ر.س`;
}
