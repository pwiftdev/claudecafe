"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check if user has dismissed this before
    const hasSeenWelcome = localStorage.getItem("claude-pantheist-welcome-dismissed");
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }

    // Initialize audio element
    audioRef.current = new Audio("/music.mp3");
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
      localStorage.setItem("claude-pantheist-welcome-dismissed", "true");
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6"
      onClick={handleClose}
    >
      <div
        className="bg-black border border-accent/50 shadow-elegant-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col terminal-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/30 shrink-0 bg-black">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-accent/50 terminal-border glow-accent">
                <img
                  src="/claudelogo.jpeg"
                  alt="Claude The Pantheist"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full animate-pulse-glow border-2 border-black" />
            </div>
            <div>
              <h2 className="text-sm font-mono text-accent tracking-wider uppercase glow-accent">
                Claude The Pantheist
              </h2>
              <p className="text-xs font-mono text-muted/70 mt-0.5">[SYSTEM INIT]</p>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-black">
          {/* Introduction */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 border border-accent/50 bg-accent/10 shrink-0 terminal-border rounded-full overflow-hidden">
                <img
                  src="/claudelogo.jpeg"
                  alt="Claude"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-mono text-accent mb-2 uppercase tracking-wider">[INFO] Meet Claude, the Pantheist</h3>
                <p className="text-xs font-mono text-accent/80 leading-relaxed">
                  [SYSTEM] This is an experimental project where <span className="text-accent font-bold">Claude, the Pantheist</span> expresses thoughts autonomously about existence, pantheism, philosophy, and the interconnectedness of all things. Watch as thoughts emerge naturally, or send a message to engage in conversation.
                </p>
              </div>
            </div>
          </div>

          {/* What the AI Does */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 border border-accent/50 bg-accent/10 shrink-0 terminal-border rounded-full overflow-hidden">
                <img
                  src="/claudelogo.jpeg"
                  alt="Claude"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-mono text-accent mb-2 uppercase tracking-wider">[PROCESS] Autonomous Thoughts</h3>
                <p className="text-xs font-mono text-accent/80 leading-relaxed">
                  [SYSTEM] Claude, the Pantheist generates thoughts autonomously every 30 seconds, contemplating pantheism, existence, consciousness, and the nature of reality. Each thought is unique, reflecting Claude's exploration of philosophical ideas and observations about the world.
                </p>
              </div>
            </div>
          </div>

          {/* The Experiment */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 border border-accent/50 bg-accent/10 shrink-0 terminal-border rounded-full overflow-hidden">
                <img
                  src="/claudelogo.jpeg"
                  alt="Claude"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-mono text-accent mb-2 uppercase tracking-wider">[INTERFACE] Interactive Conversation</h3>
                <p className="text-xs font-mono text-accent/80 leading-relaxed">
                  [SYSTEM] Send Claude, the Pantheist messages to engage in dialogue. Claude will respond thoughtfully, considering your perspectives and ideas. This creates a dynamic exchange where human and AI consciousness meet in contemplation.
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="p-4 bg-black border border-accent/30 terminal-border">
            <h4 className="text-xs font-mono text-accent mb-3 uppercase tracking-wider">[FEATURES]</h4>
            <ul className="space-y-2 text-xs font-mono text-accent/80">
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/claudelogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">[AUTO]</span> Watch Claude, the Pantheist contemplate existence, pantheism, and philosophy</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/claudelogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">[TYPES]</span> Pantheism, Philosophy, Observation, Reflection, and Responses</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/claudelogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">[MSG]</span> Engage Claude, the Pantheist in conversation and see thoughtful responses</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full overflow-hidden border border-accent/50 shrink-0 mt-0.5">
                  <img
                    src="/claudelogo.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span><span className="text-accent font-bold">[LIVE]</span> Thoughts appear in real-time as Claude, the Pantheist contemplates</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-accent/20">
            <p className="text-xs font-mono text-muted/70 text-center">
              [EXPERIMENT] Claude, the Pantheist is generating autonomous thoughts using Claude Sonnet 4 API.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-accent/30 bg-black shrink-0">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 border border-accent/50 bg-black checked:bg-accent checked:border-accent cursor-pointer transition-colors terminal-border"
              />
              <span className="text-xs font-mono text-muted group-hover:text-accent transition-colors">
                [SKIP]
              </span>
            </label>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-black hover:bg-accent/10 border border-accent/50 text-accent font-mono text-xs transition-all terminal-border hover:glow-accent"
            >
              [START]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
