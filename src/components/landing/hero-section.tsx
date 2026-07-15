import { Container } from "@/components/ui/container";
import { IconSparkle, IconWallet } from "@/components/ui/icons";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { HeroActions } from "@/components/landing/hero-actions";
import { cn } from "@/lib/cn";

const STATS = [
  { label: "تخصصًا", value: "١٣+", accent: "bg-accent-blue-100 text-accent-blue-600" },
  { label: "دورة", value: "٢٨", accent: "bg-sage-100 text-sage-700" },
  { label: "مدربًا", value: "متعدد", accent: "bg-gold-100 text-gold-700" },
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 pb-16 pt-28 lg:pb-24 lg:pt-36">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-2">
              <IconWallet size={18} className="text-gold-500" />
              <p className="text-xs font-semibold tracking-wide text-sage-600">اقتصاد الساعات التعليمية</p>
            </div>

            <h1 className="mt-4 text-4xl font-bold leading-tight text-navy-900 lg:text-5xl">
              لا تشتري دورةً
              <br />
              <span className="text-sage-600">قبل أن تجد مدربك.</span>
            </h1>

            <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-foreground-secondary">
              اشترِ رصيدًا من الساعات في محفظتك، استكشف مدربين ودورات بأقل تكلفة،
              ثم أكمل مسارك مع من يناسبك —{" "}
              <span className="font-medium text-accent-purple-700">نور</span> ترافقك في
              كل خطوة، والشهادة بعد إتمام الدورة كاملة.
            </p>

            <HeroActions />

            <div className="mt-10 grid grid-cols-3 gap-3">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-surface px-4 py-4 shadow-sm"
                >
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold",
                      stat.accent,
                    )}
                  >
                    <IconSparkle size={16} />
                  </span>
                  <p className="mt-3 text-2xl font-bold text-navy-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-foreground-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:ps-4">
            <HeroMockup />
          </div>
        </div>
      </Container>
    </section>
  );
}
