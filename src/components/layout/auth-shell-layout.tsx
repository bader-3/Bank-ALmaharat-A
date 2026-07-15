import { AmbientBackground } from "@/components/ui/ambient-background";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** تخطيط صفحات الدخول والتسجيل — بدون القائمة الجانبية للزائر. */
export default function AuthShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AmbientBackground />
      <div className="fixed left-5 top-5 z-50">
        <ThemeToggle />
      </div>
      <main className="min-h-screen">{children}</main>
    </>
  );
}
