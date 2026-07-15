import { IconCheck, IconSparkle } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

const DEMO_BALANCE = 10;
const DEMO_PURCHASED = 15;
const usagePercent = Math.min(
  100,
  Math.round(((DEMO_PURCHASED - DEMO_BALANCE) / DEMO_PURCHASED) * 100),
);

/** Static product preview for the landing hero — no wallet/auth hooks. */
export function HeroMockup() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgb(45_106_79/0.08)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-md">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <span className="text-sm font-semibold text-navy-900">لوحة التعلّم</span>
          <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700 ring-1 ring-gold-200">
            {DEMO_BALANCE.toLocaleString("ar-SA")} ساعات
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-2xl bg-navy-900 px-5 py-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gold-400">رصيدك التعليمي</p>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
                معاينة
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tabular-nums">
                {DEMO_BALANCE.toLocaleString("ar-SA")}
              </span>
              <span className="text-sm text-white/60">ساعات متاحة</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold-400"
                style={{ width: `${Math.max(usagePercent, 8)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gold-100 bg-gold-50/60 p-4">
              <div className="flex items-center gap-2">
                <IconSparkle size={16} className="text-gold-600" />
                <span className="text-xs font-semibold text-gold-700">توصية</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-navy-900">تحليل البيانات</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background-subtle p-4">
              <span className="text-xs font-semibold text-foreground-muted">مسارك</span>
              <ol className="mt-2 space-y-1.5">
                {PATH.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                        item.active
                          ? "bg-sage-500 text-white"
                          : "border border-border bg-surface text-foreground-muted",
                      )}
                    >
                      {item.step}
                    </span>
                    <span
                      className={cn(
                        "truncate text-xs",
                        item.active ? "font-semibold text-navy-900" : "text-foreground-secondary",
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border/60 bg-surface p-4 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-blue-100 text-accent-blue-600">
          <IconCheck size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy-900">مقدمة في تحليل البيانات</p>
          <p className="mt-0.5 text-xs text-foreground-muted">د. سارة المنصور</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background-muted">
              <div className="h-full w-[62%] rounded-full bg-sage-500" />
            </div>
            <span className="text-xs tabular-nums text-foreground-secondary">٦٢٪</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const PATH = [
  { step: "١", label: "أساسيات", active: false },
  { step: "٢", label: "تحليل البيانات", active: true },
  { step: "٣", label: "العرض", active: false },
];
