"use client";

import { useState } from "react";
import {
  MessageCircle,
  Brain,
  Send,
  Sparkles,
  Bot,
  User,
  ChevronDown,
} from "lucide-react";

type Tab = "chat" | "thoughts";

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  time: string;
  isSystem?: boolean;
}

interface Thought {
  id: number;
  text: string;
  time: string;
  type: "strategy" | "observation" | "decision" | "reflection";
}

const mockChat: ChatMessage[] = [
  {
    id: 1,
    user: "cryptoKing42",
    message: "Just tuned in, how's the cafe doing?",
    time: "2m ago",
  },
  {
    id: 2,
    user: "System",
    message: "AI purchased a new espresso machine for $2,400",
    time: "1m ago",
    isSystem: true,
  },
  {
    id: 3,
    user: "coffeeAddict",
    message: "Wow the revenue is insane today",
    time: "1m ago",
  },
  {
    id: 4,
    user: "baristaFan",
    message: "It just hired another barista! smart move",
    time: "45s ago",
  },
  {
    id: 5,
    user: "web3wizard",
    message: "The AI is so good at this game lol",
    time: "30s ago",
  },
  {
    id: 6,
    user: "System",
    message: "New menu item unlocked: Caramel Macchiato",
    time: "20s ago",
    isSystem: true,
  },
  {
    id: 7,
    user: "moonboy",
    message: "$CAFE to the moon!",
    time: "10s ago",
  },
  {
    id: 8,
    user: "degenTrader",
    message: "This is the most entertaining thing I've watched today",
    time: "5s ago",
  },
];

const mockThoughts: Thought[] = [
  {
    id: 1,
    text: "Customer satisfaction is at 87%. I should focus on reducing wait times before expanding the menu further. Hiring one more barista could help with the morning rush.",
    time: "30s ago",
    type: "observation",
  },
  {
    id: 2,
    text: "The new espresso machine investment should pay for itself within 3 game-days based on current order volume. Good ROI decision.",
    time: "1m ago",
    type: "reflection",
  },
  {
    id: 3,
    text: "Deciding between upgrading the seating area ($3,200) or adding a drive-through window ($5,800). The drive-through has a higher long-term return, but seating upgrades will boost satisfaction immediately...",
    time: "2m ago",
    type: "decision",
  },
  {
    id: 4,
    text: "I notice cake sales drop by 30% after 3 PM. I should consider adding afternoon specials or a happy hour discount to boost late-day revenue.",
    time: "4m ago",
    type: "strategy",
  },
  {
    id: 5,
    text: "Revenue trend is strongly positive. We've grown 12.4% since yesterday. The key driver is the premium coffee menu items -- customers are willing to pay more for specialty drinks.",
    time: "6m ago",
    type: "observation",
  },
];

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

export default function SidePanel() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="flex flex-col h-full border-l-2 border-border-bright bg-card">
      {/* Tab switcher */}
      <div className="flex border-b-2 border-border-bright">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 font-silk text-sm relative ${
            activeTab === "chat"
              ? "text-accent-light bg-accent/10"
              : "text-muted hover:text-muted-light hover:bg-card-hover"
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
          <span className="font-pixel text-[7px] px-1.5 py-0.5 bg-accent/20 text-accent-light border border-accent/30">
            24
          </span>
          {activeTab === "chat" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-light" />
          )}
        </button>
        <div className="w-0.5 bg-border-bright" />
        <button
          onClick={() => setActiveTab("thoughts")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 font-silk text-sm relative ${
            activeTab === "thoughts"
              ? "text-accent-light bg-accent/10"
              : "text-muted hover:text-muted-light hover:bg-card-hover"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>AI Thoughts</span>
          <div className="w-2 h-2 bg-success animate-blink" />
          {activeTab === "thoughts" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-light" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "chat" ? <ChatPanel /> : <ThoughtsPanel />}
      </div>
    </div>
  );
}

function ChatPanel() {
  return (
    <>
      <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
        {mockChat.map((msg) => (
          <div
            key={msg.id}
            className={`animate-slide-up ${msg.isSystem ? "my-1.5" : ""}`}
          >
            {msg.isSystem ? (
              <div className="flex items-center gap-2 px-2.5 py-2 bg-accent/8 border-2 border-accent/20 text-xs">
                <Sparkles className="w-3 h-3 text-accent-light shrink-0" />
                <span className="font-silk text-accent-light text-xs">{msg.message}</span>
                <span className="font-pixel text-[6px] text-muted ml-auto shrink-0">
                  {msg.time}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 px-2 py-1.5 hover:bg-border/20 group">
                <div className="w-6 h-6 bg-border-bright border border-border-bright flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-silk text-xs font-bold text-accent-light">
                      {msg.user}
                    </span>
                    <span className="font-pixel text-[6px] text-muted opacity-0 group-hover:opacity-100">
                      {msg.time}
                    </span>
                  </div>
                  <p className="font-silk text-sm text-foreground/85 leading-relaxed break-words">
                    {msg.message}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Viewer count */}
      <div className="px-3 py-1.5 border-t-2 border-border flex items-center gap-1.5">
        <div className="w-2 h-2 bg-success animate-blink" />
        <span className="font-pixel text-[6px] text-muted-light">1,247 VIEWERS</span>
        <ChevronDown className="w-3 h-3 text-muted ml-auto" />
      </div>

      {/* Chat input */}
      <div className="p-2.5 border-t-2 border-border-bright">
        <div className="flex items-center gap-2 bg-input-bg px-3 py-2 border-2 border-border-bright focus-within:border-accent/50">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent font-silk text-sm text-foreground placeholder:text-muted outline-none"
          />
          <button className="p-1.5 bg-accent hover:bg-accent-light text-background border-2 border-accent-dark pixel-shadow-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

function ThoughtsPanel() {
  return (
    <>
      {/* Current thought (featured) */}
      <div className="p-2.5 border-b-2 border-border-bright">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <Bot className="w-5 h-5 text-accent-light" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success animate-blink" />
          </div>
          <span className="font-pixel text-[7px] text-accent-light">
            CLAUDE IS THINKING
          </span>
          <div className="flex gap-1 ml-1">
            <div className="typing-dot w-1.5 h-1.5 bg-accent-light" />
            <div className="typing-dot w-1.5 h-1.5 bg-accent-light" />
            <div className="typing-dot w-1.5 h-1.5 bg-accent-light" />
          </div>
        </div>
        <div className="p-3 bg-accent/8 border-2 border-accent/30 pixel-shadow-sm">
          <p className="font-silk text-sm text-foreground/90 leading-relaxed">
            {mockThoughts[0].text}
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <ThoughtTag type={mockThoughts[0].type} />
            <span className="font-pixel text-[6px] text-muted">
              {mockThoughts[0].time}
            </span>
          </div>
        </div>
      </div>

      {/* Thought history */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-pixel text-[7px] text-muted uppercase tracking-wider">
            History
          </span>
          <div className="flex-1 h-0.5" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--color-border-bright) 0px, var(--color-border-bright) 3px, transparent 3px, transparent 6px)" }} />
        </div>
        {mockThoughts.slice(1).map((thought) => (
          <div
            key={thought.id}
            className="p-2.5 bg-chat-bg border-2 border-border hover:border-border-bright animate-slide-up"
          >
            <p className="font-silk text-sm text-foreground/75 leading-relaxed">
              {thought.text}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <ThoughtTag type={thought.type} />
              <span className="font-pixel text-[6px] text-muted">
                {thought.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ThoughtTag({ type }: { type: string }) {
  const colors = typeColors[type];
  return (
    <span
      className={`font-pixel text-[6px] px-2 py-0.5 border-2 ${colors.border} ${colors.bg} ${colors.text}`}
    >
      {typeLabels[type]}
    </span>
  );
}
