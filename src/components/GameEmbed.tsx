"use client";

import { useState } from "react";
import { Monitor, Wifi, WifiOff, Wallet, BookOpen } from "lucide-react";
import CafeGame from "@/game/CafeGame";
import type { GameStats, AIThought } from "@/game/types";
import type { BroadcastState } from "@/game/CafeGame";
import FundsModal from "./FundsModal";
import MenuModal from "./MenuModal";

interface GameEmbedProps {
  onStatsUpdate: (stats: GameStats) => void;
  onThoughtsUpdate: (thoughts: AIThought[]) => void;
  gameState?: BroadcastState | null;
  soundEvents?: string[];
  connected?: boolean;
  stats?: GameStats;
}

export default function GameEmbed({ onStatsUpdate, onThoughtsUpdate, gameState, soundEvents, connected, stats }: GameEmbedProps) {
  const [showFunds, setShowFunds] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Get stats from gameState if not provided directly
  const currentStats = stats || gameState?.stats;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Game toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-card border-b-2 border-border-bright">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-light shrink-0" />
            <span className="font-silk text-xs sm:text-sm text-muted-light">Game View</span>
            {connected ? (
              <span className="font-pixel text-[6px] sm:text-[7px] px-1.5 sm:px-2 py-0.5 bg-live-pulse/20 text-live-pulse border-2 border-live-pulse/30 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                LIVE
              </span>
            ) : (
              <span className="font-pixel text-[6px] sm:text-[7px] px-1.5 sm:px-2 py-0.5 bg-red-500/20 text-red-400 border-2 border-red-500/30 flex items-center gap-1">
                <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                CONNECTING...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {currentStats && (
              <>
                <button
                  onClick={() => setShowFunds(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-accent/15 hover:bg-accent/25 border-2 border-accent/40 hover:border-accent/60 pixel-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-light shrink-0" />
                  <span className="font-pixel text-[7px] sm:text-[8px] text-accent-light font-bold hidden sm:inline">View Funds</span>
                </button>
                <button
                  onClick={() => setShowMenu(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-accent/15 hover:bg-accent/25 border-2 border-accent/40 hover:border-accent/60 pixel-shadow-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent-light shrink-0" />
                  <span className="font-pixel text-[7px] sm:text-[8px] text-accent-light font-bold hidden sm:inline">View Menu</span>
                </button>
              </>
            )}
          </div>
        </div>

      {/* Game canvas */}
      <div className="flex-1 relative bg-[#08080e] min-h-[300px]">
        <CafeGame
          onStatsUpdate={onStatsUpdate}
          onThoughtsUpdate={onThoughtsUpdate}
          gameState={gameState}
          soundEvents={soundEvents}
        />

        {/* Connection overlay when disconnected */}
        {!connected && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center pointer-events-none z-10">
            <div className="flex flex-col items-center gap-2 p-4">
              <WifiOff className="w-8 h-8 text-muted animate-pulse" />
              <span className="font-silk text-sm text-muted-light">Connecting to server...</span>
            </div>
          </div>
        )}

        {/* CRT scanline overlay */}
        <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-20" />

        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent/20 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent/20 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent/20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent/20 pointer-events-none" />
      </div>
    </div>

    {currentStats && (
      <>
        <FundsModal isOpen={showFunds} onClose={() => setShowFunds(false)} stats={currentStats} />
        <MenuModal isOpen={showMenu} onClose={() => setShowMenu(false)} stats={currentStats} />
      </>
    )}
    </>
  );
}
