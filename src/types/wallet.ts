export type HourPackage = {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
  highlight?: string;
};

export type PurchaseResult =
  | { success: true; newBalance: number; hoursAdded: number }
  | { success: false; error: string };
