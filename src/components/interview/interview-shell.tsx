import AuthShellLayout from "@/components/layout/auth-shell-layout";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconSparkle } from "@/components/ui/icons";
import { type ReactNode } from "react";

interface InterviewShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const STEPS = [
  {
    title: "تحدّث بحرّية",
    description: "أجب بالعربية كما تتحدث — لا نماذج جامدة ولا خانات معقدة.",
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    title: "أسئلة متتابعة",
    description: "نور يطرح سؤالًا واحدًا في كل مرة ويتعمّق حسب إجاباتك.",
    accent: "bg-sage-100 text-sage-700",
  },
  {
    title: "فهم أهدافك",
    description: "نستكشف خبرتك، وقتك، وطموحك المهني أو التعليمي.",
    accent: "bg-gold-100 text-gold-700",
  },
  {
    title: "ملفك وتوصياتك",
    description: "نحوّل المحادثة إلى ملف يقترح مدربين ودورات مناسبة لأهدافك.",
    accent: "bg-accent-blue-100 text-accent-blue-600",
  },
  {
    title: "جاهز للاستكشاف",
    description: "بعد المقابلة: اشترِ ساعات في محفظتك وجرّب مدربين ودورات بحرية.",
    accent: "bg-gold-100 text-gold-700",
  },
] as const;

export function InterviewShell({ eyebrow, title, description, children }: InterviewShellProps) {
  return (
    <AuthShellLayout>
      <Container className="py-10 lg:py-14">
        <div
          dir="ltr"
          className="flex flex-col lg:grid lg:grid-cols-[1fr_minmax(0,24rem)] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-10 xl:grid-cols-[1fr_minmax(0,28rem)] xl:gap-x-12"
        >
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

          <div dir="rtl" className="order-3 mt-8 grid gap-3 sm:grid-cols-2 lg:order-none lg:col-start-1 lg:row-start-2 lg:mt-8 lg:grid-cols-1 lg:content-start">
            {STEPS.map((item) => (
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

          <div dir="rtl" className="order-2 mt-8 lg:col-start-2 lg:row-start-2 lg:mt-8">
            <Card className="flex min-h-[32rem] flex-col overflow-hidden border-border/60 shadow-sm">
              {children}
            </Card>
          </div>
        </div>
      </Container>
    </AuthShellLayout>
  );
}
