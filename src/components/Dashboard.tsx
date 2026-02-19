"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Header from "./Header";
import SidePanel from "./SidePanel";
import MessageInput from "./MessageInput";
import WelcomeModal from "./WelcomeModal";
import BouncingLogos from "./BouncingLogos";
import ChatPanel from "./ChatPanel";
import type { AIThought, BroadcastState, UserMessage } from "@/game/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CYRILLIC_RE = /[\u0400-\u04FF]/;

if (typeof window !== "undefined") {
  console.log("[Dashboard] Backend URL:", BACKEND_URL);
}

export default function Dashboard() {
  const [thoughts, setThoughts] = useState<AIThought[]>([]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [state, setState] = useState<BroadcastState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{ position: number; totalQueued: number; estimatedWaitSeconds: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseNotification, setResponseNotification] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const socketIdRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WS] Connected to backend");
      setConnected(true);
      socketIdRef.current = socket.id || null;
    });

    socket.on("disconnect", () => {
      console.log("[WS] Disconnected from backend");
      setConnected(false);
    });

    socket.on("connected", (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    socket.on("state", (newState: BroadcastState) => {
      setState(newState);
      setThoughts(newState.thoughts);
      setMessages(newState.recentMessages.filter(m => !CYRILLIC_RE.test(m.text)));
      setViewerCount(newState.viewerCount);
      
      if (socketIdRef.current) {
        const userUnrespondedMessages = newState.recentMessages.filter(
          m => !m.responded && m.userId === socketIdRef.current
        );
        
        if (userUnrespondedMessages.length > 0) {
          const totalUnresponded = newState.recentMessages.filter(m => !m.responded).length;
          const userOldestMessage = userUnrespondedMessages[userUnrespondedMessages.length - 1];
          const allUnresponded = newState.recentMessages.filter(m => !m.responded);
          const userPosition = allUnresponded.findIndex(m => m.id === userOldestMessage.id) + 1;
          
          setQueueStatus({
            position: userPosition > 0 ? userPosition : totalUnresponded,
            totalQueued: totalUnresponded,
            estimatedWaitSeconds: totalUnresponded * 10
          });
        } else if (userUnrespondedMessages.length === 0 && queueStatus) {
          setQueueStatus(null);
        }
      }
    });

    socket.on("viewerCount", (count: number) => {
      setViewerCount(count);
    });

    socket.on("newThought", (thought: AIThought) => {
      setThoughts(prev => [thought, ...prev]);
    });

    socket.on("error", (error: { message: string }) => {
      console.error("[WS] Error:", error.message);
      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(null), 5000);
    });

    socket.on("queueStatus", (status: { position: number; totalQueued: number; estimatedWaitSeconds: number }) => {
      setQueueStatus(status);
    });

    socket.on("messageReceived", (message: { id: string; userId: string; text: string; timestamp: number; responded: boolean }) => {
      if (CYRILLIC_RE.test(message.text)) return;
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [message, ...prev];
      });
      if (socketIdRef.current && message.userId === socketIdRef.current) {
        sentMessagesRef.current.add(message.id);
      }
    });

    socket.on("messageResponded", (data: { messageId: string; response: AIThought }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, responded: true } : m));
      if (sentMessagesRef.current.has(data.messageId)) {
        setResponseNotification("TARD has responded to your message!");
        setTimeout(() => setResponseNotification(null), 5000);
        sentMessagesRef.current.delete(data.messageId);
        setQueueStatus(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (text: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit("sendMessage", text);
    }
  };

  return (
    <>
      <WelcomeModal />
      <div className="flex flex-col h-screen overflow-hidden bg-background relative">
        <div className="relative z-10 flex flex-col h-full">
          <Header viewerCount={viewerCount} connected={connected} />

          {/* Main Layout */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden flex gap-3 p-3">
              {/* Left: Chat panel */}
              <div className="hidden lg:block w-[320px] shrink-0">
                <ChatPanel messages={messages} state={state} viewerCount={viewerCount} connected={connected} />
              </div>

              {/* Center: Video panel */}
              <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/5 bg-black/40">
                <video
                  autoPlay loop muted playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/tard.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" />

                {/* Bouncing logos */}
                <BouncingLogos />

                {/* Center overlay text */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center px-6" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7), 0 0 80px rgba(0,0,0,0.5)' }}>
                    <p className="text-white text-lg sm:text-2xl font-black uppercase tracking-widest mb-1" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 4px 40px rgba(0,0,0,0.7)' }}>
                      They call us
                    </p>
                    <p className="text-accent text-4xl sm:text-6xl font-black uppercase tracking-wider mb-2" style={{ textShadow: '0 0 30px rgba(34,197,94,0.6), 0 0 60px rgba(34,197,94,0.3), 0 4px 20px rgba(0,0,0,0.9)' }}>
                      TARDs
                    </p>
                    <p className="text-white text-lg sm:text-2xl font-black uppercase tracking-widest mb-6" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 4px 40px rgba(0,0,0,0.7)' }}>
                      because we don&apos;t sell.
                    </p>
                    <p className="text-accent text-5xl sm:text-7xl font-black tracking-tighter" style={{ textShadow: '0 0 40px rgba(34,197,94,0.8), 0 0 80px rgba(34,197,94,0.4), 0 0 120px rgba(34,197,94,0.2), 0 4px 30px rgba(0,0,0,0.9)' }}>
                      $TARD
                    </p>
                  </div>
                </div>

                {!connected && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="inline-block mb-4">
                        <div className="w-10 h-10 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
                      </div>
                      <p className="text-white/30 text-sm">Connecting...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Thoughts */}
              <div className="hidden lg:block w-[320px] shrink-0">
                <SidePanel thoughts={thoughts} />
              </div>
            </div>

            {/* Bottom: Input Area — full width */}
            <div className="w-full px-3 pb-3 space-y-2">
              {/* Notifications */}
              {errorMessage && (
                <div className="w-full p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400 animate-fade-in rounded-xl flex items-center justify-center gap-2">
                  <span className="font-semibold">Error:</span>
                  <span className="text-red-400/80">{errorMessage}</span>
                </div>
              )}
              
              {responseNotification && (
                <div className="w-full p-3 bg-accent/10 border border-accent/20 text-sm text-accent animate-fade-in rounded-xl flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                  <span>{responseNotification}</span>
                </div>
              )}
              
              {queueStatus && queueStatus.totalQueued > 0 && (
                <div className="w-full p-3 bg-white/[0.03] border border-white/10 text-sm text-white/50 animate-fade-in rounded-xl flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                  <span>
                    {queueStatus.position > 0 ? (
                      <>Queue position {queueStatus.position}/{queueStatus.totalQueued}</>
                    ) : (
                      <>{queueStatus.totalQueued} message{queueStatus.totalQueued > 1 ? 's' : ''} pending</>
                    )}
                    {' · '}{Math.ceil(queueStatus.estimatedWaitSeconds)}s
                  </span>
                </div>
              )}
              
              <MessageInput onSend={sendMessage} disabled={!connected} />
            </div>
          </div>

          {/* Mobile panels */}
          <div className="lg:hidden border-t border-white/5 h-[50vh] shrink-0 flex">
            <div className="w-1/2 border-r border-white/5">
              <ChatPanel messages={messages} state={state} viewerCount={viewerCount} connected={connected} />
            </div>
            <div className="w-1/2">
              <SidePanel thoughts={thoughts} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
