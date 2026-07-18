"use client";

import { ProfileSummary } from "@/components/interview/profile-summary";
import { Button } from "@/components/ui/button";
import { IconArrow, IconLogo, IconSparkle } from "@/components/ui/icons";
import { ROUTES, SITE } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { isInterviewCompleteForUser } from "@/lib/auth/interview-access";
import { useAuth } from "@/providers/auth-provider";
import { useWalletOptional } from "@/providers/wallet-provider";
import { getInterviewService } from "@/services/interview";
import type { LearningProfile } from "@/types/interview";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function WelcomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const wallet = useWalletOptional();
  const balance = wallet?.balance ?? 0;
  const walletLoading = wallet?.isLoading ?? false;
  const { isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    getInterviewService()
      .getProfile(user.id)
      .then(setProfile)
      .finally(() => setProfileLoading(false));
  }, [user]);

  if (isLoading || !isAuthenticated || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f0e7]">
        <p className="type-body text-navy-600">جاري التحميل…</p>
      </div>
    );
  }

  const firstName = user.fullName.split(" ")[0];
  const needsInterview = user ? !isInterviewCompleteForUser(user) : true;

  return (
    <div className="min-h-screen bg-[#f6f0e7] px-6 py-10 lg:px-14 lg:py-12" dir="rtl">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-500/10 text-sage-600 ring-1 ring-sage-500/15">
              <IconLogo size={18} />
            </span>
            <span className="type-card-title text-navy-900">{SITE.name}</span>
          </Link>
          <Link href="/" className="type-small text-navy-500 transition-colors hover:text-navy-900">
            ← العودة للرئيسية
          </Link>
        </div>

        <div className="rounded-md border border-[#ded2c4] bg-[#fffdf9] p-6 shadow-xs sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sage-200/60 bg-sage-50 text-sage-600">
            <IconSparkle size={24} />
          </div>

          <h1 className="type-section mt-6 text-balance text-navy-900">
            {needsInterview ? `أهلًا، ${firstName}!` : `مرحبًا مجددًا، ${firstName}`}
          </h1>

          <p className="type-lead mt-4 text-pretty text-navy-600">
            {needsInterview
              ? "حسابك جاهز. الخطوة التالية: مقابلة مع نور لفهم أهدافك واقتراح مدربين ودورات مناسبة."
              : "ملفك جاهز. اشترِ ساعات في محفظتك، استكشف مدربين ودورات، ثم أكمل مسارك للحصول على الشهادة."}
          </p>

          {profile && !needsInterview && (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border border-navy-800 bg-navy-900 px-5 py-4 text-[#f2eee6]">
                <p className="type-label text-gold-300/90">محفظتك</p>
                <p className="type-card-title mt-1">
                  {walletLoading ? "…" : formatHoursAndMinutes(balance)}
                </p>
                {balance === 0 && (
                  <p className="type-small mt-2 text-[#f2eee6]/70">
                    اشترِ رصيدًا في محفظتك لتجربة مدربين ودورات بأقل تكلفة.
                  </p>
                )}
              </div>

              <div className="rounded-md border border-[#ded2c4] bg-[#efe6da] p-5">
                <ProfileSummary profile={profile} />
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            {needsInterview ? (
              <Button href={ROUTES.interview} size="lg" fullWidth>
                ابدأ المقابلة الذكية
                <IconArrow />
              </Button>
            ) : (
              <>
                <Button href={ROUTES.platformHome} size="lg" fullWidth>
                  انتقل للموقع
                  <IconArrow />
                </Button>
                <Button href={ROUTES.courses} size="lg" fullWidth variant="secondary">
                  استكشف الدورات
                  <IconArrow />
                </Button>
                {balance === 0 && (
                  <Button href={ROUTES.wallet} size="lg" fullWidth variant="secondary">
                    اشترِ ساعات تعليمية
                  </Button>
                )}
              </>
            )}
            {!needsInterview && (
              <Button href={ROUTES.home} size="lg" fullWidth variant="secondary">
                العودة للرئيسية
              </Button>
            )}
          </div>

          <button
            type="button"
            onClick={() => logout().then(() => router.push("/"))}
            className="type-small mt-6 text-navy-400 transition-colors hover:text-navy-700"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
