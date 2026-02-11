"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Header from "./Header";
import GameEmbed from "./GameEmbed";
import SidePanel from "./SidePanel";
import StatsBar from "./StatsBar";
import type { GameStats, AIThought } from "@/game/types";
import type { BroadcastState } from "@/game/CafeGame";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

// Debug: Log the backend URL being used
if (typeof window !== "undefined") {
  console.log("[Dashboard] Backend URL:", BACKEND_URL);
  console.log("[Dashboard] Env var:", process.env.NEXT_PUBLIC_BACKEND_URL);
}

const defaultStats: GameStats = {
  coffeeSold: 0,
  cakesSold: 0,
  revenue: 0,
  baristasCount: 1,
  rating: 5.0,
  customersServed: 0,
  ordersToday: 0,
  profitMargin: 0,
  streak: 0,
  avgWaitTime: 0,
  day: 1,
  money: 100,
  tables: 2,
  maxTables: 8,
  unlockedItems: 3,
  totalItems: 12,
  upgrades: [],
  menuItemsList: [],
  stock: { coffeeBeans: 40, milk: 30 },
  pendingDeliveries: 0,
  fundsHistory: [{ time: 0, money: 100 }],
  financials: {
    totalIncome: 0, totalWages: 0, totalStockCost: 0,
    totalUpgrades: 0, totalTableCost: 0, totalUnlockCost: 0,
    dailyIncome: 0, dailyWages: 0, dailyExpenses: 0,
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [thoughts, setThoughts] = useState<AIThought[]>([]);
  const [gameState, setGameState] = useState<BroadcastState | null>(null);
  const [soundEvents, setSoundEvents] = useState<string[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const handleStatsUpdate = useCallback((s: GameStats) => setStats(s), []);
  const handleThoughtsUpdate = useCallback((t: AIThought[]) => setThoughts(t), []);

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
    });

    socket.on("disconnect", () => {
      console.log("[WS] Disconnected from backend");
      setConnected(false);
    });

    socket.on("connected", (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    socket.on("gameState", (state: BroadcastState) => {
      setGameState(state);
      if (state.viewerCount !== undefined) {
        setViewerCount(state.viewerCount);
      }
    });

    socket.on("viewerCount", (count: number) => {
      setViewerCount(count);
    });

    socket.on("soundEffect", (sound: string) => {
      setSoundEvents(prev => [...prev, sound]);
      // Clear sound events after a short delay
      setTimeout(() => {
        setSoundEvents(prev => prev.slice(1));
      }, 100);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header stats={stats} viewerCount={viewerCount} connected={connected} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <GameEmbed
              onStatsUpdate={handleStatsUpdate}
              onThoughtsUpdate={handleThoughtsUpdate}
              gameState={gameState}
              soundEvents={soundEvents}
              connected={connected}
            />
          </div>
          <StatsBar stats={stats} />
        </div>

        <div className="w-[380px] shrink-0 hidden lg:flex">
          <SidePanel thoughts={thoughts} />
        </div>
      </div>
    </div>
  );
}
