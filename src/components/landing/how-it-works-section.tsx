import { Container } from "@/components/ui/container";
import { IconSparkle } from "@/components/ui/icons";

const STEPS = [
  {
    number: "01",
    title: "مقابلة مع نور",
    description:
      "محادثة قصيرة تفهم أهدافك ومستواك ووقتك، وتقترح المدربين والدورات الأنسب لك.",
  },
  {
    number: "02",
    title: "اشترِ ساعات",
    description: "رصيد يُضاف إلى محفظتك — بلا اشتراك شهري وبلا شراء دورة كاملة مسبقًا.",
  },
  {
    number: "03",
    title: "استكشف بحرية",
    description: "جرّب مدربين ودورات مختلفة بساعات قليلة حتى تجد من يناسب أسلوب تعلمك.",
  },
  {
    number: "04",
    title: "أكمل واستحق الشهادة",
    description:
      "واصل مع المدرب المناسب حتى إتمام الدورة كاملة — الشهادة لا تُمنح إلا بعد الإكمال.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-border/60 py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2">
            <IconSparkle size={18} className="text-gold-500" />
            <p className="text-xs font-semibold tracking-wide text-sage-600">كيف يعمل</p>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-navy-900 lg:text-4xl">أربع خطوات واضحة</h2>
          <p className="mt-3 text-pretty text-foreground-secondary">
            من مقابلة نور إلى الشهادة — بلا اشتراك شهري وبلا شراء دورة كاملة مسبقًا.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.number}>
              <div className="h-full rounded-2xl border border-border/70 bg-surface px-5 py-6">
                <span className="text-sm font-bold tabular-nums text-gold-600">{step.number}</span>
                <h3 className="mt-3 text-base font-semibold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
