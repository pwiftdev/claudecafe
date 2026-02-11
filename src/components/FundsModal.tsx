"use client";

import { Wallet } from "lucide-react";
import Modal from "./Modal";
import type { GameStats, FundsSnapshot } from "@/game/types";

interface FundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
}

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
      <span className="font-pixel text-[7px] text-muted-light uppercase w-20 truncate">{label}</span>
      <div className="flex-1 h-3 bg-card-hover border border-border rounded-sm overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-silk text-sm font-bold text-foreground w-16 text-right" style={{ color }}>${amount.toFixed(0)}</span>
    </div>
  );
}

export default function FundsModal({ isOpen, onClose, stats }: FundsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Analytics"
      icon={<Wallet className="w-4 h-4 text-accent-light" />}
    >
      {/* Funds Over Time Chart */}
      <div className="mb-4 p-3 bg-card-hover/30 border border-border rounded-sm">
        <span className="font-pixel text-[7px] text-muted-light uppercase tracking-wider block mb-2">
          Funds Over Time
        </span>
        <FundsChart data={stats.fundsHistory ?? []} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-success/5 border border-success/30 text-center">
          <span className="font-pixel text-[7px] text-success/80 uppercase block mb-1">Total Income</span>
          <span className="font-silk text-lg font-bold text-success">${(stats.financials?.totalIncome ?? 0).toFixed(0)}</span>
        </div>
        <div className="p-3 bg-live-pulse/5 border border-live-pulse/30 text-center">
          <span className="font-pixel text-[7px] text-live-pulse/80 uppercase block mb-1">Total Expenses</span>
          <span className="font-silk text-lg font-bold text-live-pulse">
            ${((stats.financials?.totalWages ?? 0) + (stats.financials?.totalStockCost ?? 0) + (stats.financials?.totalUpgrades ?? 0) + (stats.financials?.totalTableCost ?? 0) + (stats.financials?.totalUnlockCost ?? 0)).toFixed(0)}
          </span>
        </div>
        <div className={`p-3 border text-center ${(stats.money ?? 0) >= 0 ? "bg-accent/5 border-accent/30" : "bg-live-pulse/5 border-live-pulse/30"}`}>
          <span className="font-pixel text-[7px] text-muted-light uppercase block mb-1">Net Profit</span>
          <span className={`font-silk text-lg font-bold ${(stats.financials?.totalIncome ?? 0) - (stats.financials?.totalWages ?? 0) - (stats.financials?.totalStockCost ?? 0) - (stats.financials?.totalUpgrades ?? 0) - (stats.financials?.totalTableCost ?? 0) - (stats.financials?.totalUnlockCost ?? 0) >= 0 ? "text-success" : "text-live-pulse"}`}>
            ${((stats.financials?.totalIncome ?? 0) - (stats.financials?.totalWages ?? 0) - (stats.financials?.totalStockCost ?? 0) - (stats.financials?.totalUpgrades ?? 0) - (stats.financials?.totalTableCost ?? 0) - (stats.financials?.totalUnlockCost ?? 0)).toFixed(0)}
          </span>
        </div>
      </div>

      {/* Today vs All-Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today */}
        <div className="p-3 border-2 border-border">
          <span className="font-pixel text-[8px] text-accent-light uppercase block mb-3">Today (Day {stats.day})</span>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-muted-light">Income</span>
              <span className="font-silk text-sm font-bold text-success">${(stats.financials?.dailyIncome ?? 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-muted-light">Wages</span>
              <span className="font-silk text-sm font-bold text-live-pulse">-${(stats.financials?.dailyWages ?? 0).toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-muted-light">Other Costs</span>
              <span className="font-silk text-sm font-bold text-live-pulse">-${((stats.financials?.dailyExpenses ?? 0) - (stats.financials?.dailyWages ?? 0)).toFixed(0)}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-foreground">Net</span>
              <span className={`font-silk text-sm font-bold ${(stats.financials?.dailyIncome ?? 0) - (stats.financials?.dailyExpenses ?? 0) >= 0 ? "text-success" : "text-live-pulse"}`}>
                ${((stats.financials?.dailyIncome ?? 0) - (stats.financials?.dailyExpenses ?? 0)).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown (All-Time) */}
        <div className="p-3 border-2 border-border">
          <span className="font-pixel text-[8px] text-accent-light uppercase block mb-3">Expense Breakdown</span>
          <div className="space-y-2">
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
    </Modal>
  );
}
