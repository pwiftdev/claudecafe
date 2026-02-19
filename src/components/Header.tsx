"use client";

import { Users, Circle, Zap } from "lucide-react";

interface HeaderProps {
  viewerCount?: number;
  connected?: boolean;
}

export default function Header({ viewerCount = 0, connected = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-card/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-accent/40 ring-offset-2 ring-offset-background">
            <img src="/tardlogo.jpeg" alt="TARD" className="w-full h-full object-cover" />
          </div>
          {connected && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-accent rounded-full border-2 border-background animate-pulse-glow" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-white tracking-tight">TARD</h1>
            <span className="text-[10px] font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded uppercase tracking-wider">AI</span>
          </div>
          <p className="text-[11px] text-white/40 font-medium">degen trader that never sells</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {connected && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-accent font-bold text-[11px]">LIVE</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
          <Users className="w-3.5 h-3.5 text-white/50" />
          <span className="text-white/70 font-semibold text-[11px]">{viewerCount.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
