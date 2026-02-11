"use client";

import { Monitor, Maximize2, Volume2 } from "lucide-react";
import CafeGame from "@/game/CafeGame";
import type { GameStats, AIThought } from "@/game/types";

interface GameEmbedProps {
  onStatsUpdate: (stats: GameStats) => void;
  onThoughtsUpdate: (thoughts: AIThought[]) => void;
}

export default function GameEmbed({ onStatsUpdate, onThoughtsUpdate }: GameEmbedProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Game toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b-2 border-border-bright">
        <div className="flex items-center gap-2.5">
          <Monitor className="w-4 h-4 text-muted-light" />
          <span className="font-silk text-sm text-muted-light">Game View</span>
          <span className="font-pixel text-[7px] px-2 py-0.5 bg-live-pulse/20 text-live-pulse border-2 border-live-pulse/30">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 border-2 border-transparent hover:border-border-bright hover:bg-card-hover text-muted hover:text-foreground">
            <Volume2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 border-2 border-transparent hover:border-border-bright hover:bg-card-hover text-muted hover:text-foreground">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Game canvas */}
      <div className="flex-1 relative bg-[#08080e] min-h-[300px]">
        <CafeGame
          onStatsUpdate={onStatsUpdate}
          onThoughtsUpdate={onThoughtsUpdate}
        />

        {/* CRT scanline overlay */}
        <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-20" />

        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent/20 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent/20 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent/20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent/20 pointer-events-none" />
      </div>
    </div>
  );
}
