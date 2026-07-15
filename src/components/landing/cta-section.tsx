import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconSparkle } from "@/components/ui/icons";
import { CtaActions } from "@/components/landing/cta-actions";

export function CtaSection() {
  return (
    <section id="get-started" className="border-t border-border/60 py-20 lg:py-28">
      <Container>
        <Card
          padding="lg"
          className="mx-auto max-w-3xl border-sage-200/60 bg-sage-50/40 text-center shadow-sm"
        >
          <div className="mx-auto flex max-w-lg flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-100 text-gold-600">
              <IconSparkle size={22} />
            </span>
            <p className="mt-4 text-xs font-semibold tracking-wide text-sage-600">ابدأ الآن</p>

            <h2 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">
              وقتك يبدأ
              <span className="text-sage-600"> الآن</span>.
            </h2>

            <p className="mt-4 max-w-md text-pretty leading-relaxed text-foreground-secondary">
              سجّل، أكمل مقابلة نور، اشترِ رصيدًا في محفظتك، واستكشف مدربين ودورات
              بحرية — ثم أكمل مسارك للحصول على الشهادة.
            </p>

            <CtaActions />
          </div>
        </Card>
      </Container>
    </section>
  );
}
