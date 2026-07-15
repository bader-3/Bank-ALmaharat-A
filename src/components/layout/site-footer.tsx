import { Container } from "@/components/ui/container";
import { IconLogo } from "@/components/ui/icons";
import { NAV_LINKS, SITE } from "@/lib/constants";
import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy-900 text-white">
      <div
        className="pointer-events-none absolute -bottom-[25%] -right-[10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgb(196_154_44/0.12)_0%,transparent_65%)]"
        aria-hidden="true"
      />

      <Container className="relative py-16 lg:py-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/15 text-gold-400 ring-1 ring-gold-400/30">
                <IconLogo size={18} />
              </span>
              <span className="text-lg font-semibold text-gold-400">{SITE.name}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{SITE.description}</p>
          </div>

          <div className="flex gap-16 sm:gap-20">
            <nav aria-label="التنقل">
              <p className="text-xs font-semibold text-gold-400">استكشف</p>
              <ul className="mt-4 space-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="text-xs font-semibold text-gold-400">المنصة</p>
              <ul className="mt-4 space-y-3">
                <li className="text-sm text-white/70">نسخة تجريبية</li>
                <li className="text-sm text-white/70">اللغة: العربية</li>
                <li className="text-xs text-white/50">English — Coming Soon</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="my-10 h-px bg-white/10" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/50">
            © {currentYear} {SITE.name}
          </p>
          <p className="text-xs text-white/50">{SITE.tagline}</p>
        </div>
      </Container>
    </footer>
  );
}
