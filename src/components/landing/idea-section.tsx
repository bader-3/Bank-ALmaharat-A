import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconCompass, IconHourglass, IconInfinity, IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const BENEFITS = [
  {
    icon: IconHourglass,
    title: "رصيد في المحفظة",
    description: "تشتري ساعاتًا — لا دورة كاملة ولا مدربًا محددًا مسبقًا.",
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    icon: IconCompass,
    title: "استكشف بحرية",
    description: "جرّب مدربين ودورات بتكلفة أقل حتى تجد من يناسب أسلوبك.",
    accent: "bg-sage-100 text-sage-700",
  },
  {
    icon: IconInfinity,
    title: "أكمل للشهادة",
    description: "الشهادة تُمنح فقط بعد إتمام جميع متطلبات الدورة مع المدرب المناسب.",
    accent: "bg-accent-purple-100 text-accent-purple-600",
  },
] as const;

const ALLOCATIONS = [
  { course: "تحليل البيانات", hours: "٤", width: "w-[42%]", color: "bg-sage-500" },
  { course: "مهارات العرض", hours: "٢", width: "w-[22%]", color: "bg-accent-blue-500" },
  { course: "أساسيات التحليل", hours: "٣", width: "w-[32%]", color: "bg-gold-400" },
] as const;

export function IdeaSection() {
  return (
    <section id="idea" className="py-20 lg:py-28">
      <Container>
        <Card padding="lg" className="overflow-hidden">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <div className="flex items-center gap-2">
                <IconSparkle size={18} className="text-gold-500" />
                <p className="text-xs font-semibold tracking-wide text-sage-600">الفكرة</p>
              </div>
              <h2 className="mt-4 text-3xl font-bold leading-snug text-navy-900 lg:text-4xl">
                لا تشترِ دورةً كاملة.
                <br />
                اشترِ <span className="text-sage-600">وقتًا</span>، واستثمره حيث تشاء.
              </h2>
              <p className="mt-4 max-w-md text-pretty leading-relaxed text-foreground-secondary">
                في المنصات التقليدية تدفع مقدّمًا مقابل دورةٍ قد لا تناسبك. هنا،
                تشتري رصيدًا في محفظتك، تستكشف بحرية، ثم تُكمل المسار مع من يناسبك.
              </p>
            </div>

            <IdeaWalletVisual />
          </div>

          <div className="my-10 h-px bg-border/60" />

          <div className="grid gap-4 sm:grid-cols-3">
            {BENEFITS.map((item) => (
              <Card key={item.title} padding="md" variant="plain" className="group hover:shadow-md">
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-105",
                    item.accent,
                  )}
                >
                  <item.icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{item.description}</p>
              </Card>
            ))}
          </div>
        </Card>
      </Container>
    </section>
  );
}

function IdeaWalletVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <Card padding="md" className="relative overflow-hidden shadow-md">
        <div className="-mx-6 -mt-6 mb-5 bg-navy-900 px-6 py-5 lg:-mx-7 lg:-mt-7 lg:px-7">
          <p className="text-xs font-semibold text-gold-400">محفظتك التعليمية</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">١٠</span>
            <span className="text-sm text-white/60">ساعات متاحة</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">توزيع مرن</span>
            <span className="text-xs text-foreground-muted">٣ دورات نشطة</span>
          </div>

          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-background-muted">
            {ALLOCATIONS.map((item) => (
              <div key={item.course} className={cn(item.width, item.color)} />
            ))}
          </div>

          <ul className="mt-4 space-y-2">
            {ALLOCATIONS.map((item) => (
              <li
                key={item.course}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background-subtle/60 px-4 py-3"
              >
                <span className="text-sm font-semibold text-navy-900">{item.course}</span>
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium tabular-nums text-foreground-secondary ring-1 ring-border/60">
                  {item.hours} س
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-center text-xs text-foreground-muted">
          استكشف مدربين ودورات — ثم أكمل من اخترت للحصول على الشهادة.
        </p>
      </Card>
    </div>
  );
}
