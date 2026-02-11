"use client";

import Image from "next/image";
import { Zap, Users, Globe } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b-2 border-border-bright bg-card sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Image
          src="/cclogo.png"
          alt="ClaudeCafe Logo"
          width={40}
          height={40}
          className="pixel-render"
        />
        <div className="flex items-center gap-2.5">
          <h1 className="font-pixel text-sm text-accent-light tracking-wide">
            ClaudeCafe
          </h1>
          <span className="font-pixel text-[8px] px-2 py-1 bg-accent/20 text-accent-light pixel-border-accent pixel-shadow-sm">
            $CAFE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-live-pulse/15 border-2 border-live-pulse/40 pixel-shadow-sm">
            <div className="w-2 h-2 bg-live-pulse animate-blink" />
            <span className="font-pixel text-[7px] text-live-pulse">LIVE</span>
          </div>
        </div>

        {/* Meta stats */}
        <div className="hidden md:flex items-center gap-4 font-silk text-xs text-muted-light">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>Day 47</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>1,247 watching</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>Uptime: 23h 14m</span>
          </div>
        </div>
      </div>
    </header>
  );
}
