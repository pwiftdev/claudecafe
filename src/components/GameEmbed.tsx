"use client";

import { Monitor, Maximize2, Volume2, Wifi, WifiOff } from "lucide-react";
import CafeGame from "@/game/CafeGame";
import type { GameStats, AIThought } from "@/game/types";
import type { BroadcastState } from "@/game/CafeGame";

interface GameEmbedProps {
  onStatsUpdate: (stats: GameStats) => void;
  onThoughtsUpdate: (thoughts: AIThought[]) => void;
  gameState?: BroadcastState | null;
  soundEvents?: string[];
  connected?: boolean;
}

export default function GameEmbed({ onStatsUpdate, onThoughtsUpdate, gameState, soundEvents, connected }: GameEmbedProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Game toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b-2 border-border-bright">
        <div className="flex items-center gap-2.5">
          <Monitor className="w-4 h-4 text-muted-light" />
          <span className="font-silk text-sm text-muted-light">Game View</span>
          {connected ? (
            <span className="font-pixel text-[7px] px-2 py-0.5 bg-live-pulse/20 text-live-pulse border-2 border-live-pulse/30 flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              LIVE
            </span>
          ) : (
            <span className="font-pixel text-[7px] px-2 py-0.5 bg-red-500/20 text-red-400 border-2 border-red-500/30 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              CONNECTING...
            </span>
          )}
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
  );
}
