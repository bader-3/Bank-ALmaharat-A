import { RegisterForm } from "@/components/auth/register-form";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `إنشاء حساب | ${SITE.name}`,
  description: `أنشئ حسابك وابدأ رحلتك في ${SITE.name}.`,
};

export default function RegisterPage() {
  return <RegisterForm />;
}
