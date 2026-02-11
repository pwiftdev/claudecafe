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
}

export interface AIThought {
  id: number;
  text: string;
  time: string;
  type: "strategy" | "observation" | "decision" | "reflection";
}
