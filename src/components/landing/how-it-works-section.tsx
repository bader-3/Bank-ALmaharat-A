import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const STEPS = [
  {
    number: "01",
    title: "مقابلة مع نور",
    description:
      "محادثة قصيرة تفهم أهدافك ومستواك ووقتك، وتقترح المدربين والدورات الأنسب لك.",
    card: "border-accent-purple-100 bg-accent-purple-50/60",
    badge: "bg-accent-purple-100 text-accent-purple-600",
  },
  {
    number: "02",
    title: "اشترِ ساعات",
    description: "رصيد يُضاف إلى محفظتك — بلا اشتراك شهري وبلا شراء دورة كاملة مسبقًا.",
    card: "border-accent-blue-100 bg-accent-blue-50/60",
    badge: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    number: "03",
    title: "استكشف بحرية",
    description: "جرّب مدربين ودورات مختلفة بساعات قليلة حتى تجد من يناسب أسلوب تعلمك.",
    card: "border-sage-100 bg-sage-50/60",
    badge: "bg-sage-100 text-sage-700",
  },
  {
    number: "04",
    title: "أكمل واستحق الشهادة",
    description:
      "واصل مع المدرب المناسب حتى إتمام الدورة كاملة — الشهادة لا تُمنح إلا بعد الإكمال.",
    card: "border-gold-100 bg-gold-50/60",
    badge: "bg-gold-100 text-gold-700",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-border/60 bg-background-subtle/40 py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2">
            <IconSparkle size={18} className="text-gold-500" />
            <p className="text-xs font-semibold tracking-wide text-sage-600">كيف يعمل</p>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-navy-900 lg:text-4xl">من المقابلة إلى الشهادة</h2>
          <p className="mt-3 text-pretty text-foreground-secondary">
            نموذج يغيّر طريقة شراء التعليم وطريقة اختيار المدرب — بخطوات واضحة.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.number}>
              <Card padding="md" className={cn("h-full", step.card)}>
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold shadow-sm",
                    step.badge,
                  )}
                >
                  {step.number}
                </span>
                <h3 className="mt-4 text-base font-semibold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{step.description}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
