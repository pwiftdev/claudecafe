"use client";

import { useState, KeyboardEvent } from "react";
import { Send, ArrowUp } from "lucide-react";

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

  const hasText = text.trim().length > 0;

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Connecting..." : "Ask TARD anything ser..."}
          disabled={disabled}
          maxLength={500}
          rows={1}
          className="w-full pl-5 pr-28 py-4 bg-white/[0.04] border border-white/10 rounded-2xl text-[14px] text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-accent/50 focus:bg-white/[0.06] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ minHeight: "56px", maxHeight: "140px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 140)}px`;
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-[11px] text-white/20 font-medium tabular-nums">
            {text.length}/500
          </span>
          <button
            onClick={handleSend}
            disabled={disabled || !hasText}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              hasText && !disabled
                ? "bg-accent text-background hover:bg-accent-light shadow-lg shadow-accent/25 cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
