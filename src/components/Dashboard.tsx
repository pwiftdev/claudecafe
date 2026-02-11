"use client";

import { useState, useCallback } from "react";
import Header from "./Header";
import GameEmbed from "./GameEmbed";
import SidePanel from "./SidePanel";
import StatsBar from "./StatsBar";
import type { GameStats, AIThought } from "@/game/types";

const defaultStats: GameStats = {
  coffeeSold: 0,
  cakesSold: 0,
  revenue: 0,
  baristasCount: 1,
  rating: 5.0,
  customersServed: 0,
  ordersToday: 0,
  profitMargin: 0,
  streak: 0,
  avgWaitTime: 0,
  day: 1,
  money: 100,
  tables: 2,
  maxTables: 8,
  unlockedItems: 3,
  totalItems: 12,
  upgrades: [],
  menuItemsList: [],
  stock: { coffeeBeans: 40, milk: 30 },
  pendingDeliveries: 0,
  fundsHistory: [{ time: 0, money: 100 }],
  financials: {
    totalIncome: 0, totalWages: 0, totalStockCost: 0,
    totalUpgrades: 0, totalTableCost: 0, totalUnlockCost: 0,
    dailyIncome: 0, dailyWages: 0, dailyExpenses: 0,
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [thoughts, setThoughts] = useState<AIThought[]>([]);

  const handleStatsUpdate = useCallback((s: GameStats) => setStats(s), []);
  const handleThoughtsUpdate = useCallback((t: AIThought[]) => setThoughts(t), []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header stats={stats} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <GameEmbed
              onStatsUpdate={handleStatsUpdate}
              onThoughtsUpdate={handleThoughtsUpdate}
            />
          </div>
          <StatsBar stats={stats} />
        </div>

        <div className="w-[380px] shrink-0 hidden lg:flex">
          <SidePanel thoughts={thoughts} stats={stats} />
        </div>
      </div>
    </div>
  );
}
