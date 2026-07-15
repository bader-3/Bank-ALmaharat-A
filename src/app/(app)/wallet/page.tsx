import { WalletScreen } from "@/components/wallet/wallet-screen";
import { Suspense } from "react";

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="type-body text-foreground-muted">جاري التحميل…</p>
        </div>
      }
    >
      <WalletScreen />
    </Suspense>
  );
}
