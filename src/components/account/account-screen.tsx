"use client";

import { LearningPlanCard } from "@/components/ai/learning-plan-card";
import { TrackingAdaptationPanel } from "@/components/account/tracking-adaptation-panel";
import { CourseCard } from "@/components/courses/course-card";
import { ProfileSummary } from "@/components/interview/profile-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  IconArrow,
  IconCheck,
  IconClock,
  IconCompass,
  IconHeart,
  IconSparkle,
  IconUser,
  IconWallet,
} from "@/components/ui/icons";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { getAiRecommendedCourses } from "@/lib/courses/ai-recommendations";
import { getCourseBySlug } from "@/lib/courses/mock-data";
import { formatPrice } from "@/lib/wallet/packages";
import { ROUTES } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { getFavoritesService } from "@/services/favorites";
import { getInterviewService } from "@/services/interview";
import { getLearningService } from "@/services/learning";
import { readPlanningSession } from "@/services/noor/mock-noor-storage";
import { getNoorService } from "@/services/noor";
import { withTimeout } from "@/lib/async/with-timeout";
import type { Course } from "@/types/course";
import type { Enrollment } from "@/types/learning";
import type { LearningProfile } from "@/types/interview";
import type { PlanningSession } from "@/types/noor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type AccountTab = "overview" | "active" | "completed" | "favorites" | "purchases";

const TABS: { id: AccountTab; label: string }[] = [
  { id: "overview", label: "نظرة عامة" },
  { id: "active", label: "قيد التقدّم" },
  { id: "completed", label: "مكتملة" },
  { id: "favorites", label: "المفضلة" },
  { id: "purchases", label: "سجل الشراء" },
];

export function AccountScreen() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { isAuthenticated } = useRequireAuth();
  const { balance, stats, isLoading: walletLoading } = useWallet();
  const userId = user?.id;

  const [tab, setTab] = useState<AccountTab>("overview");
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [favoriteCourses, setFavoriteCourses] = useState<Course[]>([]);
  const [approvedSession, setApprovedSession] = useState<PlanningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError("");

    try {
      await withTimeout(
        (async () => {
          const userProfile = await getInterviewService().getProfile(userId);

          const [userEnrollments, favSlugs] = await Promise.all([
            getLearningService().getEnrollments(userId),
            getFavoritesService().list(userId),
          ]);

          // Local read first — avoids Firestore hanging the account page on mobile.
          let planningSession = readPlanningSession(userId);
          if (!planningSession) {
            try {
              planningSession = await withTimeout(
                getNoorService().getPlanningSession(userId),
                4_000,
                "مزامنة الخطة",
              );
            } catch {
              planningSession = null;
            }
          }

          setProfile(userProfile);
          setEnrollments(userEnrollments);
          setFavoriteCourses(
            favSlugs.map((slug) => getCourseBySlug(slug)).filter((c): c is Course => Boolean(c)),
          );
          setApprovedSession(planningSession?.status === "accepted" ? planningSession : null);
        })(),
        12_000,
        "تحميل الحساب",
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "تعذّر تحميل الحساب");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || isLoading) return;
    void load();
  }, [userId, isLoading, load]);

  const activeEnrollments = useMemo(
    () => enrollments.filter((e) => e.progress < 100),
    [enrollments],
  );
  const completedEnrollments = useMemo(
    () => enrollments.filter((e) => e.progress >= 100),
    [enrollments],
  );

  const recommended = useMemo(() => {
    try {
      return getAiRecommendedCourses(profile, 2);
    } catch {
      return [];
    }
  }, [profile]);
  const walletStats = stats ?? {
    balance: 0,
    totalPurchased: 0,
    totalUsed: 0,
    purchases: [],
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <Container className="py-24">
        <p className="text-center text-foreground-muted">جاري التحميل…</p>
      </Container>
    );
  }

  const usagePercent =
    walletStats.totalPurchased > 0
      ? Math.min(100, Math.round((walletStats.totalUsed / walletStats.totalPurchased) * 100))
      : 0;

  return (
    <Container className="py-10 lg:py-14">
      {loading && (
        <Card padding="md" className="mb-6 border-sage-200 bg-sage-50/50">
          <p className="text-center text-sm text-foreground-secondary">جاري تحميل بيانات حسابك…</p>
        </Card>
      )}

      {loadError && (
        <Card padding="md" className="mb-6 border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-800">تعذّر تحميل الحساب</p>
          <p className="mt-2 text-sm text-red-700">{loadError}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void load()}>
              إعادة المحاولة
            </Button>
            <Button href={ROUTES.interview} size="sm" variant="secondary">
              العودة للمقابلة
            </Button>
          </div>
        </Card>
      )}

      {!user.interviewCompleted && (
        <Card padding="md" className="mb-8 border-gold-200 bg-gold-50/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gold-800">أكمل ملفك التعليمي</p>
              <p className="mt-1 text-sm text-foreground-secondary">
                مقابلة قصيرة مع نور لاقتراح دورات ومدربين يناسبونك.
              </p>
            </div>
            <Button href={ROUTES.interview}>
              ابدأ المقابلة الذكية
              <IconArrow />
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-lg font-bold text-gold-700">
            {user.fullName.charAt(0)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <IconUser size={16} className="text-gold-500" />
              <p className="text-xs font-semibold tracking-wide text-sage-600">حساب المتدرب</p>
            </div>
            <h1 className="mt-1 text-3xl font-bold text-navy-900">{user.fullName}</h1>
            <p className="mt-1 text-sm text-foreground-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={ROUTES.wallet} variant="secondary" size="sm">
            <IconWallet size={16} />
            شحن الساعات
          </Button>
          <button
            type="button"
            onClick={() => logout().then(() => router.push("/"))}
            className="rounded-xl px-4 py-2 text-sm text-foreground-muted transition-colors hover:bg-background-subtle hover:text-foreground"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="الساعات المتبقية"
          value={formatHoursAndMinutes(balance, true)}
          unit="ساعة"
          icon={<IconWallet size={20} />}
          accent="gold"
        />
        <StatCard
          label="الساعات المستخدمة"
          value={formatHoursAndMinutes(walletStats.totalUsed, true)}
          unit="ساعة"
          icon={<IconClock size={20} />}
          accent="blue"
        />
        <StatCard
          label="قيد التقدّم"
          value={activeEnrollments.length.toLocaleString("ar-SA")}
          unit="دورة"
          icon={<IconCompass size={20} />}
          accent="green"
        />
        <StatCard
          label="المفضلة"
          value={favoriteCourses.length.toLocaleString("ar-SA")}
          unit="دورة"
          icon={<IconHeart size={20} filled />}
          accent="purple"
        />
      </div>

      <Card padding="md" className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground-muted">استهلاك الساعات</p>
            <p className="mt-1 text-sm text-foreground-secondary">
              استخدمت {formatHoursAndMinutes(walletStats.totalUsed)} من{" "}
              {formatHoursAndMinutes(walletStats.totalPurchased)} مشتراة
            </p>
          </div>
          <span className="text-xl font-bold text-sage-600">{usagePercent}٪</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-background-muted">
          <div
            className="h-full rounded-full bg-sage-500 transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-foreground-muted">
          <span>متبقٍ: {formatHoursAndMinutes(balance, true)}</span>
          <span>مكتملة: {completedEnrollments.length} دورة</span>
          <span>إجمالي التسجيلات: {enrollments.length}</span>
        </div>
      </Card>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all",
              tab === item.id
                ? "border-sage-500 bg-sage-500 text-white shadow-sm"
                : "border-border/70 bg-surface text-foreground-secondary hover:border-sage-300",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {tab === "overview" && (
            <>
              {approvedSession?.draft && <ApprovedPathCard session={approvedSession} />}

              {!loading && <TrackingAdaptationPanel userId={user.id} />}

              <Section title="دوراتي النشطة" empty="لا توجد دورات نشطة حاليًا.">
                {activeEnrollments.length === 0 ? null : (
                  <EnrollmentList enrollments={activeEnrollments.slice(0, 3)} />
                )}
                {activeEnrollments.length > 3 && (
                  <Button variant="secondary" size="sm" onClick={() => setTab("active")}>
                    عرض الكل ({activeEnrollments.length})
                  </Button>
                )}
              </Section>

              {recommended.length > 0 && (
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <IconSparkle size={18} className="text-gold-500" />
                    <h2 className="text-lg font-semibold text-navy-900">مقترح لك</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {recommended.map(({ course, reason }) => (
                      <CourseCard key={course.id} course={course} highlighted aiReason={reason} />
                    ))}
                  </div>
                </section>
              )}

              {profile?.learningPlan && <LearningPlanCard plan={profile.learningPlan} />}
            </>
          )}

          {tab === "active" && (
            <Section title="دورات قيد التقدّم" empty="لم تبدأ أو لم تُكمل أي دورة بعد.">
              {activeEnrollments.length > 0 && <EnrollmentList enrollments={activeEnrollments} />}
            </Section>
          )}

          {tab === "completed" && (
            <Section title="دورات مكتملة" empty="لم تُكمل أي دورة بعد — استمر!">
              {completedEnrollments.length > 0 && (
                <EnrollmentList enrollments={completedEnrollments} completed />
              )}
            </Section>
          )}

          {tab === "favorites" && (
            <Section title="المفضلة" empty="لم تضف دورات للمفضلة بعد.">
              {favoriteCourses.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {favoriteCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </Section>
          )}

          {tab === "purchases" && (
            <Section title="سجل شراء الساعات" empty="لم تشترِ ساعات بعد.">
              {walletStats.purchases.length > 0 && (
                <ul className="space-y-3">
                  {walletStats.purchases.map((purchase) => (
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
                          <p className="text-xs text-foreground-muted">{formatPrice(purchase.price)}</p>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card padding="md" className="border-gold-100 bg-gold-50/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gold-700">محفظة الساعات</p>
                <p className="mt-2 text-3xl font-bold text-navy-900 tabular-nums">
                  {walletLoading ? "…" : formatHoursAndMinutes(balance)}
                </p>
                <p className="mt-2 text-xs text-foreground-muted">
                  {formatHoursAndMinutes(walletStats.totalUsed, true)} مستخدمة ·{" "}
                  {formatHoursAndMinutes(walletStats.totalPurchased, true)} مشتراة
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
                <IconWallet size={20} />
              </span>
            </div>
            <Button href={ROUTES.wallet} size="sm" fullWidth className="mt-5">
              شحن المحفظة
            </Button>
          </Card>

          <Card padding="md">
            <p className="text-xs font-semibold text-foreground-muted">اختصارات</p>
            <ul className="mt-3 space-y-1">
              <QuickLink href={ROUTES.path} label="مساري" />
              <QuickLink href={ROUTES.favorites} label="المفضّلة" />
              <QuickLink href={ROUTES.activity} label="سجل التعلّم" />
              <QuickLink href={ROUTES.progress} label="إنجازاتي" />
              <QuickLink href={ROUTES.interview} label="مراجعة المقابلة الذكية" />
            </ul>
          </Card>

          {profile && (
            <Card padding="md">
              <div className="flex items-center gap-2">
                <IconSparkle size={18} className="text-gold-500" />
                <p className="text-xs font-semibold text-sage-600">ملفك التعليمي</p>
              </div>
              <div className="mt-4">
                <ProfileSummary profile={profile} showPlan={false} />
              </div>
            </Card>
          )}

          {favoriteCourses.length > 0 && tab !== "favorites" && (
            <Card padding="md">
              <div className="flex items-center gap-2">
                <IconHeart size={16} className="text-gold-600" filled />
                <p className="text-xs font-semibold text-foreground-muted">من المفضلة</p>
              </div>
              <ul className="mt-3 space-y-2">
                {favoriteCourses.slice(0, 3).map((course) => (
                  <li key={course.id}>
                    <Link
                      href={`${ROUTES.courses}/${course.slug}`}
                      className="text-sm text-foreground-secondary hover:text-sage-600"
                    >
                      {course.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {favoriteCourses.length > 3 && (
                <button
                  type="button"
                  onClick={() => setTab("favorites")}
                  className="mt-3 text-xs font-medium text-sage-600 hover:underline"
                >
                  عرض الكل
                </button>
              )}
            </Card>
          )}
        </aside>
      </div>
    </Container>
  );
}

function ApprovedPathCard({ session }: { session: PlanningSession }) {
  const draft = session.draft;
  if (!draft) return null;
  const courses = draft.courses
    .filter((course) => course.included)
    .sort((a, b) => a.order - b.order);

  return (
    <Card padding="lg" className="border-sage-200 bg-sage-50/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-sage-700" />
            <p className="text-xs font-semibold text-sage-700">المسار المعتمد</p>
          </div>
          <h2 className="mt-2 text-xl font-semibold text-navy-900">{draft.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">{draft.summary}</p>
        </div>
        <Badge variant="sage">
          {draft.totalWeeks} أسبوع · {draft.totalHours} ساعة
        </Badge>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {courses.map((course, index) => (
          <li
            key={course.courseSlug}
            className="flex items-center gap-3 rounded-xl border border-sage-200/70 bg-surface p-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-bold text-sage-700">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-navy-900">{course.title}</p>
              <p className="mt-1 text-xs text-foreground-muted">
                {course.lessons.filter((lesson) => lesson.included).length} درس ضمن الخطة
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button href={ROUTES.goals} size="sm">
          متابعة أهداف المسار
        </Button>
        <Button href={ROUTES.noor} variant="secondary" size="sm">
          مراجعة الخطة مع نور
        </Button>
      </div>
    </Card>
  );
}

type StatAccent = "gold" | "blue" | "green" | "purple";

const statStyles: Record<StatAccent, { card: string; icon: string }> = {
  gold: { card: "border-gold-100 bg-gold-50/60", icon: "bg-gold-100 text-gold-700" },
  blue: { card: "border-accent-blue-100 bg-accent-blue-50/60", icon: "bg-accent-blue-100 text-accent-blue-600" },
  green: { card: "border-sage-100 bg-sage-50/60", icon: "bg-sage-100 text-sage-700" },
  purple: { card: "border-accent-purple-100 bg-accent-purple-50/60", icon: "bg-accent-purple-100 text-accent-purple-600" },
};

function StatCard({
  label,
  value,
  unit,
  icon,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  icon: ReactNode;
  accent: StatAccent;
}) {
  const styles = statStyles[accent];
  return (
    <Card padding="md" className={styles.card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground-muted">{label}</p>
          <p className="mt-2 text-xl font-bold text-navy-900">
            {value}{" "}
            <span className="text-sm font-normal text-foreground-muted">{unit}</span>
          </p>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", styles.icon)}>
          {icon}
        </span>
      </div>
    </Card>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const isEmpty = !children;

  return (
    <section>
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      {isEmpty ? (
        <Card padding="lg" className="mt-4 text-center">
          <p className="text-sm text-foreground-secondary">{empty}</p>
          <Button href={ROUTES.courses} size="lg" className="mt-6">
            استكشف الدورات
            <IconArrow />
          </Button>
        </Card>
      ) : (
        <div className="mt-4 space-y-3">{children}</div>
      )}
    </section>
  );
}

function EnrollmentList({
  enrollments,
  completed,
}: {
  enrollments: Enrollment[];
  completed?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {enrollments.map((enrollment) => (
        <li key={enrollment.id}>
          <Card
            padding="md"
            interactive
            className="flex flex-col gap-4 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-navy-900">{enrollment.courseTitle}</p>
                {completed && (
                  <Badge variant="sage">
                    <IconCheck size={12} className="me-1" />
                    مكتمل
                  </Badge>
                )}
              </div>
              {!completed && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-muted">
                    <div
                      className="h-full rounded-full bg-sage-500 transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-foreground-secondary">
                    {enrollment.progress}٪
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-foreground-muted">
                {formatHoursAndMinutes(enrollment.hoursUsed, true)} مستخدمة
                {completed
                  ? ` — اكتمل ${new Date(enrollment.lastActiveAt).toLocaleDateString("ar-SA")}`
                  : ` — آخر نشاط ${new Date(enrollment.lastActiveAt).toLocaleDateString("ar-SA")}`}
              </p>
            </div>
            <Button href={ROUTES.learn(enrollment.courseSlug)} variant="secondary" size="sm">
              {completed ? "مراجعة" : "متابعة"}
            </Button>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between rounded-xl px-2 py-2.5 text-sm text-foreground-secondary transition-colors hover:bg-background-subtle hover:text-sage-700"
      >
        {label}
        <IconArrow size={14} />
      </Link>
    </li>
  );
}
