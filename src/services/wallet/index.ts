import type { HourPackage, PurchaseResult } from "@/types/wallet";
import type { WalletStats } from "@/types/account";
import { mockWriteDelay } from "@/lib/mock-delay";
import { addHours, getWalletStats } from "@/services/wallet/mock-wallet-storage";

export interface WalletService {
  getStats(userId: string): Promise<WalletStats>;
  purchasePackage(userId: string, pkg: HourPackage): Promise<PurchaseResult>;
}

export class MockWalletService implements WalletService {
  async getStats(userId: string): Promise<WalletStats> {
    return getWalletStats(userId);
  }

  async purchasePackage(userId: string, pkg: HourPackage): Promise<PurchaseResult> {
    await mockWriteDelay(120);

    if (!userId) {
      return { success: false, error: "يجب تسجيل الدخول أولًا." };
    }

    const newBalance = addHours(userId, pkg.hours, {
      packageName: pkg.name,
      price: pkg.price,
    });
    return { success: true, newBalance, hoursAdded: pkg.hours };
  }
}

let instance: MockWalletService | null = null;

export function getWalletService(): WalletService {
  if (!instance) instance = new MockWalletService();
  return instance;
}
