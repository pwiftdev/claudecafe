"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface MusicContextType {
  isPlaying: boolean;
  toggleMusic: () => void;
  startMusic: () => void;
  stopMusic: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Initialize audio only once
    if (!audioRef.current) {
      audioRef.current = new Audio("/kangkodosmusic.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }

    // Handle audio events to sync state
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const audio = audioRef.current;
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Load saved music state (but don't auto-play - wait for user interaction)
    const savedState = localStorage.getItem("kangkodos-music-enabled");
    if (savedState === "true") {
      setIsPlaying(true);
    }

    // Cleanup function
    return () => {
      if (audio) {
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
      }
    };
  }, []);

  const startMusic = () => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            localStorage.setItem("kangkodos-music-enabled", "true");
          })
          .catch((err) => {
            console.error("[MUSIC] Failed to play:", err);
            setIsPlaying(false);
          });
      }
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem("kangkodos-music-enabled", "false");
    }
  };

  const toggleMusic = () => {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  };

  return (
    <MusicContext.Provider value={{ isPlaying, toggleMusic, startMusic, stopMusic }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
