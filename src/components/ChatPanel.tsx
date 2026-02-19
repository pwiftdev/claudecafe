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
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-white/90">Chat</span>
        </div>
        <span className="text-[11px] text-white/30 font-medium">{messages.length} msgs</span>
      </div>

      {/* Stats strip */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-white/30" />
          <span className="text-[11px] text-white/50 font-semibold">{viewerCount}</span>
        </div>
        {state && (
          <>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-white/30" />
              <span className="text-[11px] text-white/50 font-semibold">{formatUptime(state.uptime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-white/30" />
              <span className="text-[11px] text-white/50 font-semibold">{state.thoughts.length}</span>
            </div>
          </>
        )}
        <div className="ml-auto">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-accent animate-pulse-glow" : "bg-red-500"}`} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-3 space-y-2">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/20">No messages yet</p>
              <p className="text-[11px] text-white/15 mt-1">Be the first to ask TARD something</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="animate-slide-up">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-accent">
                      {msg.userId.slice(-2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] text-white/30 font-medium">anon#{msg.userId.slice(-4)}</span>
                      <span className="text-[10px] text-white/15">{formatTime(msg.timestamp)}</span>
                      {msg.responded ? (
                        <Check className="w-3 h-3 text-accent ml-auto shrink-0" />
                      ) : (
                        <Loader className="w-3 h-3 text-white/20 ml-auto shrink-0 animate-spin" />
                      )}
                    </div>
                    <p className="text-[12px] text-white/70 leading-relaxed break-words">
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
