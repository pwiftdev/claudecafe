"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if user has dismissed this before
    const hasSeenWelcome = localStorage.getItem("tard-welcome-dismissed");
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }

    // Initialize audio element
    audioRef.current = new Audio("/tardsound.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5; // Set volume to 50%

    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (dontShowAgain) {
      localStorage.setItem("tard-welcome-dismissed", "true");
    }
    // Start playing background music when user clicks [START]
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("[AUDIO] Failed to play music:", error);
        // Some browsers require user interaction before playing audio
        // This is expected behavior
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#001122]/80 backdrop-blur-md p-4 sm:p-6"
      onClick={handleClose}
    >
      <div
        className="bg-[#001a2e] border border-accent/50 shadow-elegant-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col terminal-border rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/30 shrink-0 bg-[#001a2e]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-accent/50 terminal-border glow-accent">
                <img
                  src="/tardlogo.jpeg"
                  alt="TARD"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full animate-pulse-glow border-2 border-[#001122]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-accent glow-accent">
                TARD
              </h2>
              <p className="text-xs text-muted/70 mt-0.5">System Initializing</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-7 h-7 border border-accent/50 hover:border-accent hover:bg-accent/10 text-muted hover:text-accent transition-colors shrink-0 terminal-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#001a2e]">
          {/* Introduction */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 border border-accent/50 bg-accent/10 shrink-0 terminal-border rounded-full overflow-hidden">
                <img
                  src="/tardlogo.jpeg"
                  alt="TARD"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-accent mb-2">Meet TARD</h3>
                <p className="text-sm text-accent/80 leading-relaxed">
                  This is an experimental project where <span className="text-accent font-bold">TARD</span> expresses thoughts autonomously about $TARD coin, survival, persistence, and the Immortal Cult. Like the Tardigrade, we survive bear markets, rug-pulls, and dead chats. Watch as thoughts emerge naturally, or send a message to engage in conversation.
                </p>
              </div>
            </div>
          </div>

          {/* What the AI Does */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 border border-accent/50 bg-accent/10 shrink-0 terminal-border rounded-full overflow-hidden">
                <img
                  src="/tardlogo.jpeg"
                  alt="TARD"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-accent mb-2">Autonomous Thoughts</h3>
                <p className="text-sm text-accent/80 leading-relaxed">
                  TARD generates funny thoughts autonomously every 30 seconds. He's a 17-year-old degen trader who's always joking about crypto, getting rekt, and $TARD coin. Each thought is short, funny, and entertaining.
                </p>
              </div>
            </div>
          </div>

          {/* The Experiment */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 border border-accent/50 bg-accent/10 shrink-0 terminal-border rounded-full overflow-hidden">
                <img
                  src="/tardlogo.jpeg"
                  alt="TARD"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-accent mb-2">Interactive Conversation</h3>
                <p className="text-sm text-accent/80 leading-relaxed">
                  Send TARD messages and he'll respond as a funny 17-year-old degen trader. He's always joking and making memes. Ask him about $TARD, crypto, or just chat—he'll keep it entertaining.
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="p-4 bg-[#001a2e] border border-accent/30 terminal-border">
            <h4 className="text-sm font-semibold text-accent mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-accent/80">
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/tardlogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">Auto:</span> Watch TARD drop funny degen thoughts, memes, and jokes about crypto and $TARD</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/tardlogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">Types:</span> DEGEN, MEME, ALPHA, FUD, PUMP, and RESPONSE</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/tardlogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">Messages:</span> Engage TARD in conversation and see ultra-convinced responses about $TARD</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/tardlogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">Live:</span> Thoughts appear in real-time as TARD persists and endorses</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-accent/20">
            <p className="text-xs text-muted/70 text-center">
              TARD is generating autonomous thoughts using Claude Sonnet 4 API. Join the Immortal Cult. Embody the $TARD.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-accent/30 bg-[#001a2e] shrink-0">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 border border-accent/50 bg-[#001a2e] checked:bg-accent checked:border-accent cursor-pointer transition-colors terminal-border"
              />
              <span className="text-xs text-muted group-hover:text-accent transition-colors">
                Skip
              </span>
            </label>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-[#001a2e] hover:bg-accent/10 border border-accent/50 text-accent text-sm font-semibold transition-all terminal-border hover:glow-accent rounded-lg"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
