import { Container } from "@/components/ui/container";
import { IconWallet } from "@/components/ui/icons";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { HeroActions } from "@/components/landing/hero-actions";
import { SITE } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 pb-16 pt-24 lg:pb-24 lg:pt-32">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <p className="text-2xl font-bold tracking-tight text-navy-900 lg:text-3xl">{SITE.name}</p>
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-sage-600">
              <IconWallet size={16} className="text-gold-500" />
              {SITE.tagline}
            </p>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-navy-900 lg:text-5xl">
              لا تشتري دورةً
              <br />
              <span className="text-sage-600">قبل أن تجد مدربك.</span>
            </h1>

            <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-foreground-secondary">
              اشترِ رصيد ساعات، استكشف المدربين بحرية، وأكمل مسارك للحصول على الشهادة —
              ونور ترافقك في كل خطوة.
            </p>

            <HeroActions />
          </div>

          <div className="lg:ps-4">
            <HeroMockup />
          </div>
        </div>
      </Container>
    </section>
  );
}
