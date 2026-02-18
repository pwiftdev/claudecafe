"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Header from "./Header";
import SidePanel from "./SidePanel";
import MessageInput from "./MessageInput";
import WelcomeModal from "./WelcomeModal";
import ASCIIText from "./ASCIIText";
import type { AIThought, BroadcastState } from "@/game/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Debug: Log the backend URL being used
if (typeof window !== "undefined") {
  console.log("[Dashboard] Backend URL:", BACKEND_URL);
}

export default function Dashboard() {
  const [thoughts, setThoughts] = useState<AIThought[]>([]);
  const [state, setState] = useState<BroadcastState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [queueStatus, setQueueStatus] = useState<{ position: number; totalQueued: number; estimatedWaitSeconds: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [responseNotification, setResponseNotification] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const socketIdRef = useRef<string | null>(null);

  // WebSocket connection
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
      setViewerCount(newState.viewerCount);
      
      // Only update queue status if we have unresponded messages from THIS user
      if (socketIdRef.current) {
        const userUnrespondedMessages = newState.recentMessages.filter(
          m => !m.responded && m.userId === socketIdRef.current
        );
        
        if (userUnrespondedMessages.length > 0) {
          // Count total unresponded messages to estimate position
          const totalUnresponded = newState.recentMessages.filter(m => !m.responded).length;
          // Find position of user's oldest unresponded message
          const userOldestMessage = userUnrespondedMessages[userUnrespondedMessages.length - 1];
          const allUnresponded = newState.recentMessages.filter(m => !m.responded);
          const userPosition = allUnresponded.findIndex(m => m.id === userOldestMessage.id) + 1;
          
          setQueueStatus({
            position: userPosition > 0 ? userPosition : totalUnresponded,
            totalQueued: totalUnresponded,
            estimatedWaitSeconds: totalUnresponded * 10
          });
        } else if (userUnrespondedMessages.length === 0 && queueStatus) {
          // Clear queue status when user has no unresponded messages
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
      // Auto-clear error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    });

    socket.on("queueStatus", (status: { position: number; totalQueued: number; estimatedWaitSeconds: number }) => {
      setQueueStatus(status);
      // Keep queue status visible, don't auto-clear
    });

    socket.on("messageReceived", (message: { id: string; userId: string; text: string; timestamp: number; responded: boolean }) => {
      // Track messages sent by this user (check if userId matches socket.id)
      if (socketIdRef.current && message.userId === socketIdRef.current) {
        sentMessagesRef.current.add(message.id);
      }
    });

    socket.on("messageResponded", (data: { messageId: string; response: AIThought }) => {
      // Check if this was our message
      if (sentMessagesRef.current.has(data.messageId)) {
        // Show notification
        setResponseNotification("Claude has responded to your message!");
        // Clear notification after 5 seconds
        setTimeout(() => setResponseNotification(null), 5000);
        // Remove from sent messages
        sentMessagesRef.current.delete(data.messageId);
        // Clear queue status since we got a response
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
      // Note: We'll track the message ID when messageReceived event fires
    }
  };

  return (
    <>
      <WelcomeModal />
      <div className="flex flex-col h-screen overflow-hidden bg-black relative">
        {/* Matrix-style background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/5 via-transparent to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,0,0.03),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col h-full">
        <Header viewerCount={viewerCount} connected={connected} />

        {/* Main Layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left: Main Contemplation Area */}
            <div className="flex-1 lg:w-[calc(100%-420px)] flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
              {/* Video Background */}
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              >
                <source src="/video.mp4" type="video/mp4" />
              </video>
              {/* Content Overlay */}
              <div className="max-w-3xl w-full relative z-10">
                {!connected ? (
                  <div className="text-center">
                    <div className="inline-block mb-4">
                      <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                    <p className="text-muted/70 font-mono text-xs">[CONNECTING TO SYSTEM...]</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {thoughts.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted/60 font-mono text-xs">[WAITING FOR INPUT...]</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* ASCII Text Animation - Positioned at bottom */}
              <div className="absolute bottom-0 left-0 right-0 w-full z-10">
                <ASCIIText
                  text="$PANTHEIST"
                  enableWaves={true}
                  asciiFontSize={8}
                  textFontSize={180}
                  textColor="#00ff00"
                  planeBaseHeight={8}
                />
              </div>
            </div>

            {/* Right: Thoughts Sidebar */}
            <div className="hidden lg:block w-[420px] shrink-0">
              <SidePanel thoughts={thoughts} />
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-accent/30 p-4 bg-black/50">
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Error Message */}
              {errorMessage && (
                <div className="p-2 bg-black border border-accent/50 text-xs font-mono text-accent animate-fade-in terminal-border">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">[ERROR]</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}
              
              {/* Response Notification */}
              {responseNotification && (
                <div className="p-2 bg-black border border-accent/50 text-xs font-mono text-accent animate-fade-in terminal-border glow-accent">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow" />
                    <span className="text-accent">[RESPONSE]</span>
                    <span>{responseNotification}</span>
                  </div>
                </div>
              )}
              
              {/* Queue Status */}
              {queueStatus && queueStatus.totalQueued > 0 && (
                <div className="p-2 bg-black border border-accent/30 text-xs font-mono text-accent/80 animate-fade-in terminal-border">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-glow" />
                    <span>
                      {queueStatus.position > 0 ? (
                        <>[QUEUE] Position {queueStatus.position}/{queueStatus.totalQueued}</>
                      ) : (
                        <>[QUEUE] {queueStatus.totalQueued} message{queueStatus.totalQueued > 1 ? 's' : ''} pending</>
                      )}
                      {' | '}ETA: {Math.ceil(queueStatus.estimatedWaitSeconds / 60)}m
                    </span>
                  </div>
                </div>
              )}
              
              <MessageInput onSend={sendMessage} disabled={!connected} />
            </div>
          </div>
        </div>

        {/* Mobile: Side Panel below */}
        <div className="lg:hidden border-t border-accent/30 h-[50vh] shrink-0">
          <SidePanel thoughts={thoughts} />
        </div>
        </div>
      </div>
    </>
  );
}
