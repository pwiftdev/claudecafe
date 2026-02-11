"use client";

import {
  Coffee,
  CakeSlice,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  ShoppingBag,
  Clock,
  Flame,
  Heart,
} from "lucide-react";
import type { GameStats } from "@/game/types";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

function StatCard({ icon, label, value, change, positive }: StatCardProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-card border-2 border-border-bright pixel-shadow-sm hover:border-accent/40 hover:bg-card-hover group">
      <div className="flex items-center justify-center w-8 h-8 bg-accent/10 border-2 border-accent/30 text-accent-light">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-pixel text-[6px] text-muted-light uppercase tracking-wider truncate leading-normal">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-silk text-base font-bold text-foreground">
            {value}
          </span>
          {change && (
            <span
              className={`font-pixel text-[6px] px-1.5 py-0.5 border ${
                positive
                  ? "text-success bg-success/10 border-success/30"
                  : "text-live-pulse bg-live-pulse/10 border-live-pulse/30"
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatsBarProps {
  stats: GameStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const statCards: StatCardProps[] = [
    {
      icon: <Coffee className="w-4 h-4" />,
      label: "Coffee Sold",
      value: stats.coffeeSold.toLocaleString(),
      change: stats.coffeeSold > 0 ? `+${stats.coffeeSold}` : undefined,
      positive: true,
    },
    {
      icon: <CakeSlice className="w-4 h-4" />,
      label: "Cakes Sold",
      value: stats.cakesSold.toLocaleString(),
      change: stats.cakesSold > 0 ? `+${stats.cakesSold}` : undefined,
      positive: true,
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      change: stats.revenue > 0 ? `+$${stats.revenue.toFixed(0)}` : undefined,
      positive: true,
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Baristas",
      value: String(stats.baristasCount),
      change: stats.baristasCount > 1 ? `+${stats.baristasCount - 1}` : undefined,
      positive: true,
    },
    {
      icon: <Star className="w-4 h-4" />,
      label: "Rating",
      value: stats.rating.toFixed(1),
      change: stats.rating >= 4.0 ? "GOOD" : "LOW",
      positive: stats.rating >= 4.0,
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Customers",
      value: stats.customersServed.toLocaleString(),
      change: stats.customersServed > 0 ? `+${stats.customersServed}` : undefined,
      positive: true,
    },
    {
      icon: <ShoppingBag className="w-4 h-4" />,
      label: "Orders Today",
      value: String(stats.ordersToday),
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Profit Margin",
      value: `${stats.profitMargin}%`,
      change: stats.profitMargin > 30 ? "HEALTHY" : undefined,
      positive: stats.profitMargin > 30,
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Streak",
      value: `${stats.streak} days`,
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Avg Wait",
      value: `${stats.avgWaitTime}s`,
      change: stats.avgWaitTime > 0 && stats.avgWaitTime < 10 ? "FAST" : stats.avgWaitTime >= 10 ? "SLOW" : undefined,
      positive: stats.avgWaitTime < 10,
    },
  ];

  return (
    <div className="px-3 py-3 border-t-2 border-border-bright bg-card/60">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-accent-light" />
        <h2 className="font-pixel text-[8px] text-accent-light uppercase tracking-wider">
          Game Stats
        </h2>
        <div
          className="flex-1 h-0.5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--color-border-bright) 0px, var(--color-border-bright) 4px, transparent 4px, transparent 8px)",
          }}
        />
        <span className="font-pixel text-[6px] text-success animate-pulse-glow">
          LIVE
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>
    </div>
  );
}
