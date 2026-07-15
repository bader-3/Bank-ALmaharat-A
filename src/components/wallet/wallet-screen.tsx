"use client";

import { PackageCard } from "@/components/wallet/package-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  IconClock,
  IconSparkle,
  IconWallet,
} from "@/components/ui/icons";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import {
  HOUR_PACKAGES,
  getRecommendedPackageId,
} from "@/lib/wallet/packages";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { getInterviewService } from "@/services/interview";
import type { LearningProfile } from "@/types/interview";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function WalletScreen() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return");
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  useRequireAuth();
  const { balance, stats, isLoading: walletLoading, purchasePackage } = useWallet();

  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    getInterviewService()
      .getProfile(user.id)
      .then(setProfile);
  }, [user]);

  if (authLoading || !isAuthenticated || !user) {
    return (
      <Container className="py-24">
        <p className="text-center text-foreground-muted">جاري التحميل…</p>
      </Container>
    );
  }

  const recommendedId = getRecommendedPackageId(profile?.answers);
  const totalPurchased = stats?.totalPurchased ?? 0;
  const totalUsed = stats?.totalUsed ?? 0;
  const usagePercent =
    totalPurchased > 0 ? Math.min(100, Math.round((totalUsed / totalPurchased) * 100)) : 0;
  const recentPurchases = stats?.purchases.slice(0, 3) ?? [];

  async function handlePurchase(packageId: string) {
    const pkg = HOUR_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;

    setErrorMessage("");
    setSuccessMessage("");
    setPurchasingId(packageId);

    const result = await purchasePackage(pkg);
    setPurchasingId(null);

    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage(
      `تمت إضافة ${formatHoursAndMinutes(result.hoursAdded)} إلى محفظتك. رصيدك الآن ${formatHoursAndMinutes(result.newBalance)}.`,
    );
  }

  return (
    <Container className="py-10 lg:py-14">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2">
          <IconWallet size={18} className="text-gold-500" />
          <p className="text-xs font-semibold tracking-wide text-sage-600">اقتصاد الساعات</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">محفظة الساعات</h1>
        <p className="mt-2 text-pretty text-foreground-secondary">
          اشترِ رصيدًا من الساعات — لا دورة كاملة. استكشف مدربين ودورات بحرية،
          ثم أكمل مسارك للحصول على الشهادة.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="الرصيد الحالي"
          value={walletLoading ? "…" : formatHoursAndMinutes(balance, true)}
          icon={<IconWallet size={20} />}
          accent="gold"
        />
        <StatCard
          label="إجمالي المشترى"
          value={formatHoursAndMinutes(totalPurchased, true)}
          icon={<IconClock size={20} />}
          accent="blue"
        />
        <StatCard
          label="المستخدم"
          value={formatHoursAndMinutes(totalUsed, true)}
          icon={<IconClock size={20} />}
          accent="orange"
        />
        <StatCard
          label="عمليات الشراء"
          value={`${(stats?.purchases.length ?? 0).toLocaleString("ar-SA")}`}
          icon={<IconSparkle size={20} />}
          accent="purple"
        />
      </div>

      <Card padding="lg" className="mt-5 overflow-hidden border-navy-800/10 bg-navy-900 text-white">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold-400">رصيدك المتاح</p>
            <p className="mt-2 text-4xl font-bold tabular-nums">
              {walletLoading ? "…" : formatHoursAndMinutes(balance)}
            </p>
          </div>
          {returnTo && (
            <Button
              variant="secondary"
              size="sm"
              href={returnTo}
              className="border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              العودة للدورة
            </Button>
          )}
        </div>

        {totalPurchased > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white/60">استخدام الساعات</span>
              <span className="font-semibold text-gold-400">{usagePercent}٪</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold-400 transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/50">
              {formatHoursAndMinutes(totalUsed)} من {formatHoursAndMinutes(totalPurchased)}
            </p>
          </div>
        )}
      </Card>

      {profile && (
        <p className="mt-6 text-sm text-foreground-secondary">
          بناءً على ملفك التعليمي، نرشّح لك باقة تناسب أهدافك — دون إلزام.
        </p>
      )}

      {successMessage && (
        <p className="mt-6 rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-800">
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <section className="mt-10">
        <div className="flex items-center gap-2">
          <IconSparkle size={18} className="text-gold-500" />
          <h2 className="text-lg font-semibold text-navy-900">باقات الساعات</h2>
        </div>
        <p className="mt-1 text-sm text-foreground-secondary">
          اختر الباقة المناسبة — الشراء تجريبي بدون دفع حقيقي.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {HOUR_PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              recommended={pkg.id === recommendedId}
              purchasing={purchasingId === pkg.id}
              onPurchase={() => handlePurchase(pkg.id)}
            />
          ))}
        </div>
      </section>

      {recentPurchases.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy-900">آخر العمليات</h2>
          <ul className="mt-4 space-y-3">
            {recentPurchases.map((purchase) => (
              <li key={purchase.id}>
                <Card padding="md" className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-navy-900">{purchase.packageName}</p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {new Date(purchase.purchasedAt).toLocaleDateString("ar-SA", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-semibold text-sage-600">
                      +{formatHoursAndMinutes(purchase.hours, true)}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {purchase.price.toLocaleString("ar-SA")} ر.س
                    </p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button href={ROUTES.courses} variant="secondary" size="lg">
          استكشف الدورات
        </Button>
        {!user.interviewCompleted && (
          <Button href={ROUTES.interview} variant="ghost" size="lg">
            أكمل ملفك أولًا
          </Button>
        )}
      </div>

      {returnTo && successMessage && (
        <div className="mt-4 text-center">
          <Button href={returnTo} size="lg">
            متابعة إلى الدورة
          </Button>
        </div>
      )}
    </Container>
  );
}

type StatAccent = "gold" | "blue" | "orange" | "purple";

const statStyles: Record<StatAccent, { card: string; icon: string }> = {
  gold: { card: "border-gold-100 bg-gold-50/60", icon: "bg-gold-100 text-gold-700" },
  blue: { card: "border-accent-blue-100 bg-accent-blue-50/60", icon: "bg-accent-blue-100 text-accent-blue-600" },
  orange: { card: "border-accent-orange-100 bg-accent-orange-50/60", icon: "bg-accent-orange-100 text-accent-orange-600" },
  purple: { card: "border-accent-purple-100 bg-accent-purple-50/60", icon: "bg-accent-purple-100 text-accent-purple-600" },
};

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: StatAccent;
}) {
  const styles = statStyles[accent];
  return (
    <Card padding="md" className={styles.card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground-muted">{label}</p>
          <p className="mt-2 text-xl font-bold text-navy-900">{value}</p>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", styles.icon)}>
          {icon}
        </span>
      </div>
    </Card>
  );
}
