import { AppProviders } from "@/components/layout/app-providers";
import { AppRouteGate } from "@/components/layout/app-route-gate";
import AppShellLayout from "@/components/layout/app-shell-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AppRouteGate>
        <AppShellLayout>{children}</AppShellLayout>
      </AppRouteGate>
    </AppProviders>
  );
}
