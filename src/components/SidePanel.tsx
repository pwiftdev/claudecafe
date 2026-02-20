"use client";

import { Zap, MessageSquare, Reply } from "lucide-react";
import type { AIThought, AIAuthor } from "@/game/types";
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
    <div className="flex flex-col h-full bg-card/90 backdrop-blur-sm border-4 border-accent rounded-3xl overflow-hidden shadow-elegant-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-3 border-accent bg-accent/10">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-accent" />
          <span className="text-base font-black text-foreground" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>Kang and Kodos&apos; Thoughts</span>
        </div>
        <span className="text-[12px] text-foreground/60 font-bold bg-accent/20 px-2 py-1 rounded-lg">{thoughts.length} total</span>
      </div>

      {/* Current thought */}
      <div className="px-6 py-5 border-b-3 border-accent/30 bg-accent/5">
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
            <div className="flex items-center gap-2 mb-2">
              <AuthorBadge author={currentThought.author} />
              {currentThought.replyTo && (
                <div className="flex items-center gap-1.5">
                  <Reply className="w-3 h-3 text-accent/60" />
                  <span className="text-[11px] text-accent/70 font-medium">replying to anon#{currentThought.replyTo.slice(-4)}</span>
                </div>
              )}
            </div>
            <p className="text-[14px] text-foreground leading-relaxed mb-3 font-medium">
              {cleanText(currentThought.text)}
            </p>
            <div className="flex items-center gap-2">
              <ThoughtTag type={currentThought.type} />
              <span className="text-[12px] text-foreground/50 font-semibold">{currentThought.time}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/50 font-bold">Waiting for Kang and Kodos to observe...</p>
        )}
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3 space-y-2">
          {historyThoughts.map((thought) => (
            <div key={thought.id} className="group animate-slide-up">
              <div className="p-4 rounded-2xl bg-card/60 hover:bg-card/80 border-2 border-accent/30 hover:border-accent/50 transition-all cursor-pointer shadow-md hover:shadow-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <AuthorBadge author={thought.author} />
                  {thought.replyTo && (
                    <div className="flex items-center gap-1.5">
                      <Reply className="w-2.5 h-2.5 text-accent/50" />
                      <span className="text-[10px] text-accent/60 font-medium">replying to anon#{thought.replyTo.slice(-4)}</span>
                    </div>
                  )}
                </div>
                <p className="text-[13px] text-foreground/80 group-hover:text-foreground leading-relaxed mb-3 font-medium">
                  {cleanText(thought.text)}
                </p>
                <div className="flex items-center gap-2">
                  <ThoughtTag type={thought.type} />
                  <span className="text-[11px] text-foreground/50 font-semibold">{thought.time}</span>
                  {thought.cost !== undefined && (
                    <span className="text-[11px] text-foreground/40 ml-auto font-mono font-bold">
                      ${thought.cost.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {historyThoughts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-foreground/50 font-bold">No thoughts yet!</p>
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

function AuthorBadge({ author }: { author: AIAuthor }) {
  const isKang = author === "kang";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
      isKang 
        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
        : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
    }`} style={{ fontFamily: 'Simpsonfont, sans-serif' }}>
      {isKang ? "KANG" : "KODOS"}
    </span>
  );
}
