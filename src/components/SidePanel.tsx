"use client";

import { Zap, MessageSquare } from "lucide-react";
import type { AIThought } from "@/game/types";
import { cleanText } from "@/utils/textCleaner";

const typeConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  degen: { label: "DEGEN", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/25" },
  meme:  { label: "MEME",  color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/25" },
  alpha: { label: "ALPHA", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25" },
  fud:   { label: "FUD",   color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25" },
  pump:  { label: "PUMP",  color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/25" },
  response: { label: "REPLY", color: "text-accent", bg: "bg-accent/10", border: "border-accent/25" },
};

interface SidePanelProps {
  thoughts: AIThought[];
}

export default function SidePanel({ thoughts }: SidePanelProps) {
  const currentThought = thoughts[0];
  const historyThoughts = thoughts.slice(1);

  return (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-white/90">TARD&apos;s Thoughts</span>
        </div>
        <span className="text-[11px] text-white/30 font-medium">{thoughts.length} total</span>
      </div>

      {/* Current thought */}
      <div className="px-5 py-4 border-b border-white/5 bg-accent/[0.03]">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-1">
            <div className="typing-dot w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="typing-dot w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="typing-dot w-1.5 h-1.5 rounded-full bg-accent" />
          </div>
          <span className="text-[11px] text-accent font-bold uppercase tracking-wider">Latest</span>
        </div>
        {currentThought ? (
          <div className="animate-fade-in">
            <p className="text-[13px] text-white/85 leading-relaxed mb-3">
              {cleanText(currentThought.text)}
            </p>
            <div className="flex items-center gap-2">
              <ThoughtTag type={currentThought.type} />
              <span className="text-[11px] text-white/25">{currentThought.time}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/30">Waiting for TARD to cook...</p>
        )}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3 space-y-2">
          {historyThoughts.map((thought) => (
            <div key={thought.id} className="group animate-slide-up">
              <div className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                <p className="text-[12px] text-white/60 group-hover:text-white/80 leading-relaxed mb-2.5">
                  {cleanText(thought.text)}
                </p>
                <div className="flex items-center gap-2">
                  <ThoughtTag type={thought.type} />
                  <span className="text-[10px] text-white/20">{thought.time}</span>
                  {thought.cost !== undefined && (
                    <span className="text-[10px] text-white/15 ml-auto font-mono">
                      ${thought.cost.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {historyThoughts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-white/20">No thoughts yet ser</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThoughtTag({ type }: { type: string }) {
  const cfg = typeConfig[type] || typeConfig.degen;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg} ${cfg.border} border`}>
      {cfg.label}
    </span>
  );
}
