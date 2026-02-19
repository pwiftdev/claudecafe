"use client";

import { useState, KeyboardEvent } from "react";
import { Send, MessageCircle } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setText("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-stretch gap-2">
        <div className="flex-1 relative">
          <div className="relative h-full">
            <span className="absolute left-3 top-3 text-accent text-sm pointer-events-none">$</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Connecting..." : "Share your thoughts..."}
              disabled={disabled}
              maxLength={500}
              rows={1}
              className="w-full h-full pl-8 pr-16 py-3 bg-[#001a2e] border border-accent/50 rounded-xl text-sm text-accent placeholder:text-muted/50 resize-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed terminal-border"
              style={{
                minHeight: "48px",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <span className="text-xs text-muted/60">
                {text.length}/500
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="px-4 py-3 bg-[#001a2e] hover:bg-accent/10 border border-accent/50 rounded-xl text-accent text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 terminal-border hover:glow-accent disabled:hover:glow-accent self-stretch"
          style={{
            minHeight: "48px",
          }}
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SEND</span>
        </button>
      </div>
    </div>
  );
}
