"use client";

import { useState, KeyboardEvent } from "react";
import { Send, ArrowUp } from "lucide-react";

const CYRILLIC_RE = /[\u0400-\u04FF]/;

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [text, setText] = useState("");
  const [blocked, setBlocked] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (CYRILLIC_RE.test(trimmed)) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 2500);
      return;
    }

    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="w-full">
      {blocked && (
        <div className="mb-3 px-4 py-2.5 bg-red-500/20 border-4 border-red-500 rounded-2xl text-sm text-red-600 font-bold text-center animate-fade-in shadow-md">
          English only!
        </div>
      )}
      <div className="relative flex items-center">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Connecting..." : "Ask Kang and Kodos anything..."}
          disabled={disabled}
          maxLength={500}
          rows={1}
          className="w-full pl-6 pr-32 py-5 bg-card border-4 border-accent rounded-3xl text-[15px] text-foreground placeholder:text-foreground/40 resize-none focus:outline-none focus:border-accent-dark focus:shadow-elegant-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
          style={{ minHeight: "64px", maxHeight: "140px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 140)}px`;
          }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <span className="text-[12px] text-foreground/50 font-bold tabular-nums">
            {text.length}/500
          </span>
          <button
            onClick={handleSend}
            disabled={disabled || !hasText}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              hasText && !disabled
                ? "bg-accent text-background hover:bg-accent-dark shadow-lg shadow-accent/40 cursor-pointer border-2 border-accent-dark"
                : "bg-muted/30 text-foreground/30 cursor-not-allowed border-2 border-muted/50"
            }`}
          >
            <ArrowUp className="w-6 h-6" strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
