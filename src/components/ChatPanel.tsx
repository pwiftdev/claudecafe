"use client";

import { MessageSquare, Clock, Users, Zap, Check, Loader } from "lucide-react";
import type { UserMessage, BroadcastState } from "@/game/types";

interface ChatPanelProps {
  messages: UserMessage[];
  state: BroadcastState | null;
  viewerCount: number;
  connected: boolean;
}

function formatTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ChatPanel({ messages, state, viewerCount, connected }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card/90 backdrop-blur-sm border-4 border-success rounded-3xl overflow-hidden shadow-elegant-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-3 border-success bg-success/10">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-success" />
          <span className="text-base font-black text-foreground" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>Chat</span>
        </div>
        <span className="text-[12px] text-foreground/60 font-bold bg-success/20 px-2 py-1 rounded-lg">{messages.length} msgs</span>
      </div>

      {/* Stats strip */}
      <div className="px-6 py-4 border-b-3 border-success/30 bg-success/5 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-success" />
          <span className="text-[12px] text-foreground font-bold">{viewerCount}</span>
        </div>
        {state && (
          <>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-success" />
              <span className="text-[12px] text-foreground font-bold">{formatUptime(state.uptime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-success" />
              <span className="text-[12px] text-foreground font-bold">{state.thoughts.length}</span>
            </div>
          </>
        )}
        <div className="ml-auto">
          <div className={`w-3 h-3 rounded-full border-2 border-background ${connected ? "bg-success animate-pulse-glow shadow-glow-live" : "bg-red-500"}`} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-success/30 mx-auto mb-4" />
              <p className="text-sm text-foreground/60 font-bold">No messages yet</p>
              <p className="text-[12px] text-foreground/50 mt-2 font-semibold">Be the first to ask Kang and Kodos something</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="animate-slide-up">
              <div className="p-4 rounded-2xl bg-card/60 hover:bg-card/80 border-2 border-success/30 hover:border-success/50 transition-all shadow-md hover:shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-success/20 border-2 border-success flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-black text-success">
                      {msg.userId.slice(-2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[12px] text-foreground/70 font-bold">anon#{msg.userId.slice(-4)}</span>
                      <span className="text-[11px] text-foreground/50 font-semibold">{formatTime(msg.timestamp)}</span>
                      {msg.responded ? (
                        <Check className="w-4 h-4 text-success ml-auto shrink-0" />
                      ) : (
                        <Loader className="w-4 h-4 text-success/50 ml-auto shrink-0 animate-spin" />
                      )}
                    </div>
                    <p className="text-[13px] text-foreground/90 leading-relaxed break-words font-medium">
                      {msg.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
