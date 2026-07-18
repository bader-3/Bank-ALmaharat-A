import { Container } from "@/components/ui/container";

const STATS = [
  { label: "تخصصًا", value: "١٣+" },
  { label: "دورة جاهزة", value: "٢٨" },
  { label: "مدربين", value: "متعددون" },
] as const;

/** Quiet trust strip — sits after the hero, not inside it. */
export function ProofStrip() {
  return (
    <section className="border-b border-border/60 bg-background-subtle/50 py-8" aria-label="لمحة عن المنصة">
      <Container>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-between sm:gap-0">
          {STATS.map((stat) => (
            <li key={stat.label} className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-navy-900">{stat.value}</span>
              <span className="text-sm text-foreground-muted">{stat.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
