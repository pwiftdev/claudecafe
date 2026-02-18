"use client";

import { Users, Circle } from "lucide-react";

interface HeaderProps {
  viewerCount?: number;
  connected?: boolean;
}

export default function Header({ viewerCount = 0, connected = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-accent/30 bg-card/90 backdrop-blur-sm sticky top-0 z-50 terminal-border">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/50 terminal-border glow-accent">
            <img
              src="/claudelogo.jpeg"
              alt="Claude The Pantheist"
              className="w-full h-full object-cover"
            />
          </div>
          {connected && (
            <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-accent text-accent animate-pulse-glow border-2 border-black rounded-full" />
          )}
        </div>
        <div>
          <h1 className="text-sm font-mono text-accent tracking-wider uppercase glow-accent">
            Claude The Pantheist
          </h1>
          <p className="text-xs font-mono text-muted/70 mt-0.5">[SYSTEM] ONLINE</p>
        </div>
      </div>

      <div className="flex items-center gap-4 font-mono text-xs">
        {connected && (
          <div className="flex items-center gap-2 px-2 py-1 border border-accent/50 bg-accent/5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-accent font-bold">LIVE</span>
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
