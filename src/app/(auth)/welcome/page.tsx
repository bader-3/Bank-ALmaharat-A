import { WelcomeScreen } from "@/components/auth/welcome-screen";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `مرحبًا بك | ${SITE.name}`,
  description: `تم إنشاء حسابك بنجاح في ${SITE.name}.`,
};

export default function WelcomePage() {
  return <WelcomeScreen />;
}
