import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  IconBook,
  IconCompass,
  IconPath,
  IconSparkle,
  IconTarget,
} from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { type ComponentType } from "react";

type IconType = ComponentType<{ size?: number; className?: string }>;

const NOOR_SERVICES: {
  title: string;
  description: string;
  phase: string;
  icon: IconType;
  accent: string;
}[] = [
  {
    title: "المقابلة الذكية",
    description: "جلسة تعرّف تفهم أهدافك ومستواك ووقتك — وتبني ملفك التعليمي الأول.",
    phase: "البداية",
    icon: IconTarget,
    accent: "bg-accent-purple-100 text-accent-purple-600",
  },
  {
    title: "المساعد العائم",
    description: "مرافقة في كل صفحة: دورات، محفظة، مسارك — بمعرفة كاملة بالمنصة.",
    phase: "طوال الرحلة",
    icon: IconSparkle,
    accent: "bg-gold-100 text-gold-700",
  },
  {
    title: "بناء الخطة",
    description: "مقابلة منظمة → اختيار دورات حقيقية → مسودة خطة → أهداف يومية.",
    phase: "التنظيم",
    icon: IconPath,
    accent: "bg-sage-100 text-sage-700",
  },
  {
    title: "جلسة المراجعة",
    description: "بعد كل درس: أسئلة، توضيح، واختبار قصير — قبل الانتقال للتالي.",
    phase: "بعد كل درس",
    icon: IconBook,
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    title: "التكيّف الذكي",
    description: "تقترح تعديلات على خطتك حسب تقدّمك — لا تبقى على مسار جامد.",
    phase: "مع التقدّم",
    icon: IconCompass,
    accent: "bg-navy-100 text-navy-700",
  },
];

const CHAT_PREVIEW = [
  { role: "ai" as const, text: "أهلًا! أنا نور — مرشدتك في بنك المهارات. كيف أساعدك؟" },
  { role: "user" as const, text: "أبي دورة في العقود للأعمال" },
  {
    role: "ai" as const,
    text: "«العقود للأعمال — مبادئ» مناسبة للمبتدئين (7:00 س) مع المحامية نجلاء الحارثي. تفاصيلها في /courses/contracts-101",
  },
];

export function NoorSection() {
  return (
    <section
      id="noor"
      className="relative overflow-hidden border-y border-border/60 bg-[linear-gradient(165deg,rgb(248_250_252)_0%,rgb(237_233_254/0.35)_45%,rgb(240_253_244/0.5)_100%)] py-20 lg:py-28"
    >
      <div
        className="pointer-events-none absolute -start-24 top-16 h-72 w-72 rounded-full bg-accent-purple-200/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -end-16 bottom-8 h-64 w-64 rounded-full bg-sage-200/40 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-purple-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-accent-purple-700 shadow-sm backdrop-blur-sm">
              <IconSparkle size={14} />
              قلب المنصة — ليست ميزة ثانوية
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-snug text-navy-900 lg:text-4xl">
              <span className="text-accent-purple-600">نور</span> مرشدتك الذكية
              <br />
              في كل خطوة من رحلتك.
            </h2>

            <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-foreground-secondary">
              نور ليست chatbot في الزاوية — هي{" "}
              <strong className="font-semibold text-navy-900">أداة أساسية</strong> تربط
              المحفظة والدورات والمدربين والخطط. تعرف المنصة كاملة، وتبقى معك من
              المقابلة الأولى حتى الشهادة.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                "تعرف كل دورة ومدرب وباقة في المنصة — بلا اختراع",
                "مرافقة قبل التعلّم، أثناءه، وبعد كل درس",
                "جزء من المنتج — مثل المحفظة والمسار، لا إضافة اختيارية",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-sm text-foreground-secondary">
                  <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-500 text-[10px] font-bold text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <NoorChatMockup />
        </div>

        <div className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-sage-600">خدمات نور</p>
              <h3 className="mt-2 text-xl font-bold text-navy-900 lg:text-2xl">
                خمسة أدوار — منصة واحدة
              </h3>
            </div>
            <p className="max-w-md text-sm text-foreground-muted">
              للمتدرب: دليل واضح. للحكام: نور محور المنتج الذكي — لا مجرد واجهة دردشة.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {NOOR_SERVICES.map((service, index) => (
              <Card
                key={service.title}
                padding="md"
                className={cn(
                  "relative h-full border-white/80 bg-white/70 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md",
                  index === 1 && "ring-2 ring-gold-200/80",
                )}
              >
                {index === 1 && (
                  <span className="absolute -top-2.5 start-4 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    الأساس
                  </span>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                  {service.phase}
                </span>
                <span
                  className={cn(
                    "mt-3 flex h-11 w-11 items-center justify-center rounded-2xl",
                    service.accent,
                  )}
                >
                  <service.icon size={20} />
                </span>
                <h4 className="mt-4 text-sm font-semibold text-navy-900">{service.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-foreground-secondary">
                  {service.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function NoorChatMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        className="absolute -bottom-4 -start-4 z-10 hidden rounded-2xl border border-border/60 bg-surface px-4 py-3 shadow-lg sm:block"
        aria-hidden="true"
      >
        <p className="text-[10px] font-semibold text-foreground-muted">معرفة المنصة</p>
        <p className="mt-1 text-sm font-bold text-navy-900">٢٨ دورة · ١٤ مدرب</p>
      </div>

      <Card padding="sm" className="overflow-hidden p-0 shadow-lg ring-1 ring-accent-purple-100/80">
        <div className="flex items-center justify-between border-b border-border/50 bg-navy-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-purple-400 to-sage-500 text-sm font-bold text-white">
              ن
            </span>
            <div>
              <p className="text-sm font-semibold text-white">نور</p>
              <p className="text-[11px] text-white/55">مرشدة المنصة · متصلة</p>
            </div>
          </div>
          <span className="rounded-full bg-sage-500/20 px-2.5 py-1 text-[10px] font-semibold text-sage-300">
            AI
          </span>
        </div>

        <div className="space-y-3 bg-background-subtle/40 p-4">
          {CHAT_PREVIEW.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                message.role === "ai"
                  ? "rounded-ee-sm bg-white text-navy-900 shadow-sm ring-1 ring-border/50"
                  : "ms-auto rounded-es-sm bg-navy-900 text-white",
              )}
            >
              {message.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border/50 bg-surface px-4 py-3">
          <div className="h-9 flex-1 rounded-xl bg-background-muted px-3 text-xs leading-9 text-foreground-muted">
            اسأل نور عن دورة، محفظة، أو مسارك…
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
            <IconSparkle size={16} />
          </span>
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-foreground-muted">
        معاينة — نور متاحة في كل صفحة عبر الزر العائم وصفحة /noor
      </p>
    </div>
  );
}
