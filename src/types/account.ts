export type WalletPurchase = {
  id: string;
  packageName: string;
  hours: number;
  price: number;
  purchasedAt: string;
};

export type WalletStats = {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  purchases: WalletPurchase[];
};
