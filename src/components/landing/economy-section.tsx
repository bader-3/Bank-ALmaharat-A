import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconCheck, IconSparkle } from "@/components/ui/icons";
import { SITE } from "@/lib/constants";

const TRADITIONAL = [
  "شراء دورةٍ كاملة من مدرب لم تجربه بعد",
  "خسارة الوقت والمال إن لم يناسبك الأسلوب",
  "صعوبة الانتقال بين المدربين بعد الشراء",
];

const BANK = [
  "رصيد ساعات في محفظتك — لا دورة محددة",
  "استكشاف عدة مدربين ودورات بتكلفة أقل",
  "إكمال الدورة كاملة مع المدرب المناسب — ثم الشهادة",
];

export function EconomySection() {
  return (
    <section id="economy" className="py-20 lg:py-28">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="flex items-center gap-2">
              <IconSparkle size={18} className="text-gold-500" />
              <p className="text-xs font-semibold tracking-wide text-sage-600">اقتصاد الساعات</p>
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-snug text-navy-900 lg:text-4xl">
              طريقة جديدة
              <br />
              لشراء <span className="text-sage-600">التعليم</span> واختيار المدرب.
            </h2>
            <p className="mt-4 max-w-md text-pretty leading-relaxed text-foreground-secondary">
              الساعات للاستكشاف والتعلّم — لا للحصول على شهادة دون إكمال الدورة.
              الشهادة تُمنح فقط بعد إتمام جميع متطلبات البرنامج.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card padding="md" variant="plain">
              <p className="text-xs font-semibold text-foreground-muted">المنصات التقليدية</p>
              <ul className="mt-5 space-y-4">
                {TRADITIONAL.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-foreground-secondary">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground-muted/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card padding="md" className="border-sage-200/70 bg-sage-50/50 shadow-sm">
              <p className="text-xs font-semibold text-sage-700">{SITE.name}</p>
              <ul className="mt-5 space-y-4">
                {BANK.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-navy-900">
                    <IconCheck size={16} className="mt-0.5 shrink-0 text-sage-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
