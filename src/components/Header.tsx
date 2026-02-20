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
    <header className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 bg-card/90 backdrop-blur-sm border-b-2 sm:border-b-3 md:border-b-4 border-accent sticky top-0 z-50 shadow-elegant">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
        <div className="relative">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl overflow-hidden ring-2 sm:ring-3 md:ring-4 ring-accent/50 shadow-lg">
            <img src="/kangkodoslogo.png" alt="Kang and Kodos" className="w-full h-full object-cover" />
          </div>
          {connected && (
            <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-success rounded-full border-2 sm:border-3 md:border-4 border-background animate-pulse-glow shadow-glow-live" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 sm:gap-1 md:gap-1.5">
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
            <h1 className="text-sm sm:text-base md:text-xl font-black text-foreground tracking-tight glow-accent" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>Kang and Kodos</h1>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black bg-accent text-background px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-0.5 md:py-1 rounded-md sm:rounded-lg uppercase tracking-wider shadow-md">AI</span>
          </div>
          <p className="text-[10px] sm:text-[11px] md:text-[12px] text-foreground/70 font-bold">aliens from Rigel 7</p>
        </div>
      </div>

      {/* Right: Featured in The Simpsons + Music Toggle + LIVE + Viewer Count */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
        <div className="hidden sm:flex items-center gap-1 md:gap-2">
          <span className="text-xs sm:text-sm md:text-base text-foreground font-black" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>Featured in</span>
          <img 
            src="/thesimpsons.png" 
            alt="The Simpsons" 
            className="h-8 sm:h-10 md:h-12 w-auto object-contain"
          />
        </div>
        
        {/* Music Toggle */}
        <button
          onClick={toggleMusic}
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-accent/20 hover:bg-accent/30 border-2 sm:border-3 md:border-4 border-accent rounded-lg sm:rounded-xl shadow-md transition-all"
          aria-label={isPlaying ? "Mute music" : "Play music"}
        >
          {isPlaying ? (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-accent" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-foreground/50" />
          )}
        </button>

        {connected && (
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-accent/20 border-2 sm:border-3 md:border-4 border-accent rounded-lg sm:rounded-xl shadow-md">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-pulse-glow" />
            <span className="text-accent font-black text-[10px] sm:text-[11px] md:text-[12px] tracking-wide">LIVE</span>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-success/20 border-2 sm:border-3 md:border-4 border-success rounded-lg sm:rounded-xl shadow-md">
          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-success" />
          <span className="text-success font-bold text-[10px] sm:text-[11px] md:text-[12px]">{viewerCount.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
