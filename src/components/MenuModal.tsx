"use client";

import { BookOpen, Package } from "lucide-react";
import Modal from "./Modal";
import type { GameStats } from "@/game/types";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
}

function StockBadge({ value, warn, crit }: { value: number; warn: number; crit: number }) {
  const color = value <= crit ? "text-live-pulse border-live-pulse/30 bg-live-pulse/10" : value <= warn ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" : "text-success border-success/30 bg-success/10";
  return (
    <span className={`font-pixel text-[6px] px-1.5 py-0.5 border ${color}`}>
      {value}
    </span>
  );
}

export default function MenuModal({ isOpen, onClose, stats }: MenuModalProps) {
  const menuItems = stats.menuItemsList ?? [];
  const beans = stats.stock?.coffeeBeans ?? 40;
  const milk = stats.stock?.milk ?? 30;
  const pending = stats.pendingDeliveries ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Menu & Inventory"
      icon={<BookOpen className="w-4 h-4 text-accent-light" />}
    >
      {/* Ingredient Stock Overview */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-3 py-2.5 bg-card-hover/50 border-2 border-border">
        <div className="flex items-center gap-2">
          <span className="text-base">☕</span>
          <span className="font-pixel text-[8px] text-muted-light uppercase">Beans</span>
          <StockBadge value={beans} warn={15} crit={5} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base">🥛</span>
          <span className="font-pixel text-[8px] text-muted-light uppercase">Milk</span>
          <StockBadge value={milk} warn={10} crit={4} />
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Package className="w-4 h-4 text-accent-light animate-pulse" />
            <span className="font-pixel text-[8px] text-accent-light">
              {pending} DELIVERY{pending > 1 ? "S" : ""} EN ROUTE
            </span>
          </div>
        )}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {menuItems.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-2.5 border-2 transition-colors ${
              item.unlocked
                ? "border-success/30 bg-success/5 hover:border-success/50"
                : "border-border bg-card-hover/30 opacity-60"
            }`}
          >
            <span className="text-lg leading-none shrink-0">
              {item.type === "coffee" ? "☕" : "🍰"}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-silk text-sm text-foreground block truncate">
                {item.name}
              </span>
              <div className="flex items-center gap-2 mt-1">
                {/* Show ingredient requirements for coffee items */}
                {item.type === "coffee" && item.recipe && (
                  <span className="font-pixel text-[6px] text-muted">
                    {item.recipe.coffee ? `${item.recipe.coffee}x beans` : ""}
                    {item.recipe.coffee && item.recipe.milk ? " + " : ""}
                    {item.recipe.milk ? `${item.recipe.milk}x milk` : ""}
                  </span>
                )}
                {/* Show stock for cake items */}
                {item.type === "cake" && item.unlocked && (
                  <span className={`font-pixel text-[7px] px-1.5 py-0.5 border ${
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
                  <span className="font-pixel text-[6px] text-muted">
                    cost: ${item.wholesaleCost.toFixed(2)}/ea
                  </span>
                )}
              </div>
            </div>
            {item.unlocked ? (
              <span className="font-silk text-base font-bold text-success whitespace-nowrap shrink-0">
                ${item.currentPrice.toFixed(2)}
              </span>
            ) : (
              <span className="font-pixel text-[8px] text-muted px-2 py-1 border border-border bg-card-hover whitespace-nowrap shrink-0">
                🔒 ${item.unlockCost}
              </span>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
