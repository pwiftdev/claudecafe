"use client";

import { useState, useEffect } from "react";
import { X, Brain, Coffee, Sparkles } from "lucide-react";
import Image from "next/image";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this before
    const hasSeenWelcome = localStorage.getItem("claudecafe-welcome-dismissed");
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (dontShowAgain) {
      localStorage.setItem("claudecafe-welcome-dismissed", "true");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-card border-2 border-border-bright pixel-shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border-bright bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src="/cclogo.png"
                alt="ClaudeCafe Logo"
                width={40}
                height={40}
                className="pixel-render"
              />
            </div>
            <div>
              <h2 className="font-pixel text-sm text-accent-light uppercase tracking-wider">
                What is ClaudeCafe?
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-7 h-7 border-2 border-border-bright hover:border-accent/40 hover:bg-card-hover text-muted hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Introduction */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-accent/10 border-2 border-accent/30 shrink-0">
                <Brain className="w-5 h-5 text-accent-light" />
              </div>
              <div className="flex-1">
                <h3 className="font-pixel text-xs text-accent-light uppercase mb-2">AI-Powered Cafe Management</h3>
                <p className="font-silk text-sm text-foreground/90 leading-relaxed">
                  ClaudeCafe is an experimental project that puts <span className="font-bold text-accent-light">Anthropic's Claude Sonnet 4</span> in the role of a coffee shop manager. Watch as the AI autonomously makes all the decisions needed to run a successful cafe business.
                </p>
              </div>
            </div>
          </div>

          {/* What the AI Does */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-success/10 border-2 border-success/30 shrink-0">
                <Coffee className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-pixel text-xs text-success uppercase mb-2">Real-Time Decision Making</h3>
                <p className="font-silk text-sm text-foreground/90 leading-relaxed">
                  The AI manages everything: hiring baristas, ordering supplies, setting prices, upgrading equipment, unlocking menu items, and optimizing operations—all in real-time. Every decision is made autonomously based on the current game state.
                </p>
              </div>
            </div>
          </div>

          {/* The Experiment */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-500/10 border-2 border-purple-500/30 shrink-0">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-pixel text-xs text-purple-400 uppercase mb-2">A Real-World Thinking Experiment</h3>
                <p className="font-silk text-sm text-foreground/90 leading-relaxed">
                  This is an experiment testing AI models in realistic business scenarios. We're observing how Claude Sonnet 4 handles complex decision-making, resource management, and strategic planning in a simulated environment that mirrors real-world challenges.
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="p-3 bg-card-hover/50 border-2 border-border rounded-sm">
            <h4 className="font-pixel text-[8px] text-accent-light uppercase mb-2">What You'll See:</h4>
            <ul className="space-y-1.5 font-silk text-xs text-foreground/80">
              <li className="flex items-start gap-2">
                <span className="text-accent-light mt-0.5">•</span>
                <span><strong>Live AI Thoughts:</strong> See Claude's reasoning process in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light mt-0.5">•</span>
                <span><strong>Autonomous Decisions:</strong> Watch the AI hire staff, manage inventory, and optimize operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light mt-0.5">•</span>
                <span><strong>Real-Time Stats:</strong> Track revenue, ratings, customer satisfaction, and more</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent-light mt-0.5">•</span>
                <span><strong>Cost Tracking:</strong> See the API costs for each AI decision</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-border">
            <p className="font-pixel text-[7px] text-muted text-center">
              This is a live experiment. The AI is making real decisions using Claude Sonnet 4 API.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t-2 border-border-bright bg-card shrink-0">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 border-2 border-border-bright bg-card checked:bg-accent checked:border-accent cursor-pointer"
              />
              <span className="font-pixel text-[7px] text-muted group-hover:text-foreground transition-colors">
                Don't show this again
              </span>
            </label>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-accent hover:bg-accent-light text-background border-2 border-accent-dark pixel-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-pixel text-[8px] uppercase"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
