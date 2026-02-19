"use client";

import { Users, Circle } from "lucide-react";

interface HeaderProps {
  viewerCount?: number;
  connected?: boolean;
}

export default function Header({ viewerCount = 0, connected = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-accent/30 bg-card/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent/50 glow-accent">
            <img
              src="/tardlogo.jpeg"
              alt="TARD"
              className="w-full h-full object-cover"
            />
          </div>
          {connected && (
            <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-accent text-accent animate-pulse-glow border-2 border-[#001122] rounded-full" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold text-accent glow-accent">
            TARD
          </h1>
          <p className="text-xs text-muted/70 mt-0.5">System Online</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        {connected && (
          <div className="flex items-center gap-2 px-3 py-1.5 border border-accent/50 bg-accent/5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-accent font-bold text-xs">LIVE</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted">
          <Users className="w-3.5 h-3.5" />
          <span className="text-accent">{viewerCount.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
