export interface MenuItemInfo {
  name: string;
  type: "coffee" | "cake";
  currentPrice: number;
  basePrice: number;
  unlocked: boolean;
  unlockCost: number;
  stock: number; // -1 for coffee (uses ingredients), >= 0 for cakes
  recipe: { coffee?: number; milk?: number };
  wholesaleCost: number;
}

export interface FundsSnapshot {
  time: number;   // gameTime in seconds
  money: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalWages: number;
  totalStockCost: number;
  totalUpgrades: number;
  totalTableCost: number;
  totalUnlockCost: number;
  dailyIncome: number;
  dailyWages: number;
  dailyExpenses: number;
}

export interface GameStats {
  coffeeSold: number;
  cakesSold: number;
  revenue: number;
  baristasCount: number;
  rating: number;
  customersServed: number;
  ordersToday: number;
  profitMargin: number;
  streak: number;
  avgWaitTime: number;
  day: number;
  money: number;
  tables: number;
  maxTables: number;
  unlockedItems: number;
  totalItems: number;
  upgrades: { name: string; level: number; maxLevel: number }[];
  menuItemsList: MenuItemInfo[];
  stock: {
    coffeeBeans: number;
    milk: number;
  };
  pendingDeliveries: number;
  fundsHistory: FundsSnapshot[];
  financials: FinancialSummary;
}

export interface AIThought {
  id: number;
  text: string;
  time: string;
  type: "strategy" | "observation" | "decision" | "reflection";
}
