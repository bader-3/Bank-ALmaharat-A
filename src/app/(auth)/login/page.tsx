import { LoginForm } from "@/components/auth/login-form";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `تسجيل الدخول | ${SITE.name}`,
  description: `سجّل دخولك إلى ${SITE.name}.`,
};

export default function LoginPage() {
  return <LoginForm />;
}
