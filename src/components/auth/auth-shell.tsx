import AuthShellLayout from "@/components/layout/auth-shell-layout";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconSparkle } from "@/components/ui/icons";
import { type ReactNode } from "react";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}

const HIGHLIGHTS = [
  {
    title: "اقتصاد الساعات",
    description: "رصيد في المحفظة — لا دورة كاملة ولا اشتراكًا شهريًا.",
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    title: "محفظتك الرقمية",
    description: "اشترِ ساعات وتابع رصيدك واستخدامك — للاستكشاف والتعلّم.",
    accent: "bg-gold-100 text-gold-700",
  },
  {
    title: "المقابلة الذكية",
    description: "نور تفهم أهدافك وتقترح مدربين ودورات مناسبة قبل أن تبدأ.",
    accent: "bg-sage-100 text-sage-700",
  },
  {
    title: "استكشاف بحرية",
    description: "جرّب مدربين ودورات بتكلفة أقل — حتى تجد من يناسبك.",
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    title: "إكمال وشهادة",
    description: "الشهادة تُمنح بعد إتمام جميع متطلبات الدورة مع المدرب الذي اخترته.",
    accent: "bg-gold-100 text-gold-700",
  },
] as const;

export function AuthShell({
  eyebrow = "الحساب",
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <AuthShellLayout>
      <Container className="py-10 lg:py-14">
        <div
          dir="ltr"
          className="flex flex-col lg:grid lg:grid-cols-[1fr_minmax(0,24rem)] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-10 xl:grid-cols-[1fr_minmax(0,28rem)] xl:gap-x-12"
        >
          {/* العنوان — يمين على الشاشات الكبيرة */}
          <div dir="rtl" className="order-1 lg:col-start-2 lg:row-start-1">
            <div className="flex items-center gap-2">
              <IconSparkle size={18} className="text-gold-500" />
              <p className="text-xs font-semibold tracking-wide text-sage-600">{eyebrow}</p>
            </div>

            <h1 className="mt-3 text-3xl font-bold text-balance text-navy-900 lg:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-foreground-secondary">{description}</p>
          </div>

          {/* البطاقات — يسار، موازية لبطاقة التسجيل */}
          <div dir="rtl" className="order-3 mt-8 grid gap-3 sm:grid-cols-2 lg:order-none lg:col-start-1 lg:row-start-2 lg:mt-8 lg:grid-cols-1 lg:content-start">
            {HIGHLIGHTS.map((item) => (
              <Card key={item.title} padding="md" className="border-border/60">
                <span
                  className={`inline-flex rounded-xl px-2.5 py-1 text-xs font-semibold ${item.accent}`}
                >
                  {item.title}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>

          {/* بطاقة التسجيل */}
          <div dir="rtl" className="order-2 mt-8 max-w-md lg:order-none lg:col-start-2 lg:row-start-2 lg:mt-8 lg:max-w-none">
            <Card className="border-border/60 shadow-sm">{children}</Card>

            <div className="mt-6 text-center text-sm text-foreground-secondary [&_a]:font-medium [&_a]:text-sage-600 [&_a]:underline-offset-4 hover:[&_a]:underline">
              {footer}
            </div>
          </div>
        </div>
      </Container>
    </AuthShellLayout>
  );
}
