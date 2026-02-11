"use client";

import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import type { GameStats, AIThought } from "./types";

// ═══════════════════════════════════════════════════════════════
// BROADCAST STATE TYPES (mirror backend types)
// ═══════════════════════════════════════════════════════════════

type BaristaState = "idle" | "going_to_counter" | "taking_order" | "going_to_machine" | "making" | "going_to_serve" | "serving" | "going_to_table" | "taking_table_order" | "delivering_to_table" | "collecting_tip";
type CustomerState = "entering" | "queuing" | "at_counter" | "waiting_drink" | "going_to_table" | "sitting" | "leaving" | "waiting_for_table_service" | "consuming";
type ServiceType = "counter" | "table";

interface BaristaEntity {
  id: number;
  slotIndex: number;
  x: number;
  y: number;
  state: BaristaState;
  orderProgress: number;
  orderPrepTime: number;
  carryingOrder: boolean;
}

interface CustomerEntity {
  id: number;
  x: number;
  y: number;
  state: CustomerState;
  orderName: string;
  orderType: "coffee" | "cake";
  bobOffset: number;
  patienceTimer: number;
  maxPatience: number;
  bubbleVisible: boolean;
  serviceType: ServiceType;
  tableIndex: number;
  tipAmount: number;
}

interface MoneyPopupEntity {
  id: number;
  x: number;
  y: number;
  amount: string;
  timer: number;
  maxTimer: number;
}

export interface BroadcastState {
  baristas: BaristaEntity[];
  customers: CustomerEntity[];
  moneyPopups: MoneyPopupEntity[];
  purchasedTables: number;
  ambianceLevel: number;
  ingredientStock: { coffeeBeans: number; milk: number };
  cakeStock: { name: string; stock: number; unlocked: boolean }[];
  pendingOrderCount: number;
  stats: GameStats;
  thoughts: AIThought[];
  recentEvents: string[];
  viewerCount: number;
  gameTime: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const GAME_W = 20;
const GAME_H = 14;
const T = 16; // pixels per tile
const CHAR_W = 0.55;
const CHAR_H = 0.75;

const COUNTER_Y = 10;

// Animation constants
const WALK_BOB_SPEED = 8; // Speed of walking animation
const WALK_BOB_AMOUNT = 0.05; // Amount of vertical bobbing
const POSITION_LERP = 0.15; // Smoothness of movement (0-1)

const TABLE_POSITIONS = [
  { x: 3, y: 6 }, { x: 7, y: 6 }, { x: 12, y: 6 }, { x: 16, y: 6 },
  { x: 3, y: 3 }, { x: 7, y: 3 }, { x: 12, y: 3 }, { x: 16, y: 3 },
];

const CUSTOMER_COLORS = [
  "#e84040", "#4080e8", "#40c870", "#c040c0", "#e8a020",
  "#40b8b8", "#e86080", "#80b040", "#6060d0", "#d07030",
];

const HAIR_COLORS = ["#3a2018", "#1a1018", "#6b4226", "#d4a020", "#8b3010", "#2a1a30"];

// ═══════════════════════════════════════════════════════════════
// TEXTURE CREATION (unchanged — all rendering stays client-side)
// ═══════════════════════════════════════════════════════════════

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function makeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

function createCafeBackground(): THREE.CanvasTexture {
  const W = GAME_W * T;
  const H = GAME_H * T;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const cy = (gy: number) => (GAME_H - 1 - gy) * T;

  // ── FLOOR with enhanced wood texture ──
  for (let gx = 0; gx < GAME_W; gx++) {
    for (let gy = 0; gy < GAME_H; gy++) {
      const isLight = (gx + gy) % 2 === 0;
      const baseColor = isLight ? "#3a2820" : "#321e16";
      px(ctx, gx * T, cy(gy), T, T, baseColor);
      
      // Wood grain details
      px(ctx, gx * T + 3, cy(gy) + 3, 2, 2, isLight ? "#3e2c24" : "#2e1a14");
      px(ctx, gx * T + T - 5, cy(gy) + T - 5, 2, 2, isLight ? "#362418" : "#2a1812");
      
      // Add wood grain lines
      if (Math.random() > 0.7) {
        px(ctx, gx * T + Math.floor(Math.random() * T), cy(gy) + Math.floor(Math.random() * T), 1, 2, isLight ? "#2e1e14" : "#281a12");
      }
      
      // Subtle shine on some tiles
      if (isLight && Math.random() > 0.8) {
        px(ctx, gx * T + 2, cy(gy) + 2, 1, 1, "#4a3428");
      }
    }
  }

  // ── WALLS with enhanced texture ──
  const drawWall = (gx: number, gy: number) => {
    const x = gx * T, y = cy(gy);
    px(ctx, x, y, T, T, "#1a1420");
    
    // Wall highlights and shadows
    px(ctx, x, y, T, 1, "#241828");
    px(ctx, x, y + 8, T, 1, "#241828");
    px(ctx, x, y, 1, T, "#0e0a10"); // Left shadow
    px(ctx, x + T - 1, y, 1, T, "#241830"); // Right highlight
    
    if (gy % 2 === 0) {
      px(ctx, x + 8, y, 1, 8, "#241828");
      px(ctx, x, y + 8, 1, 8, "#241828");
    } else {
      px(ctx, x, y, 1, 8, "#241828");
      px(ctx, x + 8, y + 8, 1, 8, "#241828");
    }
    
    // Add subtle texture
    if (Math.random() > 0.6) {
      px(ctx, x + Math.floor(Math.random() * T), y + Math.floor(Math.random() * T), 1, 1, "#1e1628");
    }
  };

  // Draw walls
  for (let x = 0; x < GAME_W; x++) drawWall(x, GAME_H - 1);
  for (let x = 0; x < GAME_W; x++) {
    if (x === 18 || x === 17) continue;
    drawWall(x, 0);
  }
  for (let y = 0; y < GAME_H; y++) drawWall(0, y);
  for (let y = 0; y < GAME_H; y++) {
    if (y === 0 || y === 1) { drawWall(GAME_W - 1, y); continue; }
    drawWall(GAME_W - 1, y);
  }
  
  // ── WINDOWS on back wall ──
  const drawWindow = (gx: number, gy: number) => {
    const x = gx * T, y = cy(gy);
    // Window frame
    px(ctx, x, y, T * 2, T * 2, "#2a2438");
    px(ctx, x + 1, y + 1, T * 2 - 2, T * 2 - 2, "#4a5870");
    
    // Window panes with sky reflection
    const gradient = ctx.createLinearGradient(x + 2, y + 2, x + 2, y + T * 2 - 4);
    gradient.addColorStop(0, "#6a8aa8");
    gradient.addColorStop(1, "#4a6a88");
    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, T - 3, T * 2 - 4);
    ctx.fillRect(x + T + 1, y + 2, T - 3, T * 2 - 4);
    
    // Window cross bars
    px(ctx, x + 1, y + T, T * 2 - 2, 2, "#2a2438");
    px(ctx, x + T, y + 1, 2, T * 2 - 2, "#2a2438");
    
    // Window shine
    px(ctx, x + 3, y + 3, 3, 3, "rgba(255, 255, 255, 0.3)");
    px(ctx, x + T + 2, y + 3, 3, 3, "rgba(255, 255, 255, 0.2)");
  };
  
  drawWindow(4, GAME_H - 1);
  drawWindow(8, GAME_H - 1);
  drawWindow(12, GAME_H - 1);

  // ── DOOR ──
  for (const dx of [17, 18]) {
    const x = dx * T, y = cy(0);
    px(ctx, x, y, T, T, "#4a3828");
    px(ctx, x + 2, y + 2, T - 4, T - 4, "#5c4630");
    px(ctx, x + 4, y + 4, T - 8, T - 8, "#6b553a");
  }
  px(ctx, 17 * T + 2, cy(1) + 4, T * 2 - 4, T - 8, "#8b3010");
  px(ctx, 17 * T + 4, cy(1) + 6, T * 2 - 8, T - 12, "#a04020");

  // ── BEHIND COUNTER AREA ──
  for (let gx = 1; gx < GAME_W - 1; gx++) {
    for (let gy = COUNTER_Y; gy < GAME_H - 1; gy++) {
      const isLight = (gx + gy) % 2 === 0;
      px(ctx, gx * T, cy(gy), T, T, isLight ? "#2a2030" : "#221828");
      px(ctx, gx * T + 5, cy(gy) + 5, 2, 2, isLight ? "#2e2434" : "#261c2c");
    }
  }

  // ── COUNTER with enhanced wood texture ──
  for (let gx = 1; gx < 15; gx++) {
    const x = gx * T, y = cy(COUNTER_Y);
    px(ctx, x, y, T, T, "#6b4226");
    
    // Top surface with shine
    px(ctx, x, y, T, 3, "#9b7050");
    px(ctx, x + 2, y, T - 4, 1, "#ab8060"); // Shine highlight
    px(ctx, x, y + 3, T, 2, "#8b5e3c");
    
    // Wood grain
    for (let i = 0; i < 3; i++) {
      const grainX = x + Math.floor(Math.random() * T);
      const grainY = y + 5 + Math.floor(Math.random() * 6);
      px(ctx, grainX, grainY, 1, 2, "#5b3216");
    }
    
    // Shadow at bottom
    px(ctx, x, y + T - 2, T, 2, "#4a2e18");
    px(ctx, x, y + T - 3, T, 1, "#5a3e28"); // Gradient shadow
    
    // Side shadows
    if (gx === 1) px(ctx, x, y, 2, T, "#4a2e18");
    if (gx === 14) px(ctx, x + T - 2, y, 2, T, "#4a2e18");
    
    // Reflection on counter surface
    if (Math.random() > 0.7) {
      px(ctx, x + Math.floor(Math.random() * T), y + 1, 1, 1, "#ab8060");
    }
  }

  // ── COFFEE MACHINES with enhanced detail ──
  const drawMachine = (gx: number, gy: number) => {
    const x = gx * T, y = cy(gy);
    
    // Machine body with metallic look
    px(ctx, x + 2, y + 2, T - 4, T - 4, "#505568");
    px(ctx, x + 3, y + 3, T - 6, T - 6, "#606578");
    px(ctx, x + 4, y + 4, T - 8, T - 8, "#707888");
    
    // Metallic highlights
    px(ctx, x + 3, y + 3, 2, T - 6, "#707888"); // Left highlight
    px(ctx, x + T - 5, y + 3, 1, T - 6, "#404550"); // Right shadow
    px(ctx, x + 3, y + 3, T - 6, 2, "#808898"); // Top highlight
    
    // Power indicator light with glow
    px(ctx, x + 4, y + 2, 3, 2, "#e84040");
    px(ctx, x + 5, y + 2, 1, 1, "#ff6060"); // Bright center
    
    // Dispenser
    px(ctx, x + 5, y + 8, 6, 4, "#404550");
    px(ctx, x + 6, y + 10, 4, 2, "#3a3a48");
    px(ctx, x + 6, y + 9, 4, 1, "#505560"); // Dispenser highlight
    
    // Drip tray
    px(ctx, x + 5, y + 12, 6, 2, "#2a2a38");
    px(ctx, x + 6, y + 12, 4, 1, "#3a3a48"); // Tray edge
    
    // Steam/coffee drops (subtle detail)
    px(ctx, x + 7, y + 11, 1, 1, "#8b6540");
  };
  drawMachine(3, 12);
  drawMachine(7, 12);
  drawMachine(11, 12);

  // ── SHELVES ──
  for (let gx = 2; gx < 16; gx++) {
    if (gx === 3 || gx === 7 || gx === 11) continue;
    const x = gx * T, y = cy(12);
    px(ctx, x + 1, y + 4, T - 2, 3, "#5c4630");
    px(ctx, x + 3, y + 1, 4, 3, "#c8b090");
    px(ctx, x + 8, y + 1, 4, 3, "#d4a870");
  }

  // ── CASH REGISTER ──
  {
    const x = 14 * T, y = cy(COUNTER_Y);
    px(ctx, x + 2, y + 2, T - 4, T - 4, "#d4a020");
    px(ctx, x + 3, y + 3, T - 6, 4, "#e8b830");
    px(ctx, x + 4, y + 8, T - 8, 4, "#b88818");
    px(ctx, x + 5, y + 3, 2, 2, "#f0d060");
    px(ctx, x + 8, y + 3, 2, 2, "#f0d060");
  }

  // ── PLANTS ──
  const drawPlant = (gx: number, gy: number) => {
    const x = gx * T, y = cy(gy);
    px(ctx, x + 4, y + T - 6, 8, 6, "#5c3a20");
    px(ctx, x + 5, y + T - 7, 6, 2, "#6b4a2e");
    px(ctx, x + 3, y + 1, 4, 5, "#2d6b30");
    px(ctx, x + 7, y + 2, 5, 4, "#3a8838");
    px(ctx, x + 5, y, 3, 4, "#258028");
    px(ctx, x + 9, y + 1, 3, 3, "#2d6b30");
  };
  drawPlant(1, 1);
  drawPlant(15, 1);

  // ── MENU BOARD ──
  {
    const x = 15 * T, y = cy(12);
    px(ctx, x + 1, y + 1, T * 2 - 2, T - 2, "#2a2a3a");
    px(ctx, x + 2, y + 2, T * 2 - 4, T - 4, "#1e1e2e");
    for (let i = 0; i < 4; i++) {
      px(ctx, x + 4, y + 3 + i * 3, T - 4, 1, "#d4a020");
    }
    px(ctx, x + 3, y, T * 2 - 6, 2, "#d4a020");
  }

  // ── HANGING LIGHTS with glow ──
  for (let gx = 3; gx < GAME_W - 3; gx += 4) {
    const x = gx * T + 6;
    const y = cy(GAME_H - 1) + T - 2;
    
    // Light glow (radial gradient effect)
    const glowSize = 8;
    for (let dy = -glowSize; dy <= glowSize; dy++) {
      for (let dx = -glowSize; dx <= glowSize; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= glowSize) {
          const alpha = Math.max(0, (1 - dist / glowSize) * 0.15);
          ctx.fillStyle = `rgba(232, 192, 96, ${alpha})`;
          ctx.fillRect(x + 2 + dx, y + 2 + dy, 1, 1);
        }
      }
    }
    
    // Light fixture
    px(ctx, x, y - 2, 4, 2, "#2a2a3a"); // Cord
    px(ctx, x, y, 4, 4, "#e8c060");
    px(ctx, x + 1, y + 1, 2, 2, "#f8e090");
    px(ctx, x + 1, y, 2, 1, "#fffae0"); // Top shine
  }

  return makeTexture(canvas);
}

function createCharacterTexture(shirtColor: string, hairColor: string, isBarista: boolean): THREE.CanvasTexture {
  const W = 12, H = 16;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  // Enhanced shadow with gradient
  px(ctx, 2, 14, 8, 2, "rgba(0,0,0,0.4)");
  px(ctx, 3, 14, 6, 1, "rgba(0,0,0,0.2)");
  
  // Hair with highlights
  px(ctx, 3, 0, 6, 3, hairColor);
  px(ctx, 2, 1, 8, 2, hairColor);
  px(ctx, 4, 0, 2, 1, lightenColor(hairColor, 30)); // Hair highlight
  
  // Face with better shading
  px(ctx, 3, 3, 6, 3, "#e0b888");
  px(ctx, 3, 5, 6, 1, "#d4a878"); // Face shadow
  
  // Eyes with shine
  px(ctx, 4, 4, 1, 1, "#2a2a40");
  px(ctx, 7, 4, 1, 1, "#2a2a40");
  px(ctx, 4, 4, 1, 1, "#1a1a28");
  px(ctx, 7, 4, 1, 1, "#1a1a28");
  // Eye shine
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillRect(4, 3, 1, 1);
  ctx.fillRect(7, 3, 1, 1);
  
  // Shirt with shading
  px(ctx, 2, 6, 8, 5, shirtColor);
  px(ctx, 2, 10, 8, 1, darkenColor(shirtColor, 20)); // Shirt shadow
  
  if (isBarista) {
    // Apron with better detail
    px(ctx, 3, 7, 6, 4, "#f0e8d0");
    px(ctx, 3, 10, 6, 1, "#d8d0b8"); // Apron shadow
    px(ctx, 4, 7, 4, 1, "#d4a020"); // Apron tie
    px(ctx, 5, 7, 2, 1, "#e8b830"); // Tie highlight
  }
  
  // Arms with shading
  px(ctx, 1, 7, 1, 3, shirtColor);
  px(ctx, 10, 7, 1, 3, shirtColor);
  px(ctx, 1, 9, 1, 1, darkenColor(shirtColor, 25));
  px(ctx, 10, 9, 1, 1, darkenColor(shirtColor, 25));
  
  // Hands
  px(ctx, 1, 10, 1, 1, "#e0b888");
  px(ctx, 10, 10, 1, 1, "#e0b888");
  
  // Legs with shading
  px(ctx, 3, 11, 3, 2, "#2a2a40");
  px(ctx, 7, 11, 3, 2, "#2a2a40");
  px(ctx, 3, 12, 3, 1, "#1a1a28"); // Leg shadow
  px(ctx, 7, 12, 3, 1, "#1a1a28");
  
  // Shoes
  px(ctx, 3, 13, 3, 1, "#1a1a28");
  px(ctx, 7, 13, 3, 1, "#1a1a28");
  px(ctx, 3, 13, 1, 1, "#2a2a38"); // Shoe highlight

  return makeTexture(c);
}

// Helper functions for color manipulation
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function createMoneyTexture(amount: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 16;
  const ctx = c.getContext("2d")!;
  
  // Glow effect
  ctx.shadowColor = "#40d870";
  ctx.shadowBlur = 4;
  
  // Outline for better visibility
  ctx.font = "bold 12px monospace";
  ctx.strokeStyle = "#0a3020";
  ctx.lineWidth = 3;
  ctx.textAlign = "center";
  ctx.strokeText(`+$${amount}`, 32, 12);
  
  // Main text with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 16);
  gradient.addColorStop(0, "#60f890");
  gradient.addColorStop(1, "#40d870");
  ctx.fillStyle = gradient;
  ctx.fillText(`+$${amount}`, 32, 12);
  
  return makeTexture(c);
}

function createProgressTexture(progress: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 20;
  c.height = 4;
  const ctx = c.getContext("2d")!;
  
  // Background with border
  px(ctx, 0, 0, 20, 4, "#1a1a28");
  px(ctx, 0, 0, 20, 1, "#0a0a10"); // Top shadow
  px(ctx, 0, 3, 20, 1, "#2a2a38"); // Bottom highlight
  
  // Progress bar with gradient
  const barWidth = Math.floor(18 * progress);
  if (barWidth > 0) {
    const gradient = ctx.createLinearGradient(1, 0, 1, 4);
    gradient.addColorStop(0, "#e8b830");
    gradient.addColorStop(0.5, "#d4a020");
    gradient.addColorStop(1, "#b88818");
    ctx.fillStyle = gradient;
    ctx.fillRect(1, 1, barWidth, 2);
    
    // Shine on progress bar
    px(ctx, 1, 1, Math.max(1, barWidth - 2), 1, "#f0d060");
  }
  
  return makeTexture(c);
}

function createBubbleTexture(text: string, isCoffee: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 48;
  const ctx = c.getContext("2d")!;

  // Soft shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Bubble with gradient
  const gradient = ctx.createLinearGradient(2, 2, 2, 32);
  gradient.addColorStop(0, "#fffef5");
  gradient.addColorStop(1, "#f8f6e8");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(2, 2, 124, 30, 8);
  ctx.fill();
  
  // Reset shadow for stroke
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#8a7a6a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(2, 2, 124, 30, 8);
  ctx.stroke();

  // Pointer with shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 3;
  ctx.fillStyle = "#f8f6e8";
  ctx.beginPath();
  ctx.moveTo(54, 32);
  ctx.lineTo(64, 44);
  ctx.lineTo(74, 32);
  ctx.closePath();
  ctx.fill();
  
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#8a7a6a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(54, 32);
  ctx.lineTo(64, 44);
  ctx.lineTo(74, 32);
  ctx.stroke();
  ctx.fillStyle = "#f8f6e8";
  ctx.fillRect(56, 30, 16, 4);

  // Icon circle with gradient
  const iconGradient = ctx.createRadialGradient(18, 17, 0, 18, 17, 8);
  iconGradient.addColorStop(0, isCoffee ? "#8b5a20" : "#e068a0");
  iconGradient.addColorStop(1, isCoffee ? "#6b3a10" : "#d04880");
  ctx.fillStyle = iconGradient;
  ctx.beginPath();
  ctx.arc(18, 17, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Icon highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.beginPath();
  ctx.arc(16, 15, 3, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isCoffee ? "☕" : "🍰", 18, 17);

  // Text with subtle shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
  ctx.shadowBlur = 1;
  ctx.fillStyle = "#2a1a10";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 32, 17);

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function createTableTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 48;
  c.height = 48;
  const ctx = c.getContext("2d")!;
  
  // Table legs with shadows
  const ch = "#4a3422";
  px(ctx, 4, 20, 8, 8, ch);
  px(ctx, 36, 20, 8, 8, ch);
  px(ctx, 20, 4, 8, 8, ch);
  px(ctx, 20, 36, 8, 8, ch);
  
  // Leg highlights
  px(ctx, 5, 20, 2, 6, "#5a4432");
  px(ctx, 37, 20, 2, 6, "#5a4432");
  px(ctx, 21, 5, 2, 6, "#5a4432");
  px(ctx, 21, 37, 2, 6, "#5a4432");
  
  // Table top with wood grain
  px(ctx, 10, 14, 28, 20, "#6b4a2e");
  px(ctx, 12, 12, 24, 24, "#7a5838");
  px(ctx, 14, 10, 20, 28, "#7a5838");
  px(ctx, 16, 16, 16, 16, "#8b6840");
  
  // Wood grain details
  for (let i = 0; i < 8; i++) {
    const x = 16 + Math.floor(Math.random() * 16);
    const y = 16 + Math.floor(Math.random() * 16);
    px(ctx, x, y, 1, 2, "#6b5030");
  }
  
  // Table shine
  px(ctx, 18, 14, 12, 2, "#9b7850");
  px(ctx, 20, 16, 8, 1, "#ab8860");
  
  return makeTexture(c);
}

function createRugTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 40;
  c.height = 20;
  const ctx = c.getContext("2d")!;
  px(ctx, 0, 0, 40, 20, "#8b3020");
  px(ctx, 2, 2, 36, 16, "#a04030");
  px(ctx, 4, 4, 32, 12, "#b85040");
  px(ctx, 12, 7, 4, 6, "#d4a020");
  px(ctx, 24, 7, 4, 6, "#d4a020");
  px(ctx, 18, 5, 4, 10, "#d4a020");
  return makeTexture(c);
}

function createPaintingTexture(accent: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 20;
  c.height = 16;
  const ctx = c.getContext("2d")!;
  px(ctx, 0, 0, 20, 16, "#5c4630");
  px(ctx, 2, 2, 16, 12, "#2a2040");
  px(ctx, 4, 8, 12, 4, accent);
  px(ctx, 7, 4, 6, 4, "#e8c060");
  return makeTexture(c);
}

function createFlowerTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 12;
  c.height = 16;
  const ctx = c.getContext("2d")!;
  
  // Vase with gradient
  px(ctx, 3, 10, 6, 6, "#6b8bb0");
  px(ctx, 4, 12, 4, 3, "#7ba0c0");
  px(ctx, 4, 10, 2, 2, "#8bb0d0"); // Vase highlight
  px(ctx, 7, 14, 1, 1, "#5a7a98"); // Vase shadow
  
  // Flowers with more detail
  px(ctx, 2, 2, 3, 3, "#e84060");
  px(ctx, 2, 2, 1, 1, "#ff6080"); // Flower highlight
  
  px(ctx, 5, 0, 3, 3, "#f0d060");
  px(ctx, 6, 0, 1, 1, "#ffe080"); // Flower highlight
  
  px(ctx, 7, 3, 3, 3, "#e060c0");
  px(ctx, 8, 3, 1, 1, "#ff80d0"); // Flower highlight
  
  // Stems with shading
  px(ctx, 3, 5, 1, 5, "#40a040");
  px(ctx, 6, 3, 1, 7, "#40a040");
  px(ctx, 8, 5, 1, 5, "#40a040");
  px(ctx, 3, 6, 1, 1, "#50b050"); // Stem highlight
  px(ctx, 6, 4, 1, 1, "#50b050");
  px(ctx, 8, 6, 1, 1, "#50b050");
  
  return makeTexture(c);
}

function createWarmGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255, 220, 140, 0.35)");
  g.addColorStop(0.5, "rgba(255, 200, 100, 0.12)");
  g.addColorStop(1, "rgba(255, 180, 60, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function createGoldTrimTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 6;
  const ctx = c.getContext("2d")!;
  px(ctx, 0, 0, 64, 6, "#d4a020");
  px(ctx, 0, 1, 64, 4, "#e8b830");
  for (let x = 4; x < 64; x += 8) px(ctx, x, 2, 2, 2, "#f0d060");
  return makeTexture(c);
}

function createTrayTexture(isCoffee: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 12;
  const ctx = c.getContext("2d")!;
  
  // Tray
  px(ctx, 2, 8, 12, 3, "#8b6540");
  px(ctx, 3, 9, 10, 1, "#ab8560");
  
  // Cup or plate
  if (isCoffee) {
    // Coffee cup
    px(ctx, 6, 4, 4, 4, "#6b4a2e");
    px(ctx, 7, 5, 2, 2, "#4a3020");
    px(ctx, 6, 4, 4, 1, "#8b6a4e");
    // Steam
    px(ctx, 7, 2, 1, 1, "rgba(255, 255, 255, 0.6)");
    px(ctx, 8, 1, 1, 1, "rgba(255, 255, 255, 0.4)");
  } else {
    // Cake plate
    px(ctx, 5, 5, 6, 3, "#e8e4d9");
    px(ctx, 6, 3, 4, 2, "#d4a870");
    px(ctx, 7, 2, 2, 1, "#ff6090");
  }
  
  return makeTexture(c);
}

function createStockHudCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; tex: THREE.CanvasTexture } {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return { canvas, ctx, tex };
}

// ═══════════════════════════════════════════════════════════════
// PARTICLE SYSTEM — for steam, sparkles, and effects
// ═══════════════════════════════════════════════════════════════

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: "steam" | "sparkle" | "heart" | "star" | "dust";
}

class ParticleSystem {
  particles: Particle[] = [];
  
  addSteam(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.2,
        y: y,
        vx: (Math.random() - 0.5) * 0.02,
        vy: 0.02 + Math.random() * 0.01,
        life: 1,
        maxLife: 1,
        size: 0.08 + Math.random() * 0.04,
        color: "rgba(255, 255, 255, 0.4)",
        type: "steam",
      });
    }
  }
  
  addSparkle(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 0.05,
        vy: Math.sin(angle) * 0.05,
        life: 1,
        maxLife: 1,
        size: 0.06,
        color: "#40d870",
        type: "sparkle",
      });
    }
  }
  
  addHeart(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0.03,
      life: 1,
      maxLife: 1,
      size: 0.15,
      color: "#ff6090",
      type: "heart",
    });
  }
  
  addDust(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 0.1,
      y: y,
      vx: (Math.random() - 0.5) * 0.01,
      vy: -0.01,
      life: 1,
      maxLife: 1,
      size: 0.03,
      color: "rgba(200, 180, 160, 0.3)",
      type: "dust",
    });
  }
  
  update(deltaTime: number = 0.016) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime;
      
      // Fade out
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  clear() {
    this.particles = [];
  }
}

// ═══════════════════════════════════════════════════════════════
// SOUND MANAGER — procedural chiptune sounds via Web Audio API
// ═══════════════════════════════════════════════════════════════

class SoundManager {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try { this.ctx = new AudioContext(); } catch { return null; }
    }
    return this.ctx;
  }

  resume() { if (this.ctx?.state === "suspended") this.ctx.resume(); }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  private noise(dur: number, vol: number, filterFreq: number) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const len = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass"; filt.frequency.value = filterFreq; filt.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.value = vol * 0.2;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start();
  }

  cashRegister() { this.tone(880, 0.08, "square", 0.35); this.tone(1320, 0.12, "square", 0.35, 0.08); }
  doorBell() { this.tone(660, 0.12, "sine", 0.2); this.tone(880, 0.2, "sine", 0.2, 0.1); }
  coffeeBrew() { this.noise(0.35, 0.2, 2500); }
  customerAngry() { this.tone(280, 0.1, "sawtooth", 0.2); this.tone(180, 0.18, "sawtooth", 0.2, 0.08); }
  deliveryArrive() { this.tone(440, 0.07, "square", 0.2); this.tone(554, 0.07, "square", 0.2, 0.07); this.tone(660, 0.14, "square", 0.25, 0.14); }
  upgrade() { this.tone(523, 0.08, "square", 0.25); this.tone(659, 0.08, "square", 0.25, 0.08); this.tone(784, 0.14, "square", 0.3, 0.16); }
  outOfStock() { this.tone(200, 0.12, "sawtooth", 0.15); this.tone(150, 0.22, "sawtooth", 0.15, 0.1); }
  newDay() { this.tone(440, 0.1, "triangle", 0.15); this.tone(554, 0.1, "triangle", 0.15, 0.12); this.tone(660, 0.1, "triangle", 0.15, 0.24); this.tone(880, 0.2, "triangle", 0.2, 0.36); }

  playSound(name: string) {
    switch (name) {
      case "cashRegister": this.cashRegister(); break;
      case "doorBell": this.doorBell(); break;
      case "coffeeBrew": this.coffeeBrew(); break;
      case "customerAngry": this.customerAngry(); break;
      case "deliveryArrive": this.deliveryArrive(); break;
      case "upgrade": this.upgrade(); break;
      case "outOfStock": this.outOfStock(); break;
      case "newDay": this.newDay(); break;
    }
  }

  dispose() { this.ctx?.close(); }
}

// ═══════════════════════════════════════════════════════════════
// CLIENT-SIDE RENDERER — receives state, renders with Three.js
// ═══════════════════════════════════════════════════════════════

class CafeRenderer {
  scene: THREE.Scene;
  characterGroup: THREE.Group;
  uiGroup: THREE.Group;
  particleGroup: THREE.Group;
  sound = new SoundManager();
  particles = new ParticleSystem();
  needsRenderCallback: (() => void) | null = null;

  // Track meshes by entity ID
  baristaMeshes: Map<number, THREE.Mesh> = new Map();
  baristaTrays: Map<number, THREE.Mesh> = new Map();
  customerMeshes: Map<number, { body: THREE.Mesh; bubble: THREE.Mesh | null; bubbleVisible: boolean }> = new Map();
  progressMeshes: Map<number, THREE.Mesh> = new Map();
  popupMeshes: Map<number, THREE.Mesh> = new Map();
  particleMeshes: THREE.Mesh[] = [];
  tipMeshes: Map<number, THREE.Mesh> = new Map();
  
  // Cache for progress textures to avoid recreation
  progressTextureCache: Map<number, THREE.CanvasTexture> = new Map();
  lastStockState: string = "";
  lastBaristaProgress: Map<number, number> = new Map();
  
  // Smooth movement tracking
  baristaPositions: Map<number, { x: number; y: number; targetX: number; targetY: number; walkTime: number }> = new Map();
  customerPositions: Map<number, { x: number; y: number; targetX: number; targetY: number; walkTime: number }> = new Map();
  
  // Particle effect timers
  steamTimer: number = 0;
  lastBaristaStates: Map<number, BaristaState> = new Map();
  triggerCameraShake?: (intensity: number) => void;

  sharedGeo = new THREE.PlaneGeometry(CHAR_W, CHAR_H);
  progressGeo = new THREE.PlaneGeometry(0.6, 0.12);
  popupGeo = new THREE.PlaneGeometry(1.2, 0.3);
  bubbleGeo = new THREE.PlaneGeometry(1.6, 0.6);
  tableGeo = new THREE.PlaneGeometry(3, 3);
  tableMeshes: THREE.Mesh[] = [];
  decorMeshes: { mesh: THREE.Mesh; minLevel: number }[] = [];

  baristaTextures: THREE.CanvasTexture[] = [];
  customerTextures: THREE.CanvasTexture[] = [];

  stockHudCanvas: HTMLCanvasElement;
  stockHudCtx: CanvasRenderingContext2D;
  stockHudTex: THREE.CanvasTexture;
  stockHudMesh: THREE.Mesh;
  stockHudGeo: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.characterGroup = new THREE.Group();
    this.uiGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();
    scene.add(this.characterGroup);
    scene.add(this.uiGroup);
    scene.add(this.particleGroup);

    // Create table sprites
    const tableTex = createTableTexture();
    for (let i = 0; i < TABLE_POSITIONS.length; i++) {
      const tMat = new THREE.MeshBasicMaterial({ map: tableTex, transparent: true, alphaTest: 0.1 });
      const tMesh = new THREE.Mesh(this.tableGeo, tMat);
      tMesh.position.set(TABLE_POSITIONS[i].x, TABLE_POSITIONS[i].y, 0.15);
      tMesh.visible = false;
      scene.add(tMesh);
      this.tableMeshes.push(tMesh);
    }

    // Create ambiance decorations
    this.createDecorations(scene);

    // Stock HUD
    const hud = createStockHudCanvas();
    this.stockHudCanvas = hud.canvas;
    this.stockHudCtx = hud.ctx;
    this.stockHudTex = hud.tex;
    this.stockHudGeo = new THREE.PlaneGeometry(GAME_W, 1);
    const hudMat = new THREE.MeshBasicMaterial({ map: this.stockHudTex, transparent: true });
    this.stockHudMesh = new THREE.Mesh(this.stockHudGeo, hudMat);
    this.stockHudMesh.position.set(GAME_W / 2, GAME_H - 0.5, 5);
    scene.add(this.stockHudMesh);

    // Pre-create textures
    this.baristaTextures = [
      createCharacterTexture("#d4a020", "#3a2018", true),
      createCharacterTexture("#d4a020", "#1a1018", true),
      createCharacterTexture("#d4a020", "#6b4226", true),
    ];

    this.customerTextures = CUSTOMER_COLORS.map((c, i) =>
      createCharacterTexture(c, HAIR_COLORS[i % HAIR_COLORS.length], false)
    );
  }

  createDecorations(scene: THREE.Scene) {
    const add = (tex: THREE.CanvasTexture, x: number, y: number, w: number, h: number, z: number, minLvl: number, additive = false) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        ...(additive ? { blending: THREE.AdditiveBlending, depthWrite: false } : { alphaTest: 0.1 }),
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.visible = false;
      scene.add(mesh);
      this.decorMeshes.push({ mesh, minLevel: minLvl });
    };

    add(createRugTexture(), 17, 1.8, 2.5, 1.2, 0.05, 1);
    add(createPaintingTexture("#4080a0"), 1.3, 5, 1.0, 0.8, 0.25, 2);
    add(createPaintingTexture("#a06040"), 18.7, 5, 1.0, 0.8, 0.25, 2);
    add(createFlowerTexture(), 5, 10.5, 0.5, 0.7, 0.35, 3);
    add(createFlowerTexture(), 10, 10.5, 0.5, 0.7, 0.35, 3);
    const glowTex = createWarmGlowTexture();
    add(glowTex, 5, 5, 3, 3, 0.03, 4, true);
    add(glowTex, 10, 5, 3, 3, 0.03, 4, true);
    add(glowTex, 15, 5, 3, 3, 0.03, 4, true);
    add(createGoldTrimTexture(), 7.5, 10.15, 13, 0.25, 0.36, 5);
  }

  updateStockHud(state: BroadcastState) {
    const ctx = this.stockHudCtx;
    const W = this.stockHudCanvas.width;
    const H = this.stockHudCanvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, H);
    bgGradient.addColorStop(0, "rgba(20, 20, 30, 0.95)");
    bgGradient.addColorStop(1, "rgba(12, 12, 20, 0.85)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);
    
    // Top glow line
    const glowGradient = ctx.createLinearGradient(0, 0, W, 0);
    glowGradient.addColorStop(0, "rgba(255, 200, 100, 0)");
    glowGradient.addColorStop(0.5, "rgba(255, 200, 100, 0.2)");
    glowGradient.addColorStop(1, "rgba(255, 200, 100, 0)");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, W, 2);
    
    // Bottom border
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(0, H - 1, W, 1);

    let x = 10;

    const drawItem = (label: string, value: number, warn: number, crit: number, dotColor: string) => {
      const c = value <= crit ? "#e84040" : value <= warn ? "#e8a020" : dotColor;
      
      // Glow effect for status dot
      ctx.shadowColor = c;
      ctx.shadowBlur = 8;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + 4, H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner bright dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = lightenColor(c, 30);
      ctx.beginPath();
      ctx.arc(x + 4, H / 2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowColor = "transparent";
      x += 14;

      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.fillStyle = "#8090a0";
      ctx.textBaseline = "top";
      ctx.fillText(label, x, 4);

      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.fillStyle = value <= crit ? "#e84040" : value <= warn ? "#e8a020" : "#40c870";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(value), x, H - 3);

      const labelW = ctx.measureText(label).width;
      const valW = ctx.measureText(String(value)).width;
      x += Math.max(labelW, valW) + 14;
    };

    const sep = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(x - 4, 5, 1, H - 10);
      x += 6;
    };

    drawItem("BEANS", state.ingredientStock.coffeeBeans, 15, 5, "#8b6540");
    sep();
    drawItem("MILK", state.ingredientStock.milk, 10, 4, "#d0d8e8");

    for (const cake of state.cakeStock) {
      if (x > W - 80) break;
      sep();
      const short = cake.name.length > 9 ? cake.name.slice(0, 7) + ".." : cake.name;
      drawItem(short.toUpperCase(), cake.stock, 5, 2, "#d4a070");
    }

    if (state.pendingOrderCount > 0) {
      sep();
      ctx.fillStyle = "#c0a040";
      ctx.beginPath();
      ctx.arc(x + 4, H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      x += 14;
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.fillStyle = "#c0a040";
      ctx.textBaseline = "top";
      ctx.fillText("ARRIVING", x, 4);
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.fillStyle = "#e8c060";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${state.pendingOrderCount} order${state.pendingOrderCount > 1 ? "s" : ""}`, x, H - 3);
    }

    this.stockHudTex.needsUpdate = true;
  }

  // ═══════════════════════════════════════════════════════════════
  // APPLY SERVER STATE — sync meshes with server-provided entities
  // ═══════════════════════════════════════════════════════════════

  applyState(state: BroadcastState) {
    // Update tables visibility
    for (let i = 0; i < this.tableMeshes.length; i++) {
      this.tableMeshes[i].visible = i < state.purchasedTables;
    }

    // Update decorations based on ambiance level
    for (const d of this.decorMeshes) {
      d.mesh.visible = state.ambianceLevel >= d.minLevel;
    }

    // ── BARISTAS ──
    const serverBaristaIds = new Set(state.baristas.map(b => b.id));

    // Remove baristas that no longer exist
    for (const [id, mesh] of this.baristaMeshes) {
      if (!serverBaristaIds.has(id)) {
        this.characterGroup.remove(mesh);
        (mesh.material as THREE.MeshBasicMaterial).dispose();
        this.baristaMeshes.delete(id);
        // Also remove progress bar
        const progMesh = this.progressMeshes.get(id);
        if (progMesh) {
          this.uiGroup.remove(progMesh);
          (progMesh.material as THREE.MeshBasicMaterial).map?.dispose();
          (progMesh.material as THREE.MeshBasicMaterial).dispose();
          this.progressMeshes.delete(id);
        }
      }
    }

    // Create or update baristas
    for (const b of state.baristas) {
      let mesh = this.baristaMeshes.get(b.id);
      let posData = this.baristaPositions.get(b.id);
      
      if (!mesh) {
        const tex = this.baristaTextures[b.slotIndex % this.baristaTextures.length];
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
        mesh = new THREE.Mesh(this.sharedGeo, mat);
        this.characterGroup.add(mesh);
        this.baristaMeshes.set(b.id, mesh);
        posData = { x: b.x, y: b.y, targetX: b.x, targetY: b.y, walkTime: 0 };
        this.baristaPositions.set(b.id, posData);
      }
      
      // Update target position
      if (posData) {
        posData.targetX = b.x;
        posData.targetY = b.y;
        
        // Smooth interpolation
        const dx = posData.targetX - posData.x;
        const dy = posData.targetY - posData.y;
        const isMoving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;
        
        if (isMoving) {
          posData.x += dx * POSITION_LERP;
          posData.y += dy * POSITION_LERP;
          posData.walkTime += 0.1;
          this.needsRenderCallback?.(); // Keep rendering while moving
        } else {
          posData.x = posData.targetX;
          posData.y = posData.targetY;
        }
        
        // Walking animation bobbing
        const walkBob = isMoving ? Math.sin(posData.walkTime * WALK_BOB_SPEED) * WALK_BOB_AMOUNT : 0;
        mesh.position.set(posData.x, posData.y + walkBob, 0.6 - posData.y * 0.01);
      } else {
        mesh.position.set(b.x, b.y, 0.6 - b.y * 0.01);
      }
      
      // Show tray when carrying order
      if (b.carryingOrder) {
        let trayMesh = this.baristaTrays.get(b.id);
        if (!trayMesh) {
          // Find customer to determine what's on the tray
          const customer = state.customers.find(c => c.tableIndex >= 0);
          const isCoffee = customer ? customer.orderType === "coffee" : true;
          const trayTex = createTrayTexture(isCoffee);
          const trayMat = new THREE.MeshBasicMaterial({ map: trayTex, transparent: true, alphaTest: 0.1 });
          const trayGeo = new THREE.PlaneGeometry(0.3, 0.25);
          trayMesh = new THREE.Mesh(trayGeo, trayMat);
          this.uiGroup.add(trayMesh);
          this.baristaTrays.set(b.id, trayMesh);
        }
        trayMesh.position.set(posData ? posData.x : b.x, (posData ? posData.y : b.y) + 0.35, 0.85);
      } else {
        const trayMesh = this.baristaTrays.get(b.id);
        if (trayMesh) {
          this.uiGroup.remove(trayMesh);
          (trayMesh.material as THREE.MeshBasicMaterial).map?.dispose();
          (trayMesh.material as THREE.MeshBasicMaterial).dispose();
          trayMesh.geometry.dispose();
          this.baristaTrays.delete(b.id);
        }
      }

      // Progress bar for making state
      if (b.state === "making" && b.orderPrepTime > 0) {
        let progMesh = this.progressMeshes.get(b.id);
        const progress = Math.min(1, Math.max(0, b.orderProgress / b.orderPrepTime));
        const progressKey = Math.floor(progress * 20); // Cache by 5% increments
        const lastProgress = this.lastBaristaProgress.get(b.id) ?? -1;
        
        // Only update texture if progress changed significantly (5% or more)
        const needsTextureUpdate = Math.abs(progress - lastProgress) >= 0.05;
        this.lastBaristaProgress.set(b.id, progress);
        
        if (!progMesh) {
          // Create mesh if it doesn't exist
          let progTex = this.progressTextureCache.get(progressKey);
          if (!progTex) {
            progTex = createProgressTexture(progress);
            this.progressTextureCache.set(progressKey, progTex);
          }
          const progMat = new THREE.MeshBasicMaterial({ map: progTex, transparent: true });
          progMesh = new THREE.Mesh(this.progressGeo, progMat);
          progMesh.position.set(b.x, b.y + 0.5, 0.9);
          this.uiGroup.add(progMesh);
          this.progressMeshes.set(b.id, progMesh);
        } else {
          // Update position always
          progMesh.position.set(b.x, b.y + 0.5, 0.9);
          
          // Only update texture if progress changed significantly
          if (needsTextureUpdate) {
            const currentTex = (progMesh.material as THREE.MeshBasicMaterial).map;
            const cachedTex = this.progressTextureCache.get(progressKey);
            
            if (cachedTex && currentTex !== cachedTex) {
              // Dispose old texture if it's not cached
              if (currentTex && !Array.from(this.progressTextureCache.values()).includes(currentTex as THREE.CanvasTexture)) {
                currentTex.dispose();
              }
              (progMesh.material as THREE.MeshBasicMaterial).map = cachedTex;
              (progMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
            } else if (!cachedTex) {
              // Create and cache new texture
              const newTex = createProgressTexture(progress);
              this.progressTextureCache.set(progressKey, newTex);
              if (currentTex && !Array.from(this.progressTextureCache.values()).includes(currentTex as THREE.CanvasTexture)) {
                currentTex.dispose();
              }
              (progMesh.material as THREE.MeshBasicMaterial).map = newTex;
              (progMesh.material as THREE.MeshBasicMaterial).needsUpdate = true;
            }
          }
        }
      } else {
        const progMesh = this.progressMeshes.get(b.id);
        if (progMesh) {
          this.uiGroup.remove(progMesh);
          const mat = progMesh.material as THREE.MeshBasicMaterial;
          // Don't dispose cached textures
          if (mat.map) {
            const tex = mat.map as THREE.CanvasTexture;
            if (!Array.from(this.progressTextureCache.values()).includes(tex)) {
              tex.dispose();
            }
          }
          mat.dispose();
          this.progressMeshes.delete(b.id);
          this.lastBaristaProgress.delete(b.id);
        }
      }
    }

    // ── CUSTOMERS ──
    const serverCustomerIds = new Set(state.customers.map(c => c.id));

    // Remove customers that no longer exist
    for (const [id, entry] of this.customerMeshes) {
      if (!serverCustomerIds.has(id)) {
        this.characterGroup.remove(entry.body);
        (entry.body.material as THREE.MeshBasicMaterial).dispose();
        if (entry.bubble) {
          this.uiGroup.remove(entry.bubble);
          (entry.bubble.material as THREE.MeshBasicMaterial).map?.dispose();
          (entry.bubble.material as THREE.MeshBasicMaterial).dispose();
        }
        this.customerMeshes.delete(id);
      }
    }

    // Create or update customers
    for (const c of state.customers) {
      let entry = this.customerMeshes.get(c.id);
      let posData = this.customerPositions.get(c.id);
      
      if (!entry) {
        const texIndex = c.id % this.customerTextures.length;
        const tex = this.customerTextures[texIndex];
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
        const body = new THREE.Mesh(this.sharedGeo, mat);
        this.characterGroup.add(body);

        // Create speech bubble
        const bubbleTex = createBubbleTexture(c.orderName, c.orderType === "coffee");
        const bubbleMat = new THREE.MeshBasicMaterial({ map: bubbleTex, transparent: true });
        const bubble = new THREE.Mesh(this.bubbleGeo, bubbleMat);
        this.uiGroup.add(bubble);

        entry = { body, bubble, bubbleVisible: c.bubbleVisible };
        this.customerMeshes.set(c.id, entry);
        posData = { x: c.x, y: c.y, targetX: c.x, targetY: c.y, walkTime: 0 };
        this.customerPositions.set(c.id, posData);
      }

      // Update target position
      if (posData) {
        posData.targetX = c.x;
        posData.targetY = c.y;
        
        // Smooth interpolation
        const dx = posData.targetX - posData.x;
        const dy = posData.targetY - posData.y;
        const isMoving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;
        
        if (isMoving) {
          posData.x += dx * POSITION_LERP;
          posData.y += dy * POSITION_LERP;
          posData.walkTime += 0.1;
          this.needsRenderCallback?.(); // Keep rendering while moving
        } else {
          posData.x = posData.targetX;
          posData.y = posData.targetY;
        }
        
        // Walking animation bobbing
        const walkBob = isMoving ? Math.sin(posData.walkTime * WALK_BOB_SPEED) * WALK_BOB_AMOUNT : 0;
        entry.body.position.set(posData.x, posData.y + c.bobOffset + walkBob, 0.6 - posData.y * 0.01);
      } else {
        entry.body.position.set(c.x, c.y + c.bobOffset, 0.6 - c.y * 0.01);
      }

      // Update bubble
      if (entry.bubble && posData) {
        entry.bubble.visible = c.bubbleVisible;
        entry.bubble.position.set(posData.x, posData.y + 0.65, 0.85);

        // Flash bubble red when patience is low (needs continuous rendering)
        if (c.bubbleVisible && c.patienceTimer < 8) {
          const flash = Math.sin(Date.now() / 166) > 0; // ~6Hz flash
          (entry.bubble.material as THREE.MeshBasicMaterial).color.set(flash ? 0xff8080 : 0xffffff);
          this.needsRenderCallback?.(); // Force render for animation
        } else if (c.bubbleVisible) {
          (entry.bubble.material as THREE.MeshBasicMaterial).color.set(0xffffff);
        }
      }
      
      // Show tip icon for customers who left tips
      if (c.tipAmount > 0 && c.state === "leaving") {
        let tipMesh = this.tipMeshes.get(c.id);
        if (!tipMesh && c.tableIndex >= 0) {
          const tipTex = createMoneyTexture(c.tipAmount.toFixed(1));
          const tipMat = new THREE.MeshBasicMaterial({ map: tipTex, transparent: true });
          tipMesh = new THREE.Mesh(this.popupGeo, tipMat);
          tipMesh.position.set(posData ? posData.x : c.x, (posData ? posData.y : c.y) + 0.3, 0.9);
          this.uiGroup.add(tipMesh);
          this.tipMeshes.set(c.id, tipMesh);
          
          // Add tip to money
          this.showMoneyPopup(posData ? posData.x : c.x, posData ? posData.y : c.y, c.tipAmount);
        }
      }
    }
    
    // Clean up tip meshes for customers who left
    for (const [id, mesh] of this.tipMeshes) {
      if (!state.customers.find(c => c.id === id)) {
        this.uiGroup.remove(mesh);
        (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
        (mesh.material as THREE.MeshBasicMaterial).dispose();
        this.tipMeshes.delete(id);
      }
    }

    // ── MONEY POPUPS ──
    const serverPopupIds = new Set(state.moneyPopups.map(p => p.id));

    for (const [id, mesh] of this.popupMeshes) {
      if (!serverPopupIds.has(id)) {
        this.uiGroup.remove(mesh);
        (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
        (mesh.material as THREE.MeshBasicMaterial).dispose();
        this.popupMeshes.delete(id);
      }
    }

    for (const p of state.moneyPopups) {
      let mesh = this.popupMeshes.get(p.id);
      if (!mesh) {
        const tex = createMoneyTexture(p.amount);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        mesh = new THREE.Mesh(this.popupGeo, mat);
        this.uiGroup.add(mesh);
        this.popupMeshes.set(p.id, mesh);
      }
      mesh.position.set(p.x, p.y, 0.95);
      const opacity = Math.max(0, p.timer / p.maxTimer);
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      // Money popups animate, so we need continuous rendering
      if (opacity > 0) {
        this.needsRenderCallback?.();
      }
    }

    // Update stock HUD only if stock changed
    const stockKey = `${state.ingredientStock.coffeeBeans},${state.ingredientStock.milk},${state.cakeStock.map(c => `${c.name}:${c.stock}`).join(",")},${state.pendingOrderCount}`;
    if (stockKey !== this.lastStockState) {
      this.lastStockState = stockKey;
      this.updateStockHud(state);
    }
    
    // ── PARTICLE EFFECTS ──
    this.steamTimer += 0.016;
    
    // Add steam from coffee machines when baristas are making coffee
    for (const b of state.baristas) {
      const lastState = this.lastBaristaStates.get(b.id);
      
      // Steam particles when making coffee
      if (b.state === "making" && this.steamTimer > 0.1) {
        this.particles.addSteam(b.x, b.y + 0.3);
      }
      
      // Sparkles when completing an order
      if (lastState === "making" && b.state !== "making") {
        this.particles.addSparkle(b.x, b.y + 0.2);
      }
      
      this.lastBaristaStates.set(b.id, b.state);
    }
    
    if (this.steamTimer > 0.1) {
      this.steamTimer = 0;
    }
    
    // Add hearts for happy customers
    for (const c of state.customers) {
      if (c.state === "sitting" && Math.random() > 0.98) {
        this.particles.addHeart(c.x, c.y + 0.3);
      }
    }
    
    // Update particles
    this.particles.update();
    this.renderParticles();
    
    // Keep rendering if particles exist
    if (this.particles.particles.length > 0) {
      this.needsRenderCallback?.();
    }
  }
  
  showMoneyPopup(x: number, y: number, amount: number) {
    // This is handled by the backend's money popup system
    // Just trigger a sparkle effect
    this.particles.addSparkle(x, y + 0.2);
  }

  renderParticles() {
    // Clear old particle meshes
    for (const mesh of this.particleMeshes) {
      this.particleGroup.remove(mesh);
      (mesh.material as THREE.MeshBasicMaterial).dispose();
      mesh.geometry.dispose();
    }
    this.particleMeshes = [];
    
    // Create new particle meshes
    for (const p of this.particles.particles) {
      const geo = new THREE.PlaneGeometry(p.size, p.size);
      const canvas = document.createElement("canvas");
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext("2d")!;
      
      if (p.type === "steam") {
        // Soft circle for steam
        const gradient = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 8, 8);
      } else if (p.type === "sparkle") {
        // Star shape for sparkles
        ctx.fillStyle = p.color;
        ctx.fillRect(3, 0, 2, 8);
        ctx.fillRect(0, 3, 8, 2);
      } else if (p.type === "heart") {
        // Simple heart
        ctx.fillStyle = p.color;
        ctx.fillRect(1, 2, 2, 3);
        ctx.fillRect(5, 2, 2, 3);
        ctx.fillRect(2, 3, 4, 3);
        ctx.fillRect(3, 5, 2, 2);
      } else if (p.type === "dust") {
        // Small dot for dust
        ctx.fillStyle = p.color;
        ctx.fillRect(3, 3, 2, 2);
      }
      
      const tex = makeTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: p.life / p.maxLife,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x, p.y, 0.95);
      this.particleGroup.add(mesh);
      this.particleMeshes.push(mesh);
    }
  }

  dispose() {
    // Clear particles
    this.particles.clear();
    for (const mesh of this.particleMeshes) {
      this.particleGroup.remove(mesh);
      (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (mesh.material as THREE.MeshBasicMaterial).dispose();
      mesh.geometry.dispose();
    }
    this.particleMeshes = [];
    
    // Clean up barista trays
    for (const [, mesh] of this.baristaTrays) {
      this.uiGroup.remove(mesh);
      (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (mesh.material as THREE.MeshBasicMaterial).dispose();
      mesh.geometry.dispose();
    }
    this.baristaTrays.clear();
    
    // Clean up tip meshes
    for (const [, mesh] of this.tipMeshes) {
      this.uiGroup.remove(mesh);
      (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    this.tipMeshes.clear();
    
    for (const [, mesh] of this.baristaMeshes) {
      this.characterGroup.remove(mesh);
      (mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    for (const [, entry] of this.customerMeshes) {
      this.characterGroup.remove(entry.body);
      (entry.body.material as THREE.MeshBasicMaterial).dispose();
      if (entry.bubble) {
        this.uiGroup.remove(entry.bubble);
        (entry.bubble.material as THREE.MeshBasicMaterial).map?.dispose();
        (entry.bubble.material as THREE.MeshBasicMaterial).dispose();
      }
    }
    for (const [, mesh] of this.progressMeshes) {
      this.uiGroup.remove(mesh);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      // Dispose textures that aren't cached
      if (mat.map) {
        const tex = mat.map as THREE.CanvasTexture;
        if (!Array.from(this.progressTextureCache.values()).includes(tex)) {
          tex.dispose();
        }
      }
      mat.dispose();
    }
    // Dispose cached progress textures
    for (const tex of this.progressTextureCache.values()) {
      tex.dispose();
    }
    this.progressTextureCache.clear();
    for (const [, mesh] of this.popupMeshes) {
      this.uiGroup.remove(mesh);
      (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (mesh.material as THREE.MeshBasicMaterial).dispose();
    }

    this.scene.remove(this.stockHudMesh);
    this.stockHudTex.dispose();
    (this.stockHudMesh.material as THREE.MeshBasicMaterial).dispose();
    this.stockHudGeo.dispose();

    if (this.tableMeshes.length > 0) {
      (this.tableMeshes[0].material as THREE.MeshBasicMaterial).map?.dispose();
    }
    for (const m of this.tableMeshes) {
      this.scene.remove(m);
      (m.material as THREE.MeshBasicMaterial).dispose();
    }
    for (const d of this.decorMeshes) {
      this.scene.remove(d.mesh);
      (d.mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (d.mesh.material as THREE.MeshBasicMaterial).dispose();
      d.mesh.geometry.dispose();
    }

    this.sharedGeo.dispose();
    this.progressGeo.dispose();
    this.popupGeo.dispose();
    this.bubbleGeo.dispose();
    this.tableGeo.dispose();
    for (const t of this.baristaTextures) t.dispose();
    for (const t of this.customerTextures) t.dispose();
    this.sound.dispose();
  }
}

// ═══════════════════════════════════════════════════════════════
// REACT COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CafeGameProps {
  onStatsUpdate?: (stats: GameStats) => void;
  onThoughtsUpdate?: (thoughts: AIThought[]) => void;
  gameState?: BroadcastState | null;
  soundEvents?: string[];
}

export default function CafeGame({ onStatsUpdate, onThoughtsUpdate, gameState, soundEvents }: CafeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CafeRenderer | null>(null);
  const threeRendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const lastStateRef = useRef<BroadcastState | null>(null);
  const needsRenderRef = useRef<boolean>(true);
  const lastRenderTimeRef = useRef<number>(0);

  const statsCallback = useCallback(
    (stats: GameStats) => onStatsUpdate?.(stats),
    [onStatsUpdate]
  );
  const thoughtsCallback = useCallback(
    (thoughts: AIThought[]) => onThoughtsUpdate?.(thoughts),
    [onThoughtsUpdate]
  );

  // Process sound events from server
  useEffect(() => {
    if (soundEvents && rendererRef.current) {
      for (const sound of soundEvents) {
        rendererRef.current.sound.playSound(sound);
      }
    }
  }, [soundEvents]);

  // Apply game state when it changes
  useEffect(() => {
    if (gameState && rendererRef.current) {
      lastStateRef.current = gameState;
      rendererRef.current.applyState(gameState);
      statsCallback(gameState.stats);
      thoughtsCallback(gameState.thoughts);
      needsRenderRef.current = true; // Mark that we need to render
    }
  }, [gameState, statsCallback, thoughtsCallback]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Three.js Setup ──
    const threeRenderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
      depth: false // We're using z-ordering via position, not depth buffer
    });
    threeRenderer.setClearColor(0x0c0c14);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // Cap at 2x for performance
    container.appendChild(threeRenderer.domElement);
    threeRendererRef.current = threeRenderer;

    const scene = new THREE.Scene();
    
    // Enhanced background with subtle gradient
    const bgColor = new THREE.Color(0x0c0c14);
    scene.background = bgColor;
    scene.fog = new THREE.Fog(0x0c0c14, 15, 25); // Subtle depth fog

    const camera = new THREE.OrthographicCamera(0, GAME_W, GAME_H, 0, 0.1, 100);
    camera.position.set(0, 0, 10);
    
    // Camera shake state
    let cameraShake = 0;
    let cameraShakeDecay = 0.9;

    // ── Background ──
    const bgTex = createCafeBackground();
    const bgGeo = new THREE.PlaneGeometry(GAME_W, GAME_H);
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(GAME_W / 2, GAME_H / 2, 0);
    scene.add(bgMesh);
    
    // ── Ambient lighting overlay ──
    const createAmbientOverlay = (): THREE.CanvasTexture => {
      const canvas = document.createElement("canvas");
      canvas.width = GAME_W * T;
      canvas.height = GAME_H * T;
      const ctx = canvas.getContext("2d")!;
      
      // Warm ambient light from top
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(255, 220, 140, 0.08)");
      gradient.addColorStop(0.3, "rgba(255, 200, 100, 0.04)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    };
    
    const ambientTex = createAmbientOverlay();
    const ambientMat = new THREE.MeshBasicMaterial({
      map: ambientTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ambientMesh = new THREE.Mesh(bgGeo, ambientMat);
    ambientMesh.position.set(GAME_W / 2, GAME_H / 2, 0.01);
    scene.add(ambientMesh);
    
    // ── Vignette effect ──
    const createVignette = (): THREE.CanvasTexture => {
      const canvas = document.createElement("canvas");
      canvas.width = GAME_W * T;
      canvas.height = GAME_H * T;
      const ctx = canvas.getContext("2d")!;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.max(canvas.width, canvas.height) * 0.7;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.6, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    };
    
    const vignetteTex = createVignette();
    const vignetteMat = new THREE.MeshBasicMaterial({
      map: vignetteTex,
      transparent: true,
      depthWrite: false,
    });
    const vignetteMesh = new THREE.Mesh(bgGeo, vignetteMat);
    vignetteMesh.position.set(GAME_W / 2, GAME_H / 2, 6);
    scene.add(vignetteMesh);

    // ── Renderer (for applying state) ──
    const cafeRenderer = new CafeRenderer(scene);
    cafeRenderer.needsRenderCallback = () => { needsRenderRef.current = true; };
    rendererRef.current = cafeRenderer;

    // Apply current state if we already have one
    if (lastStateRef.current) {
      cafeRenderer.applyState(lastStateRef.current);
    }

    // ── Audio — resume on first interaction ──
    const resumeAudio = () => cafeRenderer.sound.resume();
    container.addEventListener("click", resumeAudio);
    container.addEventListener("touchstart", resumeAudio);
    document.addEventListener("click", resumeAudio, { once: true });

    // ── Resize ──
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      threeRenderer.setSize(w, h);

      const aspect = w / h;
      const gameAspect = GAME_W / GAME_H;

      if (aspect > gameAspect) {
        const viewW = GAME_H * aspect;
        camera.left = -(viewW - GAME_W) / 2;
        camera.right = GAME_W + (viewW - GAME_W) / 2;
        camera.top = GAME_H;
        camera.bottom = 0;
      } else {
        const viewH = GAME_W / aspect;
        camera.left = 0;
        camera.right = GAME_W;
        camera.top = GAME_H + (viewH - GAME_H) / 2;
        camera.bottom = -(viewH - GAME_H) / 2;
      }
      camera.updateProjectionMatrix();
    };

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(container);
    resize();

    // ── Optimized Render Loop with camera effects ──
    // Only render when state changes or for smooth animations (money popups, etc.)
    const animate = () => {
      const now = performance.now();
      const timeSinceLastRender = now - lastRenderTimeRef.current;
      
      // Apply camera shake
      if (cameraShake > 0.001) {
        const shakeX = (Math.random() - 0.5) * cameraShake;
        const shakeY = (Math.random() - 0.5) * cameraShake;
        camera.position.x = shakeX;
        camera.position.y = shakeY;
        cameraShake *= cameraShakeDecay;
        needsRenderRef.current = true;
      } else if (cameraShake > 0) {
        camera.position.x = 0;
        camera.position.y = 0;
        cameraShake = 0;
      }
      
      // Always render if we have pending state updates
      // Or render at least 30fps for smooth animations (money popups, progress bars)
      if (needsRenderRef.current || timeSinceLastRender >= 33) {
        threeRenderer.render(scene, camera);
        needsRenderRef.current = false;
        lastRenderTimeRef.current = now;
      }
      
      // Schedule next frame
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    
    // Expose camera shake function to renderer
    if (cafeRenderer) {
      (cafeRenderer as any).triggerCameraShake = (intensity: number = 0.1) => {
        cameraShake = intensity;
      };
    }

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(frameRef.current);
      resizeObs.disconnect();
      container.removeEventListener("click", resumeAudio);
      container.removeEventListener("touchstart", resumeAudio);
      cafeRenderer.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      bgTex.dispose();
      threeRenderer.dispose();
      if (container.contains(threeRenderer.domElement)) {
        container.removeChild(threeRenderer.domElement);
      }
    };
  }, [statsCallback, thoughtsCallback]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
