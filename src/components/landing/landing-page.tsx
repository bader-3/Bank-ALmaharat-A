import AppShellLayout from "@/components/layout/app-shell-layout";
import { SiteFooter } from "@/components/layout/site-footer";
import { CtaSection } from "@/components/landing/cta-section";
import { EconomySection } from "@/components/landing/economy-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IdeaSection } from "@/components/landing/idea-section";
import { NoorSection } from "@/components/landing/noor-section";
import { PrinciplesSection } from "@/components/landing/principles-section";

export function LandingPage() {
  return (
    <AppShellLayout footer={<SiteFooter />}>
      <HeroSection />
      <NoorSection />
      <IdeaSection />
      <HowItWorksSection />
      <PrinciplesSection />
      <EconomySection />
      <CtaSection />
    </AppShellLayout>
  );
}
