import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconCompass, IconScale, IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { type ComponentType } from "react";

type IconType = ComponentType<{ size?: number; className?: string }>;

const PILLARS: {
  title: string;
  description: string;
  icon: IconType;
  accent: string;
}[] = [
  {
    title: "حرية الاستكشاف",
    description: "استخدم ساعاتك لتجربة مدربين ودورات — الاستكشاف لا يمنح شهادة بذاته.",
    icon: IconCompass,
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    title: "عدالة المدربين",
    description: "يُعرض كل مدرب بناءً على خبرته وصلته بهدفك — لا ترتيبات شعبية.",
    icon: IconScale,
    accent: "bg-sage-100 text-sage-700",
  },
  {
    title: "نور — المرشدة الذكية",
    description:
      "قلب المنصة: مقابلة، مساعد عائم، خطط، مراجعة بعد كل درس — أداة أساسية لا ميزة ثانوية.",
    icon: IconSparkle,
    accent: "bg-accent-purple-100 text-accent-purple-600",
  },
];

export function PrinciplesSection() {
  return (
    <section id="principles" className="py-20 lg:py-28">
      <Container>
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <IconSparkle size={18} className="text-gold-500" />
            <p className="text-xs font-semibold tracking-wide text-sage-600">المبادئ</p>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-navy-900 lg:text-4xl">نموذجٌ مبنيٌّ على الإنصاف</h2>
          <p className="mt-3 text-pretty text-foreground-secondary">
            ثلاثة مبادئ تحكم كل قرار في المنصة — من عرض المدربين إلى توجيهك.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} padding="md" className="hover:shadow-md">
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  pillar.accent,
                )}
              >
                <pillar.icon size={22} />
              </span>
              <h3 className="mt-5 text-base font-semibold text-navy-900">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">{pillar.description}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
