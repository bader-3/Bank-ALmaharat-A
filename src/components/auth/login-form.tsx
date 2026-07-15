"use client";

import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthShell } from "@/components/auth/auth-shell";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGuestOnly } from "@/hooks/use-auth-redirect";
import { hasFieldErrors, validateLogin } from "@/lib/validators/auth";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  useGuestOnly();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const input = { email, password };
    const errors = validateLogin(input);
    setFieldErrors(errors);

    if (hasFieldErrors(errors)) return;

    setIsSubmitting(true);
    const result = await login(input);
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    router.push("/welcome");
  }

  return (
    <AuthShell
      eyebrow="الحساب"
      title="تسجيل الدخول"
      description="تابع من حيث توقّفت."
      footer={
        <p>
          ليس لديك حساب؟{" "}
          <Link href="/register">إنشاء حساب</Link>
        </p>
      }
    >
      <div className="space-y-5">
        <SocialAuthButtons disabled={isSubmitting} onError={setFormError} />

        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            placeholder="name@example.com"
            dir="ltr"
            className="text-left"
          />

          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "جاري تسجيل الدخول…" : "تسجيل الدخول بالبريد"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
