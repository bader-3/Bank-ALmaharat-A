import { isBrowser } from "@/services/firebase/common";
import type { WalletPurchase, WalletStats } from "@/types/account";
import { saveCloudWallet } from "@/services/firebase/user-profiles";

const WALLET_KEY = "asb-wallet";

type LegacyWalletStore = Record<string, number>;
type WalletStore = Record<string, WalletStats>;

function emptyStats(): WalletStats {
  return { balance: 0, totalPurchased: 0, totalUsed: 0, purchases: [] };
}

function readRaw(): unknown {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(WALLET_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function isLegacyStore(data: unknown): data is LegacyWalletStore {
  if (!data || typeof data !== "object") return false;
  const values = Object.values(data as Record<string, unknown>);
  return values.length === 0 || values.every((v) => typeof v === "number");
}

function migrateLegacy(legacy: LegacyWalletStore): WalletStore {
  const migrated: WalletStore = {};
  for (const [userId, balance] of Object.entries(legacy)) {
    migrated[userId] = {
      balance,
      totalPurchased: balance,
      totalUsed: 0,
      purchases: [],
    };
  }
  return migrated;
}

function readStore(): WalletStore {
  const raw = readRaw();
  if (isLegacyStore(raw)) {
    const migrated = migrateLegacy(raw);
    writeStore(migrated);
    return migrated;
  }
  return (raw as WalletStore) ?? {};
}

function writeStore(store: WalletStore) {
  if (!isBrowser()) return;
  window.localStorage.setItem(WALLET_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("asb-wallet-changed"));
}

function getUserStats(userId: string): WalletStats {
  return readStore()[userId] ?? emptyStats();
}

function saveUserStats(userId: string, stats: WalletStats) {
  const store = readStore();
  store[userId] = stats;
  writeStore(store);
  if (isBrowser()) {
    void saveCloudWallet(userId, stats).catch((error) => {
      console.error("[Firestore] تعذّر حفظ المحفظة:", error);
    });
  }
}

export function getWalletBalance(userId: string): number {
  return getUserStats(userId).balance;
}

export function getWalletStats(userId: string): WalletStats {
  return getUserStats(userId);
}

export function hasEnoughHours(userId: string, requiredHours: number): boolean {
  return getWalletBalance(userId) >= requiredHours;
}

export function addHours(
  userId: string,
  hours: number,
  meta?: { packageName: string; price: number },
): number {
  const stats = getUserStats(userId);
  const purchase: WalletPurchase | null = meta
    ? {
        id: `pur_${Date.now()}`,
        packageName: meta.packageName,
        hours,
        price: meta.price,
        purchasedAt: new Date().toISOString(),
      }
    : null;

  const next: WalletStats = {
    balance: stats.balance + hours,
    totalPurchased: stats.totalPurchased + hours,
    totalUsed: stats.totalUsed,
    purchases: purchase ? [purchase, ...stats.purchases] : stats.purchases,
  };

  saveUserStats(userId, next);
  return next.balance;
}

export function deductHours(userId: string, hours: number): number | null {
  const stats = getUserStats(userId);
  if (stats.balance < hours) return null;

  const next: WalletStats = {
    balance: stats.balance - hours,
    totalPurchased: stats.totalPurchased,
    totalUsed: stats.totalUsed + hours,
    purchases: stats.purchases,
  };

  saveUserStats(userId, next);
  return next.balance;
}

/**
 * Align balance + usage with enrollments when the ledger was never reconciled
 * (legacy users who enrolled before hour deductions were tracked).
 */
export function reconcileWalletWithEnrollments(userId: string, enrolledHours: number): WalletStats {
  const stats = getUserStats(userId);
  if (stats.totalUsed > 0 || enrolledHours === 0) return stats;

  const totalPurchased = stats.totalPurchased > 0 ? stats.totalPurchased : stats.balance;
  const totalUsed = enrolledHours;
  const balance = Math.max(0, totalPurchased - totalUsed);

  const next: WalletStats = {
    ...stats,
    balance,
    totalUsed,
    totalPurchased: Math.max(totalPurchased, balance + totalUsed),
  };

  saveUserStats(userId, next);
  return next;
}
