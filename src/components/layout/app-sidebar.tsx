"use client";

import {
  IconBook,
  IconCheck,
  IconCompass,
  IconClose,
  IconFile,
  IconFlame,
  IconHeart,
  IconLogo,
  IconMenu,
  IconMoon,
  IconPath,
  IconSparkle,
  IconSun,
  IconUser,
  IconWallet,
} from "@/components/ui/icons";
import { ROUTES, SITE } from "@/lib/constants";
import { formatHoursAndMinutes } from "@/lib/format/duration";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { useWalletOptional } from "@/providers/wallet-provider";
import { useModal } from "@/providers/modal-provider";
import { useTheme } from "@/providers/theme-provider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";

type NavIcon = ComponentType<{ size?: number; className?: string }>;

const APP_NAV: Array<{
  href: string;
  label: string;
  icon: NavIcon;
  showBeforeInterview?: boolean;
}> = [
  { href: ROUTES.account, label: "حسابي", icon: IconUser },
  {
    href: ROUTES.interview,
    label: "المقابلة الذكية",
    icon: IconSparkle,
    showBeforeInterview: true,
  },
  { href: ROUTES.path, label: "مساري", icon: IconPath },
  { href: ROUTES.goals, label: "أهدافي", icon: IconCheck },
  { href: ROUTES.activity, label: "سجل التعلّم", icon: IconBook },
  { href: ROUTES.progress, label: "إنجازاتي", icon: IconFlame },
  { href: ROUTES.courses, label: "الدورات", icon: IconCompass },
  { href: ROUTES.favorites, label: "المفضّلة", icon: IconHeart },
  { href: ROUTES.noor, label: "نور", icon: IconSparkle },
  { href: ROUTES.wallet, label: "المحفظة", icon: IconWallet },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const wallet = useWalletOptional();
  const balance = wallet?.balance ?? 0;
  const walletLoading = wallet?.isLoading ?? false;
  const { theme, toggleTheme } = useTheme();
  const { openEnglishModal } = useModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const links = APP_NAV.filter((item) => {
    if (item.showBeforeInterview) return !user?.interviewCompleted;
    return true;
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-[4.5rem] items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur-md lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark variant="light" />
          <span className="text-lg font-semibold text-foreground">{SITE.name}</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-xs"
          aria-label="فتح قائمة المنصة"
          aria-expanded={mobileOpen}
        >
          <IconMenu size={20} />
        </button>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="إغلاق القائمة"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-navy-900 text-white shadow-lg transition-transform duration-300",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="قائمة المنصة"
      >
        <div className="flex h-[5.25rem] items-center justify-between border-b border-white/10 px-6">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-lg font-semibold text-gold-400">{SITE.name}</p>
              <p className="mt-0.5 text-xs text-white/55">مساحتك التعليمية</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="scrollbar-none flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-xs font-semibold tracking-wide text-white/40">التنقّل</p>
          <ul className="mt-3 space-y-1">
            {links.map((item) => {
              const active =
                pathname === item.href ||
                (item.href === ROUTES.courses && pathname.startsWith(`${ROUTES.courses}/`)) ||
                (item.href === ROUTES.activity &&
                  (pathname.startsWith("/learn/") || pathname.startsWith("/review/")));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                      active
                        ? "bg-sage-500 text-white shadow-sm"
                        : "text-white/70 hover:bg-white/8 hover:text-white",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon size={19} />
                    <span>{item.label}</span>
                    {item.href === ROUTES.wallet && isAuthenticated && wallet && (
                      <span className="ms-auto text-xs text-white/50">
                        {walletLoading ? "…" : formatHoursAndMinutes(balance, true)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="my-6 h-px bg-white/10" />

          <p className="px-3 text-xs font-semibold tracking-wide text-white/40">عام</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all",
                  pathname === "/"
                    ? "bg-sage-500 font-medium text-white shadow-sm"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                <IconLogo size={19} />
                الصفحة الرئيسية
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 transition-all hover:bg-white/8 hover:text-white"
              >
                {theme === "light" ? <IconMoon size={19} /> : <IconSun size={19} />}
                {theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={openEnglishModal}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 transition-all hover:bg-white/8 hover:text-white"
              >
                <IconFile size={19} />
                English
              </button>
            </li>
          </ul>
        </nav>

        <div className="border-t border-white/10 p-4">
          {isAuthenticated && user ? (
            <div>
              <Link
                href={ROUTES.account}
                className="flex items-center gap-3 rounded-xl bg-white/8 px-3 py-3 transition-colors hover:bg-white/12"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-navy-900">
                  {user.fullName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="truncate text-xs text-white/50">{user.email}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => void logout().then(() => router.push("/"))}
                className="mt-2 w-full rounded-xl px-3 py-2 text-start text-sm text-white/50 hover:bg-white/8 hover:text-white/80"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={ROUTES.login}
                className="rounded-xl border border-white/20 px-3 py-2.5 text-center text-sm text-white"
              >
                دخول
              </Link>
              <Link
                href={ROUTES.register}
                className="rounded-xl bg-gold-500 px-3 py-2.5 text-center text-sm font-medium text-navy-900"
              >
                حساب جديد
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function BrandMark({ variant = "sidebar" }: { variant?: "sidebar" | "light" }) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        variant === "sidebar"
          ? "bg-gold-500/15 text-gold-400 ring-1 ring-gold-400/30"
          : "bg-gold-50 text-gold-600 ring-1 ring-gold-200",
      )}
    >
      <IconLogo size={18} />
    </span>
  );
}
