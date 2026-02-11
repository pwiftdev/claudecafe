"use client";

import { useState } from "react";
import Image from "next/image";
import { Zap, Users, Globe, Wallet, BookOpen } from "lucide-react";
import type { GameStats } from "@/game/types";
import FundsModal from "./FundsModal";
import MenuModal from "./MenuModal";

interface HeaderProps {
  stats: GameStats;
  viewerCount?: number;
  connected?: boolean;
}

export default function Header({ stats, viewerCount = 0, connected = false }: HeaderProps) {
  const [showFunds, setShowFunds] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 border-b-2 border-border-bright bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/cclogo.png"
            alt="ClaudeCafe Logo"
            width={32}
            height={32}
            className="pixel-render w-8 h-8 sm:w-10 sm:h-10"
          />
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <h1 className="font-pixel text-xs sm:text-sm text-accent-light tracking-wide">
              ClaudeCafe
            </h1>
            <span className="font-pixel text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 sm:py-1 bg-accent/20 text-accent-light pixel-border-accent pixel-shadow-sm">
              $CAFE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowFunds(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-accent/15 hover:bg-accent/25 border-2 border-accent/40 hover:border-accent/60 pixel-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <Wallet className="w-4 h-4 sm:w-4 sm:h-4 text-accent-light shrink-0" />
              <span className="font-pixel text-[7px] sm:text-[8px] text-accent-light font-bold hidden sm:inline">View Funds</span>
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-accent/15 hover:bg-accent/25 border-2 border-accent/40 hover:border-accent/60 pixel-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              <BookOpen className="w-4 h-4 sm:w-4 sm:h-4 text-accent-light shrink-0" />
              <span className="font-pixel text-[7px] sm:text-[8px] text-accent-light font-bold hidden sm:inline">View Menu</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-live-pulse/15 border-2 border-live-pulse/40 pixel-shadow-sm">
              <div className="w-2 h-2 bg-live-pulse animate-blink" />
              <span className="font-pixel text-[7px] text-live-pulse">LIVE</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 font-silk text-xs text-muted-light">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Day {stats.day}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent" />
              <span>{viewerCount.toLocaleString()} watching</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>${(stats.money ?? stats.revenue).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>

      <FundsModal isOpen={showFunds} onClose={() => setShowFunds(false)} stats={stats} />
      <MenuModal isOpen={showMenu} onClose={() => setShowMenu(false)} stats={stats} />
    </>
  );
}
