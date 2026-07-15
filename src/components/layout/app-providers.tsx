"use client";

import { WalletProvider } from "@/providers/wallet-provider";
import type { ReactNode } from "react";

/** Wallet context for authenticated app routes. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
