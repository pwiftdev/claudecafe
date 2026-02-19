"use client";

import { Brain, Sparkles } from "lucide-react";
import type { AIThought } from "@/game/types";
import { cleanText } from "@/utils/textCleaner";

const typeColors: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  endorsement: { 
    border: "border-cyan-500/50", 
    bg: "bg-cyan-500/10", 
    text: "text-cyan-400",
    icon: "text-cyan-400"
  },
  philosophy: { 
    border: "border-cyan-400/50", 
    bg: "bg-cyan-400/10", 
    text: "text-cyan-300",
    icon: "text-cyan-300"
  },
  observation: { 
    border: "border-cyan-600/50", 
    bg: "bg-cyan-600/10", 
    text: "text-cyan-500",
    icon: "text-cyan-500"
  },
  reflection: { 
    border: "border-cyan-700/50", 
    bg: "bg-cyan-700/10", 
    text: "text-cyan-600",
    icon: "text-cyan-600"
  },
  response: { 
    border: "border-cyan-300/50", 
    bg: "bg-cyan-300/10", 
    text: "text-cyan-200",
    icon: "text-cyan-200"
  },
};

const typeLabels: Record<string, string> = {
  endorsement: "Endorsement",
  philosophy: "Philosophy",
  observation: "Observation",
  reflection: "Reflection",
  response: "Response",
};

interface SidePanelProps {
  thoughts: AIThought[];
}

export default function SidePanel({ thoughts }: SidePanelProps) {
  return (
    <div className="flex flex-col h-full border-l border-accent/30 bg-card/90 backdrop-blur-sm terminal-border rounded-l-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-accent/30">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="w-4 h-4 text-accent glow-accent" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow" />
          </div>
          <span className="text-sm font-semibold text-accent">Thoughts</span>
        </div>
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
      {/* Current thought - Featured */}
      <div className="px-4 py-4 border-b border-accent/20 bg-[#001a2e]/50 rounded-t-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3 h-3 text-accent glow-accent" />
          <span className="text-xs text-accent/80 font-semibold">Active</span>
          <div className="flex gap-1 ml-auto">
            <div className="typing-dot w-1 h-1 rounded-full bg-accent" />
            <div className="typing-dot w-1 h-1 rounded-full bg-accent" />
            <div className="typing-dot w-1 h-1 rounded-full bg-accent" />
          </div>
        </div>
        {currentThought ? (
          <div className="animate-fade-in">
            <div className="mb-3">
              <p className="text-sm text-accent leading-relaxed whitespace-pre-wrap glow-accent">
                {cleanText(currentThought.text)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <ThoughtTag type={currentThought.type} />
              <span className="text-muted">[{currentThought.time}]</span>
              {currentThought.cost !== undefined && (
                <span className="text-muted/70 ml-auto">
                  ${currentThought.cost.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-pulse-glow">
            <p className="text-sm text-muted/70">Waiting for input...</p>
          </div>
        )}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {historyThoughts.length > 0 && (
          <div className="mb-3">
            <span className="text-xs text-accent/60 font-semibold">Log</span>
            <div className="mt-1 h-px bg-accent/20" />
          </div>
        )}
        {historyThoughts.map((thought) => (
          <div
            key={thought.id}
            className="group animate-slide-up"
          >
            <div className="p-3 border border-accent/20 hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer terminal-border rounded-lg">
              <p className="text-xs text-accent/80 group-hover:text-accent leading-relaxed whitespace-pre-wrap mb-2">
                {cleanText(thought.text)}
              </p>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <ThoughtTag type={thought.type} />
                <span className="text-muted/70">[{thought.time}]</span>
                {thought.cost !== undefined && (
                  <span className="text-muted/60 ml-auto">
                    ${thought.cost.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {historyThoughts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted/60">
              No entries
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function ThoughtTag({ type }: { type: string }) {
  const colors = typeColors[type] || typeColors.observation;
  return (
    <span className={`text-xs px-2 py-0.5 border rounded-lg ${colors.border} ${colors.bg} ${colors.text} shrink-0`}>
      {typeLabels[type] || type}
    </span>
  );
}
