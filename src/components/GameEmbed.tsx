"use client";

import Image from "next/image";
import { Monitor, Maximize2, Volume2 } from "lucide-react";

export default function GameEmbed() {
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

      {/* Game embed area */}
      <div className="flex-1 relative bg-[#08080e] flex items-center justify-center min-h-[350px] crt-glow">
        {/* Placeholder for game embed */}
        <div className="flex flex-col items-center gap-5 text-muted">
          <div className="relative">
            <div className="w-28 h-28 bg-card pixel-border pixel-shadow flex items-center justify-center">
              <Image
                src="/cclogo.png"
                alt="ClaudeCafe"
                width={64}
                height={64}
                className="pixel-render opacity-50"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-live-pulse animate-blink" />
          </div>
          <div className="text-center">
            <p className="font-pixel text-[9px] text-muted-light leading-relaxed">
              GAME EMBED AREA
            </p>
            <p className="font-silk text-xs text-muted mt-2">
              Cafe Tycoon will render here
            </p>
          </div>
        </div>

        {/* CRT scanline overlay */}
        <div className="absolute inset-0 pointer-events-none crt-scanlines opacity-30" />

        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent/20" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent/20" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent/20" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent/20" />
      </div>
    </div>
  );
}
