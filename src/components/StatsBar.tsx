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

export default function StatsBar() {
  const stats: StatCardProps[] = [
    {
      icon: <Coffee className="w-4 h-4" />,
      label: "Coffee Sold",
      value: "12,847",
      change: "+234",
      positive: true,
    },
    {
      icon: <CakeSlice className="w-4 h-4" />,
      label: "Cakes Sold",
      value: "3,421",
      change: "+67",
      positive: true,
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Revenue",
      value: "$48,293",
      change: "+12.4%",
      positive: true,
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Baristas",
      value: "8",
      change: "+1",
      positive: true,
    },
    {
      icon: <Star className="w-4 h-4" />,
      label: "Rating",
      value: "4.7",
      change: "+0.2",
      positive: true,
    },
    {
      icon: <Heart className="w-4 h-4" />,
      label: "Customers",
      value: "2,156",
      change: "+89",
      positive: true,
    },
    {
      icon: <ShoppingBag className="w-4 h-4" />,
      label: "Orders Today",
      value: "347",
      change: "-12",
      positive: false,
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: "Profit Margin",
      value: "34.2%",
      change: "+2.1%",
      positive: true,
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Streak",
      value: "14 days",
    },
    {
      icon: <Clock className="w-4 h-4" />,
      label: "Avg Wait",
      value: "2.3m",
      change: "-0.4m",
      positive: true,
    },
  ];

  return (
    <div className="px-3 py-3 border-t-2 border-border-bright bg-card/60">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-accent-light" />
        <h2 className="font-pixel text-[8px] text-accent-light uppercase tracking-wider">
          Game Stats
        </h2>
        <div className="flex-1 h-0.5 bg-border-bright" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--color-border-bright) 0px, var(--color-border-bright) 4px, transparent 4px, transparent 8px)" }} />
        <span className="font-pixel text-[6px] text-muted animate-pulse-glow">
          LIVE
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>
    </div>
  );
}
