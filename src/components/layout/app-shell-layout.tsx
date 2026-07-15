import { AppSidebar } from "@/components/layout/app-sidebar";
import { EnglishComingSoonModal } from "@/components/layout/english-coming-soon-modal";
import { AmbientBackground } from "@/components/ui/ambient-background";

export default function AppShellLayout({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <>
      <AmbientBackground />
      <AppSidebar />
      <div className="min-h-screen pt-[4.5rem] lg:mr-72 lg:pt-0">
        <main>{children}</main>
        {footer}
      </div>
      <EnglishComingSoonModal />
    </>
  );
}
