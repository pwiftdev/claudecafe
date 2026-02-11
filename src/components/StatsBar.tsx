"use client";

import { useState } from "react";
import {
  Coffee,
  CakeSlice,
  DollarSign,
  Users,
  TrendingUp,
  Star,
  ShoppingBag,
  Clock,
  Wallet,
  Heart,
  Armchair,
  BookOpen,
  ChevronDown,
  X,
  Package,
} from "lucide-react";
import type { GameStats, FundsSnapshot } from "@/game/types";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  onClick?: () => void;
}

function StatCard({ icon, label, value, change, positive, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2.5 bg-card border-2 border-border-bright pixel-shadow-sm hover:border-accent/40 hover:bg-card-hover group ${onClick ? "cursor-pointer select-none" : ""}`}
    >
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
          {onClick && (
            <ChevronDown className="w-3 h-3 text-muted-light group-hover:text-accent-light transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}

function StockBadge({ value, warn, crit }: { value: number; warn: number; crit: number }) {
  const color = value <= crit
    ? "text-live-pulse bg-live-pulse/15 border-live-pulse/40"
    : value <= warn
      ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
      : "text-success bg-success/10 border-success/30";
  return (
    <span className={`font-silk text-xs font-bold px-1.5 py-0.5 border ${color}`}>
      {value}
    </span>
  );
}

// ── Funds Chart (pure SVG, no dependencies) ──

function FundsChart({ data }: { data: FundsSnapshot[] }) {
  if (data.length < 2) return <div className="font-pixel text-[7px] text-muted p-4 text-center">Gathering data...</div>;

  const W = 480, H = 160, PAD = 32;
  const plotW = W - PAD * 2, plotH = H - PAD * 2;

  const minT = data[0].time, maxT = data[data.length - 1].time;
  const moneyVals = data.map(d => d.money);
  const minM = Math.min(0, ...moneyVals);
  const maxM = Math.max(100, ...moneyVals);
  const rangeT = maxT - minT || 1;
  const rangeM = maxM - minM || 1;

  const toX = (t: number) => PAD + ((t - minT) / rangeT) * plotW;
  const toY = (m: number) => PAD + plotH - ((m - minM) / rangeM) * plotH;

  const points = data.map(d => `${toX(d.time).toFixed(1)},${toY(d.money).toFixed(1)}`).join(" ");

  // Area fill
  const areaPath = `M ${toX(data[0].time).toFixed(1)},${toY(data[0].money).toFixed(1)} ` +
    data.slice(1).map(d => `L ${toX(d.time).toFixed(1)},${toY(d.money).toFixed(1)}`).join(" ") +
    ` L ${toX(data[data.length - 1].time).toFixed(1)},${(PAD + plotH).toFixed(1)} L ${toX(data[0].time).toFixed(1)},${(PAD + plotH).toFixed(1)} Z`;

  // Y-axis labels
  const ySteps = 4;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => minM + (rangeM * i) / ySteps);

  // Zero line
  const zeroY = toY(0);

  const lastMoney = data[data.length - 1].money;
  const lineColor = lastMoney >= 0 ? "#22c55e" : "#ef4444";
  const fillColor = lastMoney >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 180 }}>
      {/* Grid lines */}
      {yLabels.map((v, i) => (
        <g key={i}>
          <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={PAD - 4} y={toY(v) + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="monospace">
            ${Math.round(v)}
          </text>
        </g>
      ))}

      {/* Zero line */}
      {minM < 0 && <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 2" />}

      {/* Area fill */}
      <path d={areaPath} fill={fillColor} />

      {/* Line */}
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />

      {/* Current value dot */}
      <circle cx={toX(data[data.length - 1].time)} cy={toY(lastMoney)} r="3.5" fill={lineColor} />
      <circle cx={toX(data[data.length - 1].time)} cy={toY(lastMoney)} r="6" fill={lineColor} opacity="0.25" />
    </svg>
  );
}

function ExpenseBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (amount / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="font-pixel text-[6px] text-muted-light uppercase w-16 truncate">{label}</span>
      <div className="flex-1 h-2.5 bg-card-hover border border-border rounded-sm overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-silk text-xs font-bold text-foreground w-14 text-right">${amount.toFixed(0)}</span>
    </div>
  );
}

interface StatsBarProps {
  stats: GameStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFunds, setShowFunds] = useState(false);

  const beans = stats.stock?.coffeeBeans ?? 40;
  const milk = stats.stock?.milk ?? 30;
  const pending = stats.pendingDeliveries ?? 0;

  const statCards: StatCardProps[] = [
    {
      icon: <Wallet className="w-4 h-4" />,
      label: "Funds",
      value: `$${(stats.money ?? 0).toLocaleString()}`,
      change: (stats.money ?? 0) > 300 ? "HEALTHY" : "LOW",
      positive: (stats.money ?? 0) > 300,
      onClick: () => setShowFunds(!showFunds),
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      change: stats.revenue > 0 ? `+$${stats.revenue.toFixed(0)}` : undefined,
      positive: true,
    },
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
      icon: <Star className="w-4 h-4" />,
      label: "Rating",
      value: stats.rating.toFixed(1),
      change: stats.rating >= 4.0 ? "GOOD" : "LOW",
      positive: stats.rating >= 4.0,
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: "Baristas",
      value: String(stats.baristasCount),
      change: stats.baristasCount > 1 ? `+${stats.baristasCount - 1}` : undefined,
      positive: true,
    },
    {
      icon: <Armchair className="w-4 h-4" />,
      label: "Tables",
      value: `${stats.tables ?? 2}/${stats.maxTables ?? 8}`,
      change: (stats.tables ?? 2) >= 4 ? "EXPANDED" : undefined,
      positive: true,
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Menu",
      value: `${stats.unlockedItems ?? 3}/${stats.totalItems ?? 12}`,
      change: (stats.unlockedItems ?? 3) > 5 ? "DIVERSE" : undefined,
      positive: (stats.unlockedItems ?? 3) > 5,
      onClick: () => setShowMenu(!showMenu),
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
      icon: <Clock className="w-4 h-4" />,
      label: "Avg Wait",
      value: `${stats.avgWaitTime}s`,
      change: stats.avgWaitTime > 0 && stats.avgWaitTime < 10 ? "FAST" : stats.avgWaitTime >= 10 ? "SLOW" : undefined,
      positive: stats.avgWaitTime < 10,
    },
  ];

  const menuItems = stats.menuItemsList ?? [];

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Collapsible Funds Analytics Panel */}
      {showFunds && (
        <div className="mt-3 p-3 bg-card border-2 border-border-bright pixel-shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-accent-light" />
              <span className="font-pixel text-[8px] text-accent-light uppercase tracking-wider">
                Financial Analytics
              </span>
            </div>
            <button
              onClick={() => setShowFunds(false)}
              className="flex items-center justify-center w-6 h-6 border-2 border-border-bright hover:border-accent/40 hover:bg-card-hover text-muted hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Funds Over Time Chart */}
          <div className="mb-3 p-2 bg-card-hover/30 border border-border rounded-sm">
            <span className="font-pixel text-[6px] text-muted-light uppercase tracking-wider block mb-1">
              Funds Over Time
            </span>
            <FundsChart data={stats.fundsHistory ?? []} />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="p-2 bg-success/5 border border-success/30 text-center">
              <span className="font-pixel text-[6px] text-success/80 uppercase block">Total Income</span>
              <span className="font-silk text-sm font-bold text-success">${(stats.financials?.totalIncome ?? 0).toFixed(0)}</span>
            </div>
            <div className="p-2 bg-live-pulse/5 border border-live-pulse/30 text-center">
              <span className="font-pixel text-[6px] text-live-pulse/80 uppercase block">Total Expenses</span>
              <span className="font-silk text-sm font-bold text-live-pulse">
                ${((stats.financials?.totalWages ?? 0) + (stats.financials?.totalStockCost ?? 0) + (stats.financials?.totalUpgrades ?? 0) + (stats.financials?.totalTableCost ?? 0) + (stats.financials?.totalUnlockCost ?? 0)).toFixed(0)}
              </span>
            </div>
            <div className={`p-2 border text-center ${(stats.money ?? 0) >= 0 ? "bg-accent/5 border-accent/30" : "bg-live-pulse/5 border-live-pulse/30"}`}>
              <span className="font-pixel text-[6px] text-muted-light uppercase block">Net Profit</span>
              <span className={`font-silk text-sm font-bold ${(stats.financials?.totalIncome ?? 0) - (stats.financials?.totalWages ?? 0) - (stats.financials?.totalStockCost ?? 0) - (stats.financials?.totalUpgrades ?? 0) - (stats.financials?.totalTableCost ?? 0) - (stats.financials?.totalUnlockCost ?? 0) >= 0 ? "text-success" : "text-live-pulse"}`}>
                ${((stats.financials?.totalIncome ?? 0) - (stats.financials?.totalWages ?? 0) - (stats.financials?.totalStockCost ?? 0) - (stats.financials?.totalUpgrades ?? 0) - (stats.financials?.totalTableCost ?? 0) - (stats.financials?.totalUnlockCost ?? 0)).toFixed(0)}
              </span>
            </div>
          </div>

          {/* Today vs All-Time */}
          <div className="grid grid-cols-2 gap-3">
            {/* Today */}
            <div className="p-2 border border-border">
              <span className="font-pixel text-[7px] text-accent-light uppercase block mb-2">Today (Day {stats.day})</span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-pixel text-[6px] text-muted-light">Income</span>
                  <span className="font-silk text-xs font-bold text-success">${(stats.financials?.dailyIncome ?? 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-pixel text-[6px] text-muted-light">Wages</span>
                  <span className="font-silk text-xs font-bold text-live-pulse">-${(stats.financials?.dailyWages ?? 0).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-pixel text-[6px] text-muted-light">Other Costs</span>
                  <span className="font-silk text-xs font-bold text-live-pulse">-${((stats.financials?.dailyExpenses ?? 0) - (stats.financials?.dailyWages ?? 0)).toFixed(0)}</span>
                </div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between">
                  <span className="font-pixel text-[6px] text-foreground">Net</span>
                  <span className={`font-silk text-xs font-bold ${(stats.financials?.dailyIncome ?? 0) - (stats.financials?.dailyExpenses ?? 0) >= 0 ? "text-success" : "text-live-pulse"}`}>
                    ${((stats.financials?.dailyIncome ?? 0) - (stats.financials?.dailyExpenses ?? 0)).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown (All-Time) */}
            <div className="p-2 border border-border">
              <span className="font-pixel text-[7px] text-accent-light uppercase block mb-2">Expense Breakdown</span>
              <div className="space-y-1.5">
                <ExpenseBar label="Wages" amount={stats.financials?.totalWages ?? 0}
                  total={(stats.financials?.totalWages ?? 0) + (stats.financials?.totalStockCost ?? 0) + (stats.financials?.totalUpgrades ?? 0) + (stats.financials?.totalTableCost ?? 0) + (stats.financials?.totalUnlockCost ?? 0)}
                  color="#ef4444" />
                <ExpenseBar label="Stock" amount={stats.financials?.totalStockCost ?? 0}
                  total={(stats.financials?.totalWages ?? 0) + (stats.financials?.totalStockCost ?? 0) + (stats.financials?.totalUpgrades ?? 0) + (stats.financials?.totalTableCost ?? 0) + (stats.financials?.totalUnlockCost ?? 0)}
                  color="#f97316" />
                <ExpenseBar label="Upgrades" amount={stats.financials?.totalUpgrades ?? 0}
                  total={(stats.financials?.totalWages ?? 0) + (stats.financials?.totalStockCost ?? 0) + (stats.financials?.totalUpgrades ?? 0) + (stats.financials?.totalTableCost ?? 0) + (stats.financials?.totalUnlockCost ?? 0)}
                  color="#8b5cf6" />
                <ExpenseBar label="Tables" amount={stats.financials?.totalTableCost ?? 0}
                  total={(stats.financials?.totalWages ?? 0) + (stats.financials?.totalStockCost ?? 0) + (stats.financials?.totalUpgrades ?? 0) + (stats.financials?.totalTableCost ?? 0) + (stats.financials?.totalUnlockCost ?? 0)}
                  color="#3b82f6" />
                <ExpenseBar label="Unlocks" amount={stats.financials?.totalUnlockCost ?? 0}
                  total={(stats.financials?.totalWages ?? 0) + (stats.financials?.totalStockCost ?? 0) + (stats.financials?.totalUpgrades ?? 0) + (stats.financials?.totalTableCost ?? 0) + (stats.financials?.totalUnlockCost ?? 0)}
                  color="#06b6d4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Menu & Stock Panel */}
      {showMenu && menuItems.length > 0 && (
        <div className="mt-3 p-3 bg-card border-2 border-border-bright pixel-shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-light" />
              <span className="font-pixel text-[8px] text-accent-light uppercase tracking-wider">
                Menu & Inventory
              </span>
            </div>
            <button
              onClick={() => setShowMenu(false)}
              className="flex items-center justify-center w-6 h-6 border-2 border-border-bright hover:border-accent/40 hover:bg-card-hover text-muted hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ingredient Stock Overview */}
          <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2 bg-card-hover/50 border-2 border-border">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">☕</span>
              <span className="font-pixel text-[7px] text-muted-light uppercase">Beans</span>
              <StockBadge value={beans} warn={15} crit={5} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🥛</span>
              <span className="font-pixel text-[7px] text-muted-light uppercase">Milk</span>
              <StockBadge value={milk} warn={10} crit={4} />
            </div>
            {pending > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Package className="w-3.5 h-3.5 text-accent-light animate-pulse" />
                <span className="font-pixel text-[7px] text-accent-light">
                  {pending} DELIVERY{pending > 1 ? "S" : ""} EN ROUTE
                </span>
              </div>
            )}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {menuItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-3 py-2 border-2 transition-colors ${
                  item.unlocked
                    ? "border-success/30 bg-success/5 hover:border-success/50"
                    : "border-border bg-card-hover/30 opacity-60"
                }`}
              >
                <span className="text-base leading-none">
                  {item.type === "coffee" ? "☕" : "🍰"}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-silk text-xs text-foreground block truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {/* Show ingredient requirements for coffee items */}
                    {item.type === "coffee" && item.recipe && (
                      <span className="font-pixel text-[5px] text-muted">
                        {item.recipe.coffee ? `${item.recipe.coffee}x beans` : ""}
                        {item.recipe.coffee && item.recipe.milk ? " + " : ""}
                        {item.recipe.milk ? `${item.recipe.milk}x milk` : ""}
                      </span>
                    )}
                    {/* Show stock for cake items */}
                    {item.type === "cake" && item.unlocked && (
                      <span className={`font-pixel text-[6px] px-1 border ${
                        item.stock > 5
                          ? "text-success border-success/30 bg-success/10"
                          : item.stock > 0
                            ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
                            : "text-live-pulse border-live-pulse/30 bg-live-pulse/10"
                      }`}>
                        {item.stock > 0 ? `${item.stock} IN STOCK` : "OUT OF STOCK"}
                      </span>
                    )}
                    {item.type === "cake" && item.unlocked && (
                      <span className="font-pixel text-[5px] text-muted">
                        cost: ${item.wholesaleCost.toFixed(2)}/ea
                      </span>
                    )}
                  </div>
                </div>
                {item.unlocked ? (
                  <span className="font-silk text-sm font-bold text-success whitespace-nowrap">
                    ${item.currentPrice.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-pixel text-[7px] text-muted px-1.5 py-0.5 border border-border bg-card-hover whitespace-nowrap">
                    🔒 ${item.unlockCost}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
