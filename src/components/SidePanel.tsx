"use client";

import { Brain, Bot } from "lucide-react";
import type { AIThought } from "@/game/types";

const typeColors: Record<string, { border: string; bg: string; text: string }> = {
  strategy: { border: "border-blue-400/50", bg: "bg-blue-400/10", text: "text-blue-400" },
  observation: { border: "border-emerald-400/50", bg: "bg-emerald-400/10", text: "text-emerald-400" },
  decision: { border: "border-amber-400/50", bg: "bg-amber-400/10", text: "text-amber-400" },
  reflection: { border: "border-purple-400/50", bg: "bg-purple-400/10", text: "text-purple-400" },
};

const typeLabels: Record<string, string> = {
  strategy: "STRATEGY",
  observation: "OBSERVE",
  decision: "DECISION",
  reflection: "REFLECT",
};

interface SidePanelProps {
  thoughts: AIThought[];
}

export default function SidePanel({ thoughts }: SidePanelProps) {
  return (
    <div className="flex flex-col h-full border-l-2 border-border-bright bg-card">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 px-3 py-2.5 border-b-2 border-border-bright">
        <Brain className="w-4 h-4 text-accent-light" />
        <span className="font-silk text-sm text-accent-light">AI Thoughts</span>
        <div className="w-2 h-2 bg-success animate-blink" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ThoughtsPanel thoughts={thoughts} />
      </div>
    </div>
  );
}

function ThoughtsPanel({ thoughts }: { thoughts: AIThought[] }) {
  const currentThought = thoughts[0];
  const historyThoughts = thoughts.slice(1);

  return (
    <>
      {/* Current thought */}
      <div className="p-2.5 border-b-2 border-border-bright">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-accent-light" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success animate-blink" />
          </div>
          <span className="font-pixel text-[7px] text-accent-light">CLAUDE IS THINKING</span>
          <div className="flex gap-1 ml-1">
            <div className="typing-dot w-1.5 h-1.5 bg-accent-light" />
            <div className="typing-dot w-1.5 h-1.5 bg-accent-light" />
            <div className="typing-dot w-1.5 h-1.5 bg-accent-light" />
          </div>
        </div>
        {currentThought ? (
          <div className="p-3 bg-accent/8 border-2 border-accent/30 pixel-shadow-sm">
            <p className="font-silk text-sm text-foreground/90 leading-relaxed">
              {currentThought.text}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <ThoughtTag type={currentThought.type} />
              <span className="font-pixel text-[6px] text-muted">{currentThought.time}</span>
              {currentThought.cost !== undefined && (
                <span className="font-pixel text-[6px] text-accent-light ml-auto px-1.5 py-0.5 bg-accent/10 border border-accent/20">
                  ${currentThought.cost.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-accent/8 border-2 border-accent/30 pixel-shadow-sm">
            <p className="font-silk text-sm text-muted-light">Initializing cafe strategy...</p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-pixel text-[7px] text-muted uppercase tracking-wider">History</span>
          <div
            className="flex-1 h-0.5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, var(--color-border-bright) 0px, var(--color-border-bright) 3px, transparent 3px, transparent 6px)",
            }}
          />
        </div>
        {historyThoughts.map((thought) => (
          <div
            key={thought.id}
            className="p-2.5 bg-chat-bg border-2 border-border hover:border-border-bright animate-slide-up"
          >
            <p className="font-silk text-sm text-foreground/75 leading-relaxed">{thought.text}</p>
            <div className="flex items-center gap-2 mt-2">
              <ThoughtTag type={thought.type} />
              <span className="font-pixel text-[6px] text-muted">{thought.time}</span>
              {thought.cost !== undefined && (
                <span className="font-pixel text-[6px] text-accent-light ml-auto px-1.5 py-0.5 bg-accent/10 border border-accent/20">
                  ${thought.cost.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        ))}
        {historyThoughts.length === 0 && (
          <p className="font-silk text-xs text-muted text-center py-4">
            Thoughts will appear as the AI plays...
          </p>
        )}
      </div>
    </>
  );
}

function ThoughtTag({ type }: { type: string }) {
  const colors = typeColors[type] || typeColors.observation;
  return (
    <span className={`font-pixel text-[6px] px-2 py-0.5 border-2 ${colors.border} ${colors.bg} ${colors.text}`}>
      {typeLabels[type] || type.toUpperCase()}
    </span>
  );
}
