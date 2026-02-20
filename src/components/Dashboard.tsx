"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Play } from "lucide-react";
import Header from "./Header";
import SidePanel from "./SidePanel";
import MessageInput from "./MessageInput";
import WelcomeModal from "./WelcomeModal";
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
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mobileVideoPlaying, setMobileVideoPlaying] = useState(false);
  const [desktopVideoPlaying, setDesktopVideoPlaying] = useState(false);

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
        setResponseNotification("Kang and Kodos have responded to your message!");
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

  const handleVideoPlay = async (videoRef: React.RefObject<HTMLVideoElement | null>, setPlaying: (playing: boolean) => void) => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setPlaying(true);
      } catch (error) {
        console.error("Error playing video:", error);
      }
    }
  };

  // Check if videos are playing
  useEffect(() => {
    const mobileVideo = mobileVideoRef.current;
    const desktopVideo = desktopVideoRef.current;

    const handleMobilePlay = () => setMobileVideoPlaying(true);
    const handleMobilePause = () => setMobileVideoPlaying(false);
    const handleDesktopPlay = () => setDesktopVideoPlaying(true);
    const handleDesktopPause = () => setDesktopVideoPlaying(false);

    if (mobileVideo) {
      mobileVideo.addEventListener("play", handleMobilePlay);
      mobileVideo.addEventListener("pause", handleMobilePause);
      // Check initial state
      setMobileVideoPlaying(!mobileVideo.paused);
    }

    if (desktopVideo) {
      desktopVideo.addEventListener("play", handleDesktopPlay);
      desktopVideo.addEventListener("pause", handleDesktopPause);
      // Check initial state
      setDesktopVideoPlaying(!desktopVideo.paused);
    }

    return () => {
      if (mobileVideo) {
        mobileVideo.removeEventListener("play", handleMobilePlay);
        mobileVideo.removeEventListener("pause", handleMobilePause);
      }
      if (desktopVideo) {
        desktopVideo.removeEventListener("play", handleDesktopPlay);
        desktopVideo.removeEventListener("pause", handleDesktopPause);
      }
    };
  }, []);

  return (
    <>
      <WelcomeModal />
      <div className="flex flex-col h-screen bg-background relative">
        <div className="relative z-10 flex flex-col h-full">
          <Header viewerCount={viewerCount} connected={connected} />

          {/* Main Layout */}
          <div className="flex-1 flex flex-col lg:overflow-hidden">
            {/* Desktop: Horizontal layout */}
            <div className="hidden lg:flex flex-1 overflow-hidden gap-3 p-3">
              {/* Left: Chat panel */}
              <div className="w-[320px] shrink-0">
                <ChatPanel messages={messages} state={state} viewerCount={viewerCount} connected={connected} />
              </div>

              {/* Center: Video panel */}
              <div className="flex-1 relative overflow-hidden rounded-3xl border-4 border-accent bg-black/20 shadow-elegant-lg">
                <video
                  ref={desktopVideoRef}
                  autoPlay loop muted playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/kangkodosvideo.mp4" type="video/mp4" />
                </video>
                
                {/* Top text */}
                <div className="absolute top-4 left-0 right-0 z-10 flex justify-center">
                  <p className="text-white text-lg font-black px-4 py-2 bg-black/60 rounded-xl border-2 border-accent shadow-lg" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>
                    Yes, the LEFT one is Kang.
                  </p>
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
              <div className="w-[320px] shrink-0">
                <SidePanel thoughts={thoughts} />
              </div>
            </div>

            {/* Mobile: Vertical layout - Scrollable */}
            <div className="lg:hidden flex flex-col flex-1 overflow-y-auto min-h-0">
              {/* Video panel — uses transform scaling instead of object-fit for iOS Safari */}
              <div 
                className="w-full shrink-0 border-b-4 border-accent relative bg-black" 
                style={{ height: '70vh', minHeight: '500px', overflow: 'hidden' }}
                onClick={() => !mobileVideoPlaying && handleVideoPlay(mobileVideoRef, setMobileVideoPlaying)}
              >
                <video
                  ref={mobileVideoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  style={{
                    display: 'block',
                    minWidth: '100%',
                    minHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    position: 'relative',
                    top: '50%',
                    left: '50%',
                    WebkitTransform: 'translate(-50%, -50%) translateZ(0)',
                    transform: 'translate(-50%, -50%) translateZ(0)',
                  }}
                >
                  <source src="/kangkodosvideo.mp4" type="video/mp4" />
                </video>
                
                {/* Play button overlay - shows when video is not playing */}
                {!mobileVideoPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    style={{ zIndex: 2, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoPlay(mobileVideoRef, setMobileVideoPlaying);
                    }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-accent/90 rounded-full flex items-center justify-center shadow-lg border-4 border-accent">
                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                      </div>
                      <p className="text-white text-sm font-bold">Tap to play</p>
                    </div>
                  </div>
                )}
                
                {/* Top text */}
                <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none" style={{ zIndex: 3 }}>
                  <p className="text-white text-sm font-black px-3 py-1.5 bg-black/60 rounded-lg border-2 border-accent shadow-lg" style={{ fontFamily: 'Simpsonfont, sans-serif' }}>
                    Yes, the LEFT one is Kang.
                  </p>
                </div>

                {!connected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 3 }}>
                    <div className="text-center">
                      <div className="inline-block mb-2">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-accent rounded-full animate-spin" />
                      </div>
                      <p className="text-white/30 text-xs">Connecting...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thoughts panel */}
              <div className="h-[60vh] border-b-4 border-accent">
                <SidePanel thoughts={thoughts} />
              </div>

              {/* Chat panel */}
              <div className="min-h-[55vh]">
                <ChatPanel messages={messages} state={state} viewerCount={viewerCount} connected={connected} />
              </div>

              {/* Bottom: Input Area — full width */}
              <div className="w-full px-3 pb-3 pt-3 space-y-2">
                {/* Notifications */}
                {errorMessage && (
                  <div className="w-full p-4 bg-red-500/20 border-4 border-red-500 text-sm text-red-700 animate-fade-in rounded-2xl flex items-center justify-center gap-2 shadow-md font-bold">
                    <span className="font-black">Error:</span>
                    <span>{errorMessage}</span>
                  </div>
                )}
                
                {responseNotification && (
                  <div className="w-full p-4 bg-accent/20 border-4 border-accent text-sm text-accent-dark animate-fade-in rounded-2xl flex items-center justify-center gap-2 shadow-md font-bold">
                    <div className="w-3 h-3 bg-accent rounded-full animate-pulse-glow border-2 border-accent-dark" />
                    <span>{responseNotification}</span>
                  </div>
                )}
                
                {queueStatus && queueStatus.totalQueued > 0 && (
                  <div className="w-full p-4 bg-success/20 border-4 border-success text-sm text-[var(--color-success-dark)] animate-fade-in rounded-2xl flex items-center justify-center gap-2 shadow-md font-bold">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse-glow border-2 border-[var(--color-success-dark)]" />
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

            {/* Desktop: Bottom Input Area */}
            <div className="hidden lg:block w-full px-3 pb-3 space-y-2">
              {/* Notifications */}
              {errorMessage && (
                <div className="w-full p-4 bg-red-500/20 border-4 border-red-500 text-sm text-red-700 animate-fade-in rounded-2xl flex items-center justify-center gap-2 shadow-md font-bold">
                  <span className="font-black">Error:</span>
                  <span>{errorMessage}</span>
                </div>
              )}
              
              {responseNotification && (
                <div className="w-full p-4 bg-accent/20 border-4 border-accent text-sm text-accent-dark animate-fade-in rounded-2xl flex items-center justify-center gap-2 shadow-md font-bold">
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse-glow border-2 border-accent-dark" />
                  <span>{responseNotification}</span>
                </div>
              )}
              
              {queueStatus && queueStatus.totalQueued > 0 && (
                <div className="w-full p-4 bg-success/20 border-4 border-success text-sm text-[var(--color-success-dark)] animate-fade-in rounded-2xl flex items-center justify-center gap-2 shadow-md font-bold">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse-glow border-2 border-[var(--color-success-dark)]" />
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

        </div>
      </div>
    </>
  );
}
