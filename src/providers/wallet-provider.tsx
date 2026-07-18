"use client";

import { getWalletService } from "@/services/wallet";
import { getLearningService } from "@/services/learning";
import { reconcileWalletWithEnrollments } from "@/services/wallet/mock-wallet-storage";
import type { WalletStats } from "@/types/account";
import type { HourPackage, PurchaseResult } from "@/types/wallet";
import { useAuth } from "@/providers/auth-provider";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface WalletContextValue {
  balance: number;
  stats: WalletStats | null;
  isLoading: boolean;
  refreshWallet: () => Promise<void>;
  purchasePackage: (pkg: HourPackage) => Promise<PurchaseResult>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const wallet = useMemo(() => getWalletService(), []);
  const learning = useMemo(() => getLearningService(), []);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const refreshingRef = useRef(false);

  const refreshWallet = useCallback(async () => {
    if (!userId) {
      setBalance(0);
      setStats(null);
      setIsLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    if (refreshingRef.current) return;
    refreshingRef.current = true;

    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }

    try {
      const enrollments = await learning.getEnrollments(userId);
      const enrolledHours = enrollments.reduce((sum, enrollment) => sum + enrollment.hoursUsed, 0);
      reconcileWalletWithEnrollments(userId, enrolledHours);

      const nextStats = await wallet.getStats(userId);
      setStats(nextStats);
      setBalance(nextStats.balance);
      hasLoadedRef.current = true;
    } finally {
      setIsLoading(false);
      refreshingRef.current = false;
    }
  }, [userId, wallet, learning]);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    if (!userId) return;

    function handleWalletChange() {
      void refreshWallet();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void refreshWallet();
      }
    }

    window.addEventListener("asb-wallet-changed", handleWalletChange);
    window.addEventListener("storage", handleWalletChange);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("asb-wallet-changed", handleWalletChange);
      window.removeEventListener("storage", handleWalletChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, refreshWallet]);

  const purchasePackage = useCallback(
    async (pkg: HourPackage) => {
      if (!userId) {
        return { success: false as const, error: "يجب تسجيل الدخول أولًا." };
      }

      const result = await wallet.purchasePackage(userId, pkg);
      if (result.success) {
        const nextStats = await wallet.getStats(userId);
        setStats(nextStats);
        setBalance(nextStats.balance);
      }
      return result;
    },
    [userId, wallet],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      balance,
      stats,
      isLoading,
      refreshWallet,
      purchasePackage,
    }),
    [balance, stats, isLoading, refreshWallet, purchasePackage],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

/** Safe outside app routes (landing, auth) where WalletProvider is not mounted. */
export function useWalletOptional() {
  return useContext(WalletContext);
}
