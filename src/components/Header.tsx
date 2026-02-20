"use client";

import { Users, Circle, Zap, Volume2, VolumeX } from "lucide-react";
import { useMusic } from "@/contexts/MusicContext";

interface HeaderProps {
  viewerCount?: number;
  connected?: boolean;
}

export default function Header({ viewerCount = 0, connected = false }: HeaderProps) {
  const { isPlaying, toggleMusic } = useMusic();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card/90 backdrop-blur-sm border-b-4 border-accent sticky top-0 z-50 shadow-elegant">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl overflow-hidden ring-4 ring-accent/50 shadow-lg">
            <img src="/kangkodoslogo.png" alt="Kang and Kodos" className="w-full h-full object-cover" />
          </div>
          {connected && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-4 border-background animate-pulse-glow shadow-glow-live" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-foreground tracking-tight glow-accent" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>Kang and Kodos</h1>
            <span className="text-[10px] font-black bg-accent text-background px-2 py-1 rounded-lg uppercase tracking-wider shadow-md">AI</span>
          </div>
          <p className="text-[12px] text-foreground/70 font-bold">aliens from Rigel 7</p>
        </div>
      </div>

      {/* Right: Featured in The Simpsons + Music Toggle + LIVE + Viewer Count */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base text-foreground font-black" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>Featured in</span>
          <img 
            src="/thesimpsons.png" 
            alt="The Simpsons" 
            className="h-12 w-auto object-contain"
          />
        </div>
        
        {/* Music Toggle */}
        <button
          onClick={toggleMusic}
          className="flex items-center justify-center w-10 h-10 bg-accent/20 hover:bg-accent/30 border-4 border-accent rounded-xl shadow-md transition-all"
          aria-label={isPlaying ? "Mute music" : "Play music"}
        >
          {isPlaying ? (
            <Volume2 className="w-5 h-5 text-accent" />
          ) : (
            <VolumeX className="w-5 h-5 text-foreground/50" />
          )}
        </button>

        {connected && (
          <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 border-4 border-accent rounded-xl shadow-md">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-accent font-black text-[12px] tracking-wide">LIVE</span>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-2 bg-success/20 border-4 border-success rounded-xl shadow-md">
          <Users className="w-4 h-4 text-success" />
          <span className="text-success font-bold text-[12px]">{viewerCount.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
