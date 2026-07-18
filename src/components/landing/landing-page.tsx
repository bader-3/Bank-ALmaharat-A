import AppShellLayout from "@/components/layout/app-shell-layout";
import { SiteFooter } from "@/components/layout/site-footer";
import { CtaSection } from "@/components/landing/cta-section";
import { EconomySection } from "@/components/landing/economy-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IdeaSection } from "@/components/landing/idea-section";
import { NoorSection } from "@/components/landing/noor-section";
import { PrinciplesSection } from "@/components/landing/principles-section";
import { ProofStrip } from "@/components/landing/proof-strip";

/**
 * Homepage story arc (top → bottom):
 * 1. Promise  2. Proof  3. How it works  4. Idea
 * 5. Economy contrast  6. Noor  7. Principles  8. CTA
 */
export function LandingPage() {
  return (
    <AppShellLayout footer={<SiteFooter />}>
      <HeroSection />
      <ProofStrip />
      <HowItWorksSection />
      <IdeaSection />
      <EconomySection />
      <NoorSection />
      <PrinciplesSection />
      <CtaSection />
    </AppShellLayout>
  );
}
