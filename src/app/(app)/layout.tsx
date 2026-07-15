import { AppProviders } from "@/components/layout/app-providers";
import AppShellLayout from "@/components/layout/app-shell-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppShellLayout>{children}</AppShellLayout>
    </AppProviders>
  );
}
