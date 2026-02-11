"use client";

import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import type { GameStats, AIThought } from "./types";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const GAME_W = 20;
const GAME_H = 14;
const T = 16; // pixels per tile
const CHAR_W = 0.55;
const CHAR_H = 0.75;
const MOVE_SPEED = 2.5;

const COUNTER_Y = 10;
const MACHINE_Y = 12;
const QUEUE_Y = 8.8;
const DOOR_X = 18;
const DOOR_Y = 0.8;

// Recipe: what raw ingredients each item consumes when prepared
type Recipe = { coffee?: number; milk?: number };

const MENU_ITEMS: {
  name: string; type: "coffee" | "cake"; basePrice: number; prep: number;
  unlockCost: number; recipe: Recipe; wholesaleCost: number; orderBatch: number;
}[] = [
  // Starter items (free) — wholesaleCost = cost-per-unit to the cafe, orderBatch = units per supply delivery
  //                         Coffee drinks pull from ingredient stock; cakes are ordered pre-made
  { name: "Espresso",       type: "coffee", basePrice: 3.50, prep: 2.5, unlockCost: 0,   recipe: { coffee: 1 },           wholesaleCost: 0.30, orderBatch: 0 },
  { name: "Latte",          type: "coffee", basePrice: 4.50, prep: 3.2, unlockCost: 0,   recipe: { coffee: 1, milk: 1 },  wholesaleCost: 0.50, orderBatch: 0 },
  { name: "Croissant",      type: "cake",   basePrice: 3.00, prep: 2.0, unlockCost: 0,   recipe: {},                       wholesaleCost: 1.50, orderBatch: 10 },
  // Unlockable items
  { name: "Cappuccino",     type: "coffee", basePrice: 4.00, prep: 2.8, unlockCost: 80,  recipe: { coffee: 1, milk: 1 },  wholesaleCost: 0.50, orderBatch: 0 },
  { name: "Muffin",         type: "cake",   basePrice: 3.50, prep: 2.2, unlockCost: 80,  recipe: {},                       wholesaleCost: 1.20, orderBatch: 10 },
  { name: "Scone",          type: "cake",   basePrice: 3.50, prep: 1.8, unlockCost: 100, recipe: {},                       wholesaleCost: 1.00, orderBatch: 12 },
  { name: "Mocha",          type: "coffee", basePrice: 5.00, prep: 3.5, unlockCost: 120, recipe: { coffee: 1, milk: 1 },  wholesaleCost: 0.50, orderBatch: 0 },
  { name: "Cold Brew",      type: "coffee", basePrice: 4.50, prep: 2.5, unlockCost: 150, recipe: { coffee: 2 },           wholesaleCost: 0.60, orderBatch: 0 },
  { name: "Chocolate Cake", type: "cake",   basePrice: 5.50, prep: 3.8, unlockCost: 180, recipe: {},                       wholesaleCost: 2.50, orderBatch: 8 },
  { name: "Cheesecake",     type: "cake",   basePrice: 6.00, prep: 4.0, unlockCost: 220, recipe: {},                       wholesaleCost: 3.00, orderBatch: 6 },
  { name: "Matcha Latte",   type: "coffee", basePrice: 5.50, prep: 3.0, unlockCost: 280, recipe: { milk: 1 },             wholesaleCost: 0.20, orderBatch: 0 },
  { name: "Tiramisu",       type: "cake",   basePrice: 7.00, prep: 4.5, unlockCost: 350, recipe: { coffee: 1 },           wholesaleCost: 3.50, orderBatch: 6 },
];

// Raw ingredient stock — these feed coffee drinks
const INGREDIENT_STOCK = {
  coffeeBeans: { name: "Coffee Beans", startQty: 40, orderQty: 40, orderCost: 12 }, // $0.30/serving
  milk:        { name: "Milk",         startQty: 30, orderQty: 30, orderCost: 6 },  // $0.20/serving
};

const TABLE_COSTS = [0, 0, 120, 160, 200, 250, 300, 350]; // cost per table index (first 2 free)

const UPGRADES = {
  coffeeMachine: { name: "Coffee Machine", maxLevel: 5, costs: [200, 350, 550, 800, 1200] },
  baristaTraining: { name: "Barista Training", maxLevel: 5, costs: [150, 300, 500, 750, 1100] },
  ambiance: { name: "Cafe Ambiance", maxLevel: 5, costs: [100, 200, 400, 650, 950] },
  marketing: { name: "Marketing", maxLevel: 5, costs: [120, 250, 400, 600, 900] },
};
type UpgradeType = keyof typeof UPGRADES;

const TABLE_POSITIONS = [
  { x: 3, y: 6 }, { x: 7, y: 6 }, { x: 12, y: 6 }, { x: 16, y: 6 },
  { x: 3, y: 3 }, { x: 7, y: 3 }, { x: 12, y: 3 }, { x: 16, y: 3 },
];

const BARISTA_SLOTS = [
  { idle: { x: 4, y: 10.8 }, counter: { x: 4, y: 10.2 }, machine: { x: 3, y: 12 } },
  { idle: { x: 8, y: 10.8 }, counter: { x: 8, y: 10.2 }, machine: { x: 7, y: 12 } },
  { idle: { x: 12, y: 10.8 }, counter: { x: 12, y: 10.2 }, machine: { x: 11, y: 12 } },
];

const CUSTOMER_COLORS = [
  "#e84040", "#4080e8", "#40c870", "#c040c0", "#e8a020",
  "#40b8b8", "#e86080", "#80b040", "#6060d0", "#d07030",
];

const HAIR_COLORS = ["#3a2018", "#1a1018", "#6b4226", "#d4a020", "#8b3010", "#2a1a30"];

// ═══════════════════════════════════════════════════════════════
// TEXTURE CREATION
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

  // Helper: game coords → canvas coords (flip Y)
  const cy = (gy: number) => (GAME_H - 1 - gy) * T;

  // ── FLOOR ──
  for (let gx = 0; gx < GAME_W; gx++) {
    for (let gy = 0; gy < GAME_H; gy++) {
      const isLight = (gx + gy) % 2 === 0;
      px(ctx, gx * T, cy(gy), T, T, isLight ? "#3a2820" : "#321e16");
      // subtle grain
      px(ctx, gx * T + 3, cy(gy) + 3, 2, 2, isLight ? "#3e2c24" : "#2e1a14");
      px(ctx, gx * T + T - 5, cy(gy) + T - 5, 2, 2, isLight ? "#362418" : "#2a1812");
    }
  }

  // ── WALLS ──
  const drawWall = (gx: number, gy: number) => {
    const x = gx * T, y = cy(gy);
    px(ctx, x, y, T, T, "#1a1420");
    px(ctx, x, y, T, 1, "#241828");
    px(ctx, x, y + 8, T, 1, "#241828");
    if (gy % 2 === 0) {
      px(ctx, x + 8, y, 1, 8, "#241828");
      px(ctx, x, y + 8, 1, 8, "#241828");
    } else {
      px(ctx, x, y, 1, 8, "#241828");
      px(ctx, x + 8, y + 8, 1, 8, "#241828");
    }
  };

  // Top wall
  for (let x = 0; x < GAME_W; x++) drawWall(x, GAME_H - 1);
  // Bottom wall
  for (let x = 0; x < GAME_W; x++) {
    if (x === 18 || x === 17) continue; // door gap
    drawWall(x, 0);
  }
  // Left wall
  for (let y = 0; y < GAME_H; y++) drawWall(0, y);
  // Right wall
  for (let y = 0; y < GAME_H; y++) {
    if (y === 0 || y === 1) { drawWall(GAME_W - 1, y); continue; }
    drawWall(GAME_W - 1, y);
  }

  // ── DOOR ──
  for (const dx of [17, 18]) {
    const x = dx * T, y = cy(0);
    px(ctx, x, y, T, T, "#4a3828");
    px(ctx, x + 2, y + 2, T - 4, T - 4, "#5c4630");
    px(ctx, x + 4, y + 4, T - 8, T - 8, "#6b553a");
  }
  // Welcome mat
  px(ctx, 17 * T + 2, cy(1) + 4, T * 2 - 4, T - 8, "#8b3010");
  px(ctx, 17 * T + 4, cy(1) + 6, T * 2 - 8, T - 12, "#a04020");

  // ── BEHIND COUNTER AREA (darker floor) ──
  for (let gx = 1; gx < GAME_W - 1; gx++) {
    for (let gy = COUNTER_Y; gy < GAME_H - 1; gy++) {
      const isLight = (gx + gy) % 2 === 0;
      px(ctx, gx * T, cy(gy), T, T, isLight ? "#2a2030" : "#221828");
      px(ctx, gx * T + 5, cy(gy) + 5, 2, 2, isLight ? "#2e2434" : "#261c2c");
    }
  }

  // ── COUNTER ──
  for (let gx = 1; gx < 15; gx++) {
    const x = gx * T, y = cy(COUNTER_Y);
    px(ctx, x, y, T, T, "#6b4226");
    px(ctx, x, y, T, 3, "#9b7050"); // top highlight
    px(ctx, x, y + 3, T, 2, "#8b5e3c"); // surface
    px(ctx, x, y + T - 2, T, 2, "#4a2e18"); // bottom shadow
    // edge marks
    if (gx === 1) px(ctx, x, y, 2, T, "#4a2e18");
    if (gx === 14) px(ctx, x + T - 2, y, 2, T, "#4a2e18");
  }

  // ── COFFEE MACHINES ──
  const drawMachine = (gx: number, gy: number) => {
    const x = gx * T, y = cy(gy);
    px(ctx, x + 2, y + 2, T - 4, T - 4, "#505568");
    px(ctx, x + 3, y + 3, T - 6, T - 6, "#606578");
    px(ctx, x + 4, y + 2, 3, 2, "#e84040"); // indicator light
    px(ctx, x + 5, y + 8, 6, 4, "#404550"); // dispenser
    px(ctx, x + 6, y + 10, 4, 2, "#3a3a48");
  };
  drawMachine(3, 12);
  drawMachine(7, 12);
  drawMachine(11, 12);

  // ── SHELVES on back wall ──
  for (let gx = 2; gx < 16; gx++) {
    if (gx === 3 || gx === 7 || gx === 11) continue; // machine positions
    const x = gx * T, y = cy(12);
    px(ctx, x + 1, y + 4, T - 2, 3, "#5c4630"); // shelf
    px(ctx, x + 3, y + 1, 4, 3, "#c8b090"); // cup
    px(ctx, x + 8, y + 1, 4, 3, "#d4a870"); // cup
  }

  // ── CASH REGISTER ──
  {
    const x = 14 * T, y = cy(COUNTER_Y);
    px(ctx, x + 2, y + 2, T - 4, T - 4, "#d4a020");
    px(ctx, x + 3, y + 3, T - 6, 4, "#e8b830");
    px(ctx, x + 4, y + 8, T - 8, 4, "#b88818");
    px(ctx, x + 5, y + 3, 2, 2, "#f0d060"); // display
    px(ctx, x + 8, y + 3, 2, 2, "#f0d060");
  }

  // ── TABLES (rendered as dynamic sprites based on purchased count) ──

  // ── PLANTS ──
  const drawPlant = (gx: number, gy: number) => {
    const x = gx * T, y = cy(gy);
    px(ctx, x + 4, y + T - 6, 8, 6, "#5c3a20"); // pot
    px(ctx, x + 5, y + T - 7, 6, 2, "#6b4a2e");
    px(ctx, x + 3, y + 1, 4, 5, "#2d6b30"); // leaves
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
    // text lines
    for (let i = 0; i < 4; i++) {
      px(ctx, x + 4, y + 3 + i * 3, T - 4, 1, "#d4a020");
    }
    px(ctx, x + 3, y, T * 2 - 6, 2, "#d4a020"); // title bar
  }

  // ── HANGING LIGHTS (top area) ──
  for (let gx = 3; gx < GAME_W - 3; gx += 4) {
    const x = gx * T + 6;
    const y = cy(GAME_H - 1) + T - 2;
    px(ctx, x, y, 4, 4, "#e8c060");
    px(ctx, x + 1, y + 1, 2, 2, "#f8e090");
  }

  return makeTexture(canvas);
}

function createCharacterTexture(
  shirtColor: string,
  hairColor: string,
  isBarista: boolean
): THREE.CanvasTexture {
  const W = 12, H = 16;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  // Shadow
  px(ctx, 2, 14, 8, 2, "rgba(0,0,0,0.3)");

  // Hair
  px(ctx, 3, 0, 6, 3, hairColor);
  px(ctx, 2, 1, 8, 2, hairColor);

  // Face
  px(ctx, 3, 3, 6, 3, "#e0b888");
  px(ctx, 4, 4, 1, 1, "#2a2a40"); // left eye
  px(ctx, 7, 4, 1, 1, "#2a2a40"); // right eye

  // Body
  px(ctx, 2, 6, 8, 5, shirtColor);

  if (isBarista) {
    // Apron
    px(ctx, 3, 7, 6, 4, "#f0e8d0");
    px(ctx, 4, 7, 4, 1, "#d4a020"); // apron tie
  }

  // Arms
  px(ctx, 1, 7, 1, 3, shirtColor);
  px(ctx, 10, 7, 1, 3, shirtColor);
  px(ctx, 1, 10, 1, 1, "#e0b888");
  px(ctx, 10, 10, 1, 1, "#e0b888");

  // Pants
  px(ctx, 3, 11, 3, 2, "#2a2a40");
  px(ctx, 7, 11, 3, 2, "#2a2a40");

  // Shoes
  px(ctx, 3, 13, 3, 1, "#1a1a28");
  px(ctx, 7, 13, 3, 1, "#1a1a28");

  return makeTexture(c);
}

function createShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 12;
  c.height = 4;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(6, 2, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  return makeTexture(c);
}

function createMoneyTexture(amount: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 16;
  const ctx = c.getContext("2d")!;
  ctx.font = "bold 12px monospace";
  ctx.fillStyle = "#40d870";
  ctx.textAlign = "center";
  ctx.fillText(`+$${amount}`, 32, 12);
  return makeTexture(c);
}

function createProgressTexture(progress: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 20;
  c.height = 4;
  const ctx = c.getContext("2d")!;
  px(ctx, 0, 0, 20, 4, "#1a1a28");
  px(ctx, 1, 1, Math.floor(18 * progress), 2, "#d4a020");
  return makeTexture(c);
}

function createBubbleTexture(text: string, isCoffee: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 48;
  const ctx = c.getContext("2d")!;

  // Bubble body
  ctx.fillStyle = "#fffef5";
  ctx.beginPath();
  ctx.roundRect(2, 2, 124, 30, 8);
  ctx.fill();
  ctx.strokeStyle = "#8a7a6a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(2, 2, 124, 30, 8);
  ctx.stroke();

  // Pointer
  ctx.fillStyle = "#fffef5";
  ctx.beginPath();
  ctx.moveTo(54, 32);
  ctx.lineTo(64, 44);
  ctx.lineTo(74, 32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8a7a6a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(54, 32);
  ctx.lineTo(64, 44);
  ctx.lineTo(74, 32);
  ctx.stroke();
  // Cover seam where pointer meets bubble
  ctx.fillStyle = "#fffef5";
  ctx.fillRect(56, 30, 16, 4);

  // Type indicator circle
  ctx.fillStyle = isCoffee ? "#6b3a10" : "#d04880";
  ctx.beginPath();
  ctx.arc(18, 17, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isCoffee ? "☕" : "🍰", 18, 17);

  // Order name
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
  // Chairs (4 around table)
  const ch = "#4a3422";
  px(ctx, 4, 20, 8, 8, ch);
  px(ctx, 36, 20, 8, 8, ch);
  px(ctx, 20, 4, 8, 8, ch);
  px(ctx, 20, 36, 8, 8, ch);
  // Table top (round-ish)
  px(ctx, 10, 14, 28, 20, "#6b4a2e");
  px(ctx, 12, 12, 24, 24, "#7a5838");
  px(ctx, 14, 10, 20, 28, "#7a5838");
  // Center highlight
  px(ctx, 16, 16, 16, 16, "#8b6840");
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
  px(ctx, 3, 10, 6, 6, "#6b8bb0");
  px(ctx, 4, 12, 4, 3, "#7ba0c0");
  px(ctx, 2, 2, 3, 3, "#e84060");
  px(ctx, 5, 0, 3, 3, "#f0d060");
  px(ctx, 7, 3, 3, 3, "#e060c0");
  px(ctx, 3, 5, 1, 5, "#40a040");
  px(ctx, 6, 3, 1, 7, "#40a040");
  px(ctx, 8, 5, 1, 5, "#40a040");
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

// ═══════════════════════════════════════════════════════════════
// ENTITY TYPES
// ═══════════════════════════════════════════════════════════════

type BaristaState = "idle" | "going_to_counter" | "taking_order" | "going_to_machine" | "making" | "going_to_serve" | "serving";
type CustomerState = "entering" | "queuing" | "at_counter" | "waiting_drink" | "going_to_table" | "sitting" | "leaving";

interface Barista {
  id: number;
  slotIndex: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: BaristaState;
  timer: number;
  servingCustomerId: number | null;
  orderPrepTime: number;
  orderProgress: number;
  mesh: THREE.Mesh;
  progressMesh: THREE.Mesh | null;
}

interface Customer {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: CustomerState;
  timer: number;
  order: { name: string; type: "coffee" | "cake"; price: number; prep: number };
  waitStartTime: number;
  totalWait: number;
  tableIndex: number;
  mesh: THREE.Mesh;
  bobOffset: number;
  bobTimer: number;
  bubbleMesh: THREE.Mesh | null;
  patienceTimer: number;
}

interface MoneyPopup {
  mesh: THREE.Mesh;
  timer: number;
  y: number;
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

  // Cash register cha-ching — on sale
  cashRegister() {
    this.tone(880, 0.08, "square", 0.35);
    this.tone(1320, 0.12, "square", 0.35, 0.08);
  }

  // Door bell chime — customer enters
  doorBell() {
    this.tone(660, 0.12, "sine", 0.2);
    this.tone(880, 0.2, "sine", 0.2, 0.1);
  }

  // Coffee hiss — barista starts brewing
  coffeeBrew() {
    this.noise(0.35, 0.2, 2500);
  }

  // Negative buzz — customer leaves unhappy
  customerAngry() {
    this.tone(280, 0.1, "sawtooth", 0.2);
    this.tone(180, 0.18, "sawtooth", 0.2, 0.08);
  }

  // Triple ascending beep — delivery arrives
  deliveryArrive() {
    this.tone(440, 0.07, "square", 0.2);
    this.tone(554, 0.07, "square", 0.2, 0.07);
    this.tone(660, 0.14, "square", 0.25, 0.14);
  }

  // Rising jingle — AI buys upgrade / hire
  upgrade() {
    this.tone(523, 0.08, "square", 0.25);
    this.tone(659, 0.08, "square", 0.25, 0.08);
    this.tone(784, 0.14, "square", 0.3, 0.16);
  }

  // Low buzz — out of stock
  outOfStock() {
    this.tone(200, 0.12, "sawtooth", 0.15);
    this.tone(150, 0.22, "sawtooth", 0.15, 0.1);
  }

  // Subtle new-day chime
  newDay() {
    this.tone(440, 0.1, "triangle", 0.15);
    this.tone(554, 0.1, "triangle", 0.15, 0.12);
    this.tone(660, 0.1, "triangle", 0.15, 0.24);
    this.tone(880, 0.2, "triangle", 0.2, 0.36);
  }

  dispose() { this.ctx?.close(); }
}

// ═══════════════════════════════════════════════════════════════
// GAME ENGINE
// ═══════════════════════════════════════════════════════════════

class CafeEngine {
  scene: THREE.Scene;
  characterGroup: THREE.Group;
  uiGroup: THREE.Group;
  sound = new SoundManager();

  baristas: Barista[] = [];
  customers: Customer[] = [];
  queue: number[] = []; // customer IDs in queue order
  tableOccupants: (number | null)[];
  moneyPopups: MoneyPopup[] = [];

  money = 100; // Start with $100 seed money
  coffeeSold = 0;
  cakesSold = 0;
  totalRevenue = 0;
  customersServed = 0;
  ordersToday = 0;
  totalWaitAccum = 0;
  rating = 4.5;
  day = 1;
  dayTimer = 0;
  streak = 0;
  dailyRevenue = 0;
  dailyOrders = 0;
  prevDayRevenue = 0;

  spawnTimer = 0;
  spawnInterval = 8; // Base 8s between customers (slower early game)
  wageTimer = 0;     // Tracks seconds for per-minute barista wages
  nextId = 1;
  aiTimer = 0;
  gameTime = 0;
  thoughts: AIThought[] = [];
  thoughtId = 1;

  // Financial tracking
  fundsHistory: { time: number; money: number }[] = [{ time: 0, money: 100 }];
  fundsSnapshotTimer = 0;
  totalIncome = 0;
  totalWages = 0;
  totalStockCost = 0;
  totalUpgradeCost = 0;
  totalTableCost = 0;
  totalUnlockCost = 0;
  dailyIncome = 0;
  dailyWagesCost = 0;
  dailyExpenses = 0;

  // Claude AI integration
  claudeEnabled = true;   // Try Claude first; auto-falls back to local if unavailable
  aiPending = false;
  sessionId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  recentEvents: string[] = [];

  // Cafe management
  purchasedTables = 2;
  menuItems: { name: string; type: "coffee" | "cake"; basePrice: number; currentPrice: number; prep: number; unlocked: boolean; unlockCost: number; recipe: Recipe; wholesaleCost: number; orderBatch: number }[] = [];
  upgradeLevels: Record<string, number> = {
    coffeeMachine: 0,
    baristaTraining: 0,
    ambiance: 0,
    marketing: 0,
  };

  // Stock management
  ingredientStock = { coffeeBeans: INGREDIENT_STOCK.coffeeBeans.startQty, milk: INGREDIENT_STOCK.milk.startQty };
  itemStock: number[] = []; // per menu item stock count (-1 = N/A for coffee, >=0 for cakes)
  pendingOrders: { type: string; quantity: number; cost: number; arrivalTime: number }[] = [];
  stockCheckTimer = 0;

  // Stock HUD (rendered in Three.js at top of game)
  stockHudCanvas!: HTMLCanvasElement;
  stockHudCtx!: CanvasRenderingContext2D;
  stockHudTex!: THREE.CanvasTexture;
  stockHudMesh!: THREE.Mesh;
  stockHudGeo!: THREE.PlaneGeometry;

  sharedGeo = new THREE.PlaneGeometry(CHAR_W, CHAR_H);
  shadowGeo = new THREE.PlaneGeometry(0.5, 0.2);
  progressGeo = new THREE.PlaneGeometry(0.6, 0.12);
  popupGeo = new THREE.PlaneGeometry(1.2, 0.3);
  bubbleGeo = new THREE.PlaneGeometry(1.6, 0.6);
  tableGeo = new THREE.PlaneGeometry(3, 3);
  tableMeshes: THREE.Mesh[] = [];
  decorMeshes: { mesh: THREE.Mesh; minLevel: number }[] = [];
  shadowTex: THREE.CanvasTexture;

  baristaTextures: THREE.CanvasTexture[] = [];
  customerTextures: THREE.CanvasTexture[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.characterGroup = new THREE.Group();
    this.uiGroup = new THREE.Group();
    scene.add(this.characterGroup);
    scene.add(this.uiGroup);

    this.tableOccupants = TABLE_POSITIONS.map(() => null);
    this.shadowTex = createShadowTexture();

    // Initialize menu items from master list
    this.menuItems = MENU_ITEMS.map(item => ({
      ...item,
      currentPrice: item.basePrice,
      unlocked: item.unlockCost === 0,
    }));

    // Initialize item stock: unlocked cakes start with 10, locked cakes 0, coffee items -1 (uses ingredients)
    this.itemStock = MENU_ITEMS.map(item =>
      item.type === "cake" ? (item.unlockCost === 0 ? 10 : 0) : -1
    );

    // Create table sprites (only purchased tables visible)
    const tableTex = createTableTexture();
    for (let i = 0; i < TABLE_POSITIONS.length; i++) {
      const tMat = new THREE.MeshBasicMaterial({ map: tableTex, transparent: true, alphaTest: 0.1 });
      const tMesh = new THREE.Mesh(this.tableGeo, tMat);
      tMesh.position.set(TABLE_POSITIONS[i].x, TABLE_POSITIONS[i].y, 0.15);
      tMesh.visible = i < this.purchasedTables;
      scene.add(tMesh);
      this.tableMeshes.push(tMesh);
    }

    // Create ambiance decorations (hidden until upgraded)
    this.createDecorations(scene);

    // Create stock HUD bar at top of game view
    this.stockHudCanvas = document.createElement("canvas");
    this.stockHudCanvas.width = 640;
    this.stockHudCanvas.height = 32;
    this.stockHudCtx = this.stockHudCanvas.getContext("2d")!;
    this.stockHudTex = new THREE.CanvasTexture(this.stockHudCanvas);
    this.stockHudTex.magFilter = THREE.LinearFilter;
    this.stockHudTex.minFilter = THREE.LinearFilter;
    this.stockHudGeo = new THREE.PlaneGeometry(GAME_W, 1);
    const hudMat = new THREE.MeshBasicMaterial({ map: this.stockHudTex, transparent: true });
    this.stockHudMesh = new THREE.Mesh(this.stockHudGeo, hudMat);
    this.stockHudMesh.position.set(GAME_W / 2, GAME_H - 0.5, 5);
    scene.add(this.stockHudMesh);
    this.updateStockHud(); // draw initial state

    // Pre-create textures
    this.baristaTextures = [
      createCharacterTexture("#d4a020", "#3a2018", true),
      createCharacterTexture("#d4a020", "#1a1018", true),
      createCharacterTexture("#d4a020", "#6b4226", true),
    ];

    this.customerTextures = CUSTOMER_COLORS.map((c, i) =>
      createCharacterTexture(c, HAIR_COLORS[i % HAIR_COLORS.length], false)
    );

    // Spawn initial barista
    this.hireBarista();

    // Initial thought
    this.addThought("The cafe is open! Let's start serving customers and build our business.", "strategy");
  }

  addThought(text: string, type: AIThought["type"]) {
    const t: AIThought = {
      id: this.thoughtId++,
      text,
      time: "just now",
      type,
    };
    this.thoughts.unshift(t);
    if (this.thoughts.length > 20) this.thoughts.pop();
  }

  // ── Cafe Management Methods ──

  getUnlockedItems() {
    return this.menuItems.filter(m => m.unlocked);
  }

  getPrepMultiplier() {
    return Math.max(0.5, 1 - this.upgradeLevels.coffeeMachine * 0.1);
  }

  getMoveSpeed() {
    return MOVE_SPEED * (1 + this.upgradeLevels.baristaTraining * 0.15);
  }

  getPatienceMultiplier() {
    return 1 + this.upgradeLevels.ambiance * 0.15;
  }

  getSpawnMultiplier() {
    return Math.max(0.4, 1 - this.upgradeLevels.marketing * 0.12);
  }

  buyTable(): boolean {
    if (this.purchasedTables >= TABLE_POSITIONS.length) return false;
    const cost = TABLE_COSTS[this.purchasedTables];
    if (this.money < cost) return false;
    this.money -= cost;
    this.totalTableCost += cost;
    this.dailyExpenses += cost;
    this.purchasedTables++;
    return true;
  }

  purchaseUpgrade(type: UpgradeType): boolean {
    const def = UPGRADES[type];
    const level = this.upgradeLevels[type];
    if (level >= def.maxLevel) return false;
    const cost = def.costs[level];
    if (this.money < cost) return false;
    this.money -= cost;
    this.totalUpgradeCost += cost;
    this.dailyExpenses += cost;
    this.upgradeLevels[type]++;
    return true;
  }

  unlockMenuItem(index: number): boolean {
    const item = this.menuItems[index];
    if (!item || item.unlocked) return false;
    if (this.money < item.unlockCost) return false;
    this.money -= item.unlockCost;
    this.totalUnlockCost += item.unlockCost;
    this.dailyExpenses += item.unlockCost;
    item.unlocked = true;
    // Newly unlocked cake items get initial stock of 10
    if (item.type === "cake") this.itemStock[index] = 10;
    return true;
  }

  adjustPrice(index: number, delta: number): boolean {
    const item = this.menuItems[index];
    if (!item || !item.unlocked) return false;
    const newPrice = Math.round((item.currentPrice + delta) * 10) / 10;
    if (newPrice < item.basePrice * 0.5 || newPrice > item.basePrice * 2.0) return false;
    item.currentPrice = newPrice;
    return true;
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

    // Level 1: Fancy entrance rug
    add(createRugTexture(), 17, 1.8, 2.5, 1.2, 0.05, 1);

    // Level 2: Wall paintings in seating area
    add(createPaintingTexture("#4080a0"), 1.3, 5, 1.0, 0.8, 0.25, 2);
    add(createPaintingTexture("#a06040"), 18.7, 5, 1.0, 0.8, 0.25, 2);

    // Level 3: Flower vases on counter
    add(createFlowerTexture(), 5, 10.5, 0.5, 0.7, 0.35, 3);
    add(createFlowerTexture(), 10, 10.5, 0.5, 0.7, 0.35, 3);

    // Level 4: Warm ambient glow in seating area
    const glowTex = createWarmGlowTexture();
    add(glowTex, 5, 5, 3, 3, 0.03, 4, true);
    add(glowTex, 10, 5, 3, 3, 0.03, 4, true);
    add(glowTex, 15, 5, 3, 3, 0.03, 4, true);

    // Level 5: Gold trim on counter
    add(createGoldTrimTexture(), 7.5, 10.15, 13, 0.25, 0.36, 5);
  }

  updateVisuals() {
    // Show/hide tables based on purchases
    for (let i = 0; i < this.tableMeshes.length; i++) {
      this.tableMeshes[i].visible = i < this.purchasedTables;
    }
    // Show/hide decorations based on ambiance level
    const ambLevel = this.upgradeLevels.ambiance;
    for (const d of this.decorMeshes) {
      d.mesh.visible = ambLevel >= d.minLevel;
    }
  }

  updateStockHud() {
    const ctx = this.stockHudCtx;
    const W = this.stockHudCanvas.width;
    const H = this.stockHudCanvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "rgba(12, 12, 20, 0.85)";
    ctx.fillRect(0, 0, W, H);
    // Top highlight
    ctx.fillStyle = "rgba(255, 200, 100, 0.12)";
    ctx.fillRect(0, 0, W, 1);
    // Bottom border
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(0, H - 1, W, 1);

    let x = 10;

    const drawItem = (label: string, value: number, warn: number, crit: number, dotColor: string) => {
      // Colored indicator dot
      const c = value <= crit ? "#e84040" : value <= warn ? "#e8a020" : dotColor;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x + 4, H / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      x += 14;

      // Label
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.fillStyle = "#8090a0";
      ctx.textBaseline = "top";
      ctx.fillText(label, x, 4);

      // Value
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

    // Raw ingredients
    drawItem("BEANS", this.ingredientStock.coffeeBeans, 15, 5, "#8b6540");
    sep();
    drawItem("MILK", this.ingredientStock.milk, 10, 4, "#d0d8e8");

    // Unlocked cake items
    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i];
      if (item.type !== "cake" || !item.unlocked) continue;
      if (x > W - 80) break; // don't overflow
      sep();
      const short = item.name.length > 9 ? item.name.slice(0, 7) + ".." : item.name;
      drawItem(short.toUpperCase(), this.itemStock[i], 5, 2, "#d4a070");
    }

    // Pending deliveries
    if (this.pendingOrders.length > 0) {
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
      ctx.fillText(`${this.pendingOrders.length} order${this.pendingOrders.length > 1 ? "s" : ""}`, x, H - 3);
    }

    this.stockHudTex.needsUpdate = true;
  }

  // ── STOCK MANAGEMENT ──

  checkAndDeductStock(orderName: string): boolean {
    const idx = this.menuItems.findIndex(m => m.name === orderName);
    if (idx < 0) return false;
    const mi = MENU_ITEMS[idx];
    const r = mi.recipe;
    // Check ingredient availability
    if (r.coffee && this.ingredientStock.coffeeBeans < r.coffee) return false;
    if (r.milk && this.ingredientStock.milk < r.milk) return false;
    // Check item stock for cakes
    if (mi.type === "cake" && this.itemStock[idx] < 1) return false;
    // All good — deduct
    if (r.coffee) this.ingredientStock.coffeeBeans -= r.coffee;
    if (r.milk) this.ingredientStock.milk -= r.milk;
    if (mi.type === "cake") this.itemStock[idx]--;
    return true;
  }

  manageStock() {
    // Reorder coffee beans when low
    if (this.ingredientStock.coffeeBeans < 10 && !this.pendingOrders.some(o => o.type === "coffeeBeans")) {
      const cost = INGREDIENT_STOCK.coffeeBeans.orderCost;
      if (this.money >= cost) {
        this.money -= cost;
        this.totalStockCost += cost; this.dailyExpenses += cost;
        this.pendingOrders.push({ type: "coffeeBeans", quantity: INGREDIENT_STOCK.coffeeBeans.orderQty, cost, arrivalTime: this.gameTime + 60 });
        this.addThought(
          `Coffee beans at ${this.ingredientStock.coffeeBeans}! Ordered ${INGREDIENT_STOCK.coffeeBeans.orderQty} servings for $${cost}. Delivery in 1 min.`,
          "decision"
        );
      } else {
        this.addThought(
          `Coffee beans low (${this.ingredientStock.coffeeBeans}) but can't afford restock ($${cost}). Need more revenue first!`,
          "observation"
        );
      }
    }

    // Reorder milk when low
    if (this.ingredientStock.milk < 8 && !this.pendingOrders.some(o => o.type === "milk")) {
      const cost = INGREDIENT_STOCK.milk.orderCost;
      if (this.money >= cost) {
        this.money -= cost;
        this.totalStockCost += cost; this.dailyExpenses += cost;
        this.pendingOrders.push({ type: "milk", quantity: INGREDIENT_STOCK.milk.orderQty, cost, arrivalTime: this.gameTime + 60 });
        this.addThought(
          `Milk down to ${this.ingredientStock.milk} servings! Ordered ${INGREDIENT_STOCK.milk.orderQty} more for $${cost}. Arriving in 1 min.`,
          "decision"
        );
      }
    }

    // Reorder cake/pastry items when stock is low
    for (let i = 0; i < this.menuItems.length; i++) {
      const item = this.menuItems[i];
      if (item.type !== "cake" || !item.unlocked) continue;
      if (this.itemStock[i] < 3 && !this.pendingOrders.some(o => o.type === item.name)) {
        const mi = MENU_ITEMS[i];
        const cost = +(mi.wholesaleCost * mi.orderBatch).toFixed(2);
        if (this.money >= cost) {
          this.money -= cost;
          this.totalStockCost += cost; this.dailyExpenses += cost;
          this.pendingOrders.push({ type: item.name, quantity: mi.orderBatch, cost, arrivalTime: this.gameTime + 60 });
          this.addThought(
            `${item.name} stock at ${this.itemStock[i]}! Ordered ${mi.orderBatch} more for $${cost.toFixed(0)}. Delivery in 1 min.`,
            "decision"
          );
        }
      }
    }
  }

  hireBarista() {
    const slotIndex = this.baristas.length;
    if (slotIndex >= BARISTA_SLOTS.length) return;

    const slot = BARISTA_SLOTS[slotIndex];
    const tex = this.baristaTextures[slotIndex % this.baristaTextures.length];
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    mesh.position.set(slot.idle.x, slot.idle.y, 0.5);

    this.characterGroup.add(mesh);

    const barista: Barista = {
      id: this.nextId++,
      slotIndex,
      x: slot.idle.x,
      y: slot.idle.y,
      targetX: slot.idle.x,
      targetY: slot.idle.y,
      state: "idle",
      timer: 0,
      servingCustomerId: null,
      orderPrepTime: 0,
      orderProgress: 0,
      mesh,
      progressMesh: null,
    };
    this.baristas.push(barista);
  }

  fireBarista(): boolean {
    if (this.baristas.length <= 1) return false; // Must keep at least 1
    const barista = this.baristas.pop()!;

    // Clean up progress bar if active
    this.removeProgressBar(barista);

    // Clean up mesh
    this.characterGroup.remove(barista.mesh);
    (barista.mesh.material as THREE.MeshBasicMaterial).dispose();

    // If this barista was serving a customer, release them back to queue
    if (barista.servingCustomerId !== null) {
      const cust = this.customers.find(c => c.id === barista.servingCustomerId);
      if (cust && cust.state === "at_counter") {
        cust.state = "queuing";
        this.queue.push(cust.id);
      }
    }

    return true;
  }

  spawnCustomer() {
    const texIndex = Math.floor(Math.random() * this.customerTextures.length);
    const tex = this.customerTextures[texIndex];
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    mesh.position.set(DOOR_X, DOOR_Y, 0.5);
    this.characterGroup.add(mesh);

    const unlockedItems = this.getUnlockedItems();
    const item = unlockedItems[Math.floor(Math.random() * unlockedItems.length)];

    // Create speech bubble showing order
    const bubbleTex = createBubbleTexture(item.name, item.type === "coffee");
    const bubbleMat = new THREE.MeshBasicMaterial({ map: bubbleTex, transparent: true });
    const bubbleMesh = new THREE.Mesh(this.bubbleGeo, bubbleMat);
    bubbleMesh.position.set(DOOR_X, DOOR_Y + 0.6, 0.85);
    this.uiGroup.add(bubbleMesh);

    this.sound.doorBell();

    const customer: Customer = {
      id: this.nextId++,
      x: DOOR_X,
      y: DOOR_Y,
      targetX: DOOR_X,
      targetY: DOOR_Y,
      state: "entering",
      timer: 0,
      order: { name: item.name, type: item.type, price: item.currentPrice, prep: item.prep },
      waitStartTime: this.gameTime,
      totalWait: 0,
      tableIndex: -1,
      mesh,
      bobOffset: 0,
      bobTimer: 0,
      bubbleMesh,
      patienceTimer: (30 + Math.random() * 20) * this.getPatienceMultiplier(),
    };
    this.customers.push(customer);
    return customer;
  }

  getQueuePos(index: number): { x: number; y: number } {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return { x: 12 - col * 1.1, y: QUEUE_Y - row * 1.2 };
  }

  findFreeBarista(): Barista | null {
    return this.baristas.find((b) => b.state === "idle") || null;
  }

  findFreeTable(): number {
    const free = this.tableOccupants
      .slice(0, this.purchasedTables)
      .map((occ, i) => (occ === null ? i : -1))
      .filter((i) => i >= 0);
    return free.length > 0 ? free[Math.floor(Math.random() * free.length)] : -1;
  }

  moveToward(entity: { x: number; y: number; targetX: number; targetY: number }, dt: number, speed: number = MOVE_SPEED): boolean {
    const dx = entity.targetX - entity.x;
    const dy = entity.targetY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.05) {
      entity.x = entity.targetX;
      entity.y = entity.targetY;
      return true;
    }
    const step = Math.min(speed * dt, dist);
    entity.x += (dx / dist) * step;
    entity.y += (dy / dist) * step;
    return false;
  }

  removeCustomer(customer: Customer) {
    this.characterGroup.remove(customer.mesh);
    (customer.mesh.material as THREE.MeshBasicMaterial).dispose();
    // Clean up speech bubble
    if (customer.bubbleMesh) {
      this.uiGroup.remove(customer.bubbleMesh);
      (customer.bubbleMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (customer.bubbleMesh.material as THREE.MeshBasicMaterial).dispose();
    }
    const idx = this.customers.indexOf(customer);
    if (idx >= 0) this.customers.splice(idx, 1);
    const qIdx = this.queue.indexOf(customer.id);
    if (qIdx >= 0) this.queue.splice(qIdx, 1);
    if (customer.tableIndex >= 0) {
      this.tableOccupants[customer.tableIndex] = null;
    }
  }

  showProgressBar(barista: Barista) {
    if (barista.progressMesh) {
      this.uiGroup.remove(barista.progressMesh);
      (barista.progressMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (barista.progressMesh.material as THREE.MeshBasicMaterial).dispose();
    }
    const tex = createProgressTexture(barista.orderProgress / barista.orderPrepTime);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(this.progressGeo, mat);
    mesh.position.set(barista.x, barista.y + 0.5, 0.9);
    this.uiGroup.add(mesh);
    barista.progressMesh = mesh;
  }

  removeProgressBar(barista: Barista) {
    if (barista.progressMesh) {
      this.uiGroup.remove(barista.progressMesh);
      (barista.progressMesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (barista.progressMesh.material as THREE.MeshBasicMaterial).dispose();
      barista.progressMesh = null;
    }
  }

  showMoneyPopup(x: number, y: number, amount: number) {
    const tex = createMoneyTexture(amount.toFixed(1));
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const mesh = new THREE.Mesh(this.popupGeo, mat);
    mesh.position.set(x, y + 0.5, 0.95);
    this.uiGroup.add(mesh);
    this.moneyPopups.push({ mesh, timer: 1.5, y: y + 0.5 });
  }

  updateBaristas(dt: number) {
    for (const b of this.baristas) {
      const slot = BARISTA_SLOTS[b.slotIndex];

      // Safety: if serving customer left, reset barista to idle
      if (b.servingCustomerId !== null && b.state !== "idle") {
        const servCust = this.customers.find((c) => c.id === b.servingCustomerId);
        if (!servCust) {
          b.servingCustomerId = null;
          b.state = "idle";
          this.removeProgressBar(b);
        }
      }

      switch (b.state) {
        case "idle":
          b.targetX = slot.idle.x;
          b.targetY = slot.idle.y;
          this.moveToward(b, dt, this.getMoveSpeed());

          // Find first unclaimed customer in queue
          if (this.queue.length > 0) {
            const claimedIds = new Set(
              this.baristas
                .filter((ob) => ob.servingCustomerId !== null)
                .map((ob) => ob.servingCustomerId)
            );
            for (const custId of this.queue) {
              if (claimedIds.has(custId)) continue;
              const cust = this.customers.find((c) => c.id === custId);
              if (cust && cust.state === "queuing") {
                b.servingCustomerId = custId;
                b.state = "going_to_counter";
                b.targetX = slot.counter.x;
                b.targetY = slot.counter.y;
                break;
              }
            }
          }
          break;

        case "going_to_counter":
          if (this.moveToward(b, dt, this.getMoveSpeed())) {
            // Wait for customer to also arrive at counter
            const gcCust = this.customers.find((c) => c.id === b.servingCustomerId);
            if (gcCust && gcCust.state === "at_counter") {
              b.state = "taking_order";
              b.timer = 1.0;
            }
          }
          break;

        case "taking_order":
          b.timer -= dt;
          if (b.timer <= 0) {
            const customer = this.customers.find((c) => c.id === b.servingCustomerId);
            if (customer) {
              // Check stock before preparing
              if (!this.checkAndDeductStock(customer.order.name)) {
                // Out of stock — customer leaves upset
                customer.targetX = DOOR_X;
                customer.targetY = DOOR_Y;
                customer.state = "leaving";
                const qIdx = this.queue.indexOf(customer.id);
                if (qIdx >= 0) this.queue.splice(qIdx, 1);
                this.rating = Math.max(1, this.rating * 0.97 - 0.1);
                this.rating = Math.round(this.rating * 10) / 10;
                if (customer.bubbleMesh) customer.bubbleMesh.visible = false;
                b.servingCustomerId = null;
                b.state = "idle";
                this.sound.outOfStock();
                this.addEvent(`OUT OF STOCK: ${customer.order.name}`);
                this.addThought(
                  `Couldn't make "${customer.order.name}" — out of stock! Customer left unhappy. Rating hit to ${this.rating}.`,
                  "observation"
                );
                break;
              }
              b.orderPrepTime = customer.order.prep * this.getPrepMultiplier();
              b.orderProgress = 0;
              customer.state = "waiting_drink";
              // Hide speech bubble when order is taken
              if (customer.bubbleMesh) customer.bubbleMesh.visible = false;
            }
            b.state = "going_to_machine";
            b.targetX = slot.machine.x;
            b.targetY = slot.machine.y;
          }
          break;

        case "going_to_machine":
          if (this.moveToward(b, dt, this.getMoveSpeed())) {
            b.state = "making";
            this.sound.coffeeBrew();
          }
          break;

        case "making":
          b.orderProgress += dt;
          this.showProgressBar(b);
          if (b.orderProgress >= b.orderPrepTime) {
            b.state = "going_to_serve";
            b.targetX = slot.counter.x;
            b.targetY = slot.counter.y;
            this.removeProgressBar(b);
          }
          break;

        case "going_to_serve":
          if (this.moveToward(b, dt, this.getMoveSpeed())) {
            b.state = "serving";
            b.timer = 0.5;
          }
          break;

        case "serving": {
          b.timer -= dt;
          if (b.timer <= 0) {
            const customer = this.customers.find((c) => c.id === b.servingCustomerId);
            if (customer) {
              // Complete order
              const price = customer.order.price;
              this.money += price;
              this.totalRevenue += price;
              this.totalIncome += price;
              this.dailyIncome += price;
              this.sound.cashRegister();
              this.addEvent(`Served ${customer.order.name} for $${price.toFixed(2)}`);
              this.dailyRevenue += price;
              this.dailyOrders++;
              this.ordersToday++;
              this.customersServed++;

              if (customer.order.type === "coffee") this.coffeeSold++;
              else this.cakesSold++;

              customer.totalWait = this.gameTime - customer.waitStartTime;
              this.totalWaitAccum += customer.totalWait;

              // Update rating
              const waitRating = customer.totalWait < 8 ? 5 : customer.totalWait < 15 ? 4 : customer.totalWait < 25 ? 3 : 2;
              this.rating = this.rating * 0.95 + waitRating * 0.05;
              this.rating = Math.round(this.rating * 10) / 10;

              this.showMoneyPopup(customer.x, customer.y, price);

              // Remove from queue
              const qIdx = this.queue.indexOf(customer.id);
              if (qIdx >= 0) this.queue.splice(qIdx, 1);

              // Send customer to table or leave
              const tableIdx = this.findFreeTable();
              if (tableIdx >= 0) {
                customer.tableIndex = tableIdx;
                this.tableOccupants[tableIdx] = customer.id;
                const tp = TABLE_POSITIONS[tableIdx];
                customer.targetX = tp.x + (Math.random() - 0.5) * 0.5;
                customer.targetY = tp.y + (Math.random() - 0.5) * 0.5;
                customer.state = "going_to_table";
              } else {
                customer.targetX = DOOR_X;
                customer.targetY = DOOR_Y;
                customer.state = "leaving";
              }
            }
            b.servingCustomerId = null;
            b.state = "idle";
          }
          break;
        }
      }

      // Update mesh
      b.mesh.position.set(b.x, b.y, 0.6 - b.y * 0.01);
    }
  }

  updateCustomers(dt: number) {
    const toRemove: Customer[] = [];

    for (const c of this.customers) {
      c.bobTimer += dt;

      switch (c.state) {
        case "entering": {
          // Walk to queue
          const qPos = this.getQueuePos(this.queue.length);
          c.targetX = qPos.x;
          c.targetY = qPos.y;
          if (this.moveToward(c, dt)) {
            c.state = "queuing";
            this.queue.push(c.id);
          }
          break;
        }

        case "queuing": {
          const claimingBarista = this.baristas.find((b) => b.servingCustomerId === c.id);
          if (claimingBarista) {
            // Claimed by a barista — walk to their counter position
            const bSlot = BARISTA_SLOTS[claimingBarista.slotIndex];
            c.targetX = bSlot.counter.x;
            c.targetY = QUEUE_Y + 0.5;
            if (this.moveToward(c, dt)) {
              c.state = "at_counter";
            }
          } else {
            // Position among unclaimed queue members (pack forward)
            const claimedIds = new Set(
              this.baristas
                .filter((b) => b.servingCustomerId !== null)
                .map((b) => b.servingCustomerId)
            );
            let unclaimedIdx = 0;
            for (const qId of this.queue) {
              if (qId === c.id) break;
              if (!claimedIds.has(qId)) unclaimedIdx++;
            }
            const pos = this.getQueuePos(unclaimedIdx);
            c.targetX = pos.x;
            c.targetY = pos.y;
            this.moveToward(c, dt);
          }
          break;
        }

        case "at_counter": {
          // Slide toward assigned barista's counter
          const claimBarista = this.baristas.find((b) => b.servingCustomerId === c.id);
          if (claimBarista) {
            const bSlot = BARISTA_SLOTS[claimBarista.slotIndex];
            c.targetX = bSlot.counter.x;
            c.targetY = QUEUE_Y + 0.5;
            this.moveToward(c, dt);
          }
          break;
        }

        case "waiting_drink":
          // Waiting for order — stand at counter
          break;

        case "going_to_table":
          if (this.moveToward(c, dt)) {
            c.state = "sitting";
            c.timer = 5 + Math.random() * 8;
          }
          break;

        case "sitting":
          c.timer -= dt;
          if (c.timer <= 0) {
            c.targetX = DOOR_X;
            c.targetY = DOOR_Y;
            c.state = "leaving";
            if (c.tableIndex >= 0) {
              this.tableOccupants[c.tableIndex] = null;
              c.tableIndex = -1;
            }
          }
          break;

        case "leaving":
          if (this.moveToward(c, dt)) {
            toRemove.push(c);
          }
          break;
      }

      // Bob animation when moving
      const isMoving = Math.abs(c.x - c.targetX) > 0.05 || Math.abs(c.y - c.targetY) > 0.05;
      c.bobOffset = isMoving ? Math.sin(c.bobTimer * 8) * 0.04 : 0;

      c.mesh.position.set(c.x, c.y + c.bobOffset, 0.6 - c.y * 0.01);

      // Update speech bubble position
      if (c.bubbleMesh) {
        c.bubbleMesh.position.set(c.x, c.y + 0.65, 0.85);
      }

      // Patience system — customers leave if they wait too long
      if (c.state === "queuing" || c.state === "at_counter" || c.state === "waiting_drink") {
        c.patienceTimer -= dt;
        // Flash bubble red when patience is low
        if (c.bubbleMesh && c.bubbleMesh.visible) {
          const mat = c.bubbleMesh.material as THREE.MeshBasicMaterial;
          if (c.patienceTimer < 8) {
            const flash = Math.sin(c.bobTimer * 6) > 0;
            mat.color.set(flash ? 0xff8080 : 0xffffff);
          } else {
            mat.color.set(0xffffff);
          }
        }
        // Leave if out of patience
        if (c.patienceTimer <= 0) {
          // Remove from queue
          const qIdx = this.queue.indexOf(c.id);
          if (qIdx >= 0) this.queue.splice(qIdx, 1);
          // Free up barista if one was serving this customer
          const servingBarista = this.baristas.find((b) => b.servingCustomerId === c.id);
          if (servingBarista) {
            servingBarista.servingCustomerId = null;
            servingBarista.state = "idle";
            this.removeProgressBar(servingBarista);
          }
          // Rating hit for leaving unsatisfied
          this.rating = Math.max(1, this.rating * 0.95 + 1 * 0.05);
          this.rating = Math.round(this.rating * 10) / 10;
          this.sound.customerAngry();
          this.addEvent(`Customer left — waited too long (wanted ${c.order.name})`);
          // Leave the cafe
          c.targetX = DOOR_X;
          c.targetY = DOOR_Y;
          c.state = "leaving";
          if (c.bubbleMesh) c.bubbleMesh.visible = false;
          if (c.tableIndex >= 0) {
            this.tableOccupants[c.tableIndex] = null;
            c.tableIndex = -1;
          }
        }
      }
    }

    for (const c of toRemove) this.removeCustomer(c);
  }

  updatePopups(dt: number) {
    const dead: MoneyPopup[] = [];
    for (const p of this.moneyPopups) {
      p.timer -= dt;
      p.y += dt * 0.8;
      p.mesh.position.y = p.y;
      const opacity = Math.max(0, p.timer / 1.5);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      if (p.timer <= 0) dead.push(p);
    }
    for (const p of dead) {
      this.uiGroup.remove(p.mesh);
      (p.mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
      this.moneyPopups.splice(this.moneyPopups.indexOf(p), 1);
    }
  }

  addEvent(event: string) {
    this.recentEvents.push(event);
    if (this.recentEvents.length > 15) this.recentEvents.shift();
  }

  // ── CLAUDE AI INTEGRATION ──

  getAISnapshot() {
    // Compact snapshot — static info (recipes, costs, types) lives in the system prompt.
    // Only send dynamic/actionable state to minimize tokens.
    return {
      day: this.day,
      money: +this.money.toFixed(2),
      rating: this.rating,
      baristas: this.baristas.length,
      queue: this.queue.length,
      tables: this.purchasedTables,
      beans: this.ingredientStock.coffeeBeans,
      milk: this.ingredientStock.milk,
      ordersToday: this.ordersToday,
      dailyRev: +this.dailyRevenue.toFixed(2),
      // Unlocked: {name, price, stock}  Locked: {name, locked, unlockCost}
      // stock=-1 means item uses ingredient stock (beans/milk), not per-item stock
      menu: this.menuItems.map((m, i) =>
        m.unlocked
          ? { name: m.name, price: m.currentPrice, stock: this.itemStock[i] }
          : { name: m.name, locked: true, unlockCost: m.unlockCost }
      ),
      // Only upgrades below max level (actionable)
      upgrades: Object.entries(UPGRADES)
        .filter(([key]) => this.upgradeLevels[key] < (UPGRADES as Record<string, { maxLevel: number }>)[key].maxLevel)
        .map(([key, def]) => ({
          id: key,
          level: this.upgradeLevels[key],
          nextCost: def.costs[this.upgradeLevels[key]],
        })),
      // Compact: [type, quantity, etaSeconds]
      deliveries: this.pendingOrders.map(o =>
        [o.type, o.quantity, Math.max(0, Math.round(o.arrivalTime - this.gameTime))]
      ),
      events: this.recentEvents.slice(-8),
    };
  }

  applyAIActions(actions: { type: string; target?: string; value?: number }[]) {
    for (const a of actions) {
      switch (a.type) {
        case "hire_barista":
          if (this.baristas.length < BARISTA_SLOTS.length) {
            this.hireBarista();
            this.addEvent(`Hired barista #${this.baristas.length} ($14/min wage)`);
          }
          break;
        case "fire_barista":
          if (this.fireBarista()) {
            this.addEvent(`Fired barista — now ${this.baristas.length} staff ($${this.baristas.length * 14}/min wages)`);
          }
          break;
        case "buy_table":
          if (this.buyTable()) this.addEvent(`Bought table #${this.purchasedTables}`);
          break;
        case "upgrade_coffee_machine":
          if (this.purchaseUpgrade("coffeeMachine")) this.addEvent("Upgraded coffee machine");
          break;
        case "upgrade_barista_training":
          if (this.purchaseUpgrade("baristaTraining")) this.addEvent("Upgraded barista training");
          break;
        case "upgrade_ambiance":
          if (this.purchaseUpgrade("ambiance")) this.addEvent("Upgraded ambiance");
          break;
        case "upgrade_marketing":
          if (this.purchaseUpgrade("marketing")) this.addEvent("Upgraded marketing");
          break;
        case "unlock_menu_item":
          if (a.target) {
            const idx = this.menuItems.findIndex(m => m.name === a.target);
            if (idx >= 0 && this.unlockMenuItem(idx)) this.addEvent(`Unlocked "${a.target}"`);
          }
          break;
        case "adjust_price":
          if (a.target && a.value !== undefined) {
            const idx = this.menuItems.findIndex(m => m.name === a.target);
            if (idx >= 0) {
              this.adjustPrice(idx, a.value);
              this.addEvent(`Price "${a.target}" → $${this.menuItems[idx].currentPrice.toFixed(2)}`);
            }
          }
          break;
        case "order_coffee_beans":
          if (!this.pendingOrders.some(o => o.type === "coffeeBeans") && this.money >= INGREDIENT_STOCK.coffeeBeans.orderCost) {
            this.money -= INGREDIENT_STOCK.coffeeBeans.orderCost;
            this.totalStockCost += INGREDIENT_STOCK.coffeeBeans.orderCost; this.dailyExpenses += INGREDIENT_STOCK.coffeeBeans.orderCost;
            this.pendingOrders.push({ type: "coffeeBeans", quantity: INGREDIENT_STOCK.coffeeBeans.orderQty, cost: INGREDIENT_STOCK.coffeeBeans.orderCost, arrivalTime: this.gameTime + 60 });
            this.addEvent("Ordered coffee beans ($12)");
          }
          break;
        case "order_milk":
          if (!this.pendingOrders.some(o => o.type === "milk") && this.money >= INGREDIENT_STOCK.milk.orderCost) {
            this.money -= INGREDIENT_STOCK.milk.orderCost;
            this.totalStockCost += INGREDIENT_STOCK.milk.orderCost; this.dailyExpenses += INGREDIENT_STOCK.milk.orderCost;
            this.pendingOrders.push({ type: "milk", quantity: INGREDIENT_STOCK.milk.orderQty, cost: INGREDIENT_STOCK.milk.orderCost, arrivalTime: this.gameTime + 60 });
            this.addEvent("Ordered milk ($6)");
          }
          break;
        case "order_cake_stock":
          if (a.target) {
            const idx = this.menuItems.findIndex(m => m.name === a.target);
            if (idx >= 0 && this.menuItems[idx].type === "cake" && this.menuItems[idx].unlocked) {
              const mi = MENU_ITEMS[idx];
              const cost = +(mi.wholesaleCost * mi.orderBatch).toFixed(2);
              if (!this.pendingOrders.some(o => o.type === a.target) && this.money >= cost) {
                this.money -= cost;
                this.totalStockCost += cost; this.dailyExpenses += cost;
                this.pendingOrders.push({ type: a.target!, quantity: mi.orderBatch, cost, arrivalTime: this.gameTime + 60 });
                this.addEvent(`Ordered ${mi.orderBatch}x ${a.target} ($${cost})`);
              }
            }
          }
          break;
      }
    }
  }

  async callClaudeAI(): Promise<{ thought: string; actions: { type: string; target?: string; value?: number }[] } | null> {
    try {
      const res = await fetch("/api/ai-decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-Id": this.sessionId,
        },
        body: JSON.stringify(this.getAISnapshot()),
      });
      if (res.status === 503) {
        // No API key — permanently disable Claude
        this.claudeEnabled = false;
        return null;
      }
      if (!res.ok) return null; // Rate limited or transient error — try again next cycle
      return await res.json();
    } catch {
      return null;
    }
  }

  aiDecisions() {
    // If Claude is enabled and no pending request, try Claude
    if (this.claudeEnabled && !this.aiPending) {
      this.aiPending = true;
      this.callClaudeAI()
        .then(result => {
          this.aiPending = false;
          if (result?.thought && Array.isArray(result?.actions)) {
            this.addThought(result.thought, "strategy");
            if (result.actions.length > 0 && result.actions[0].type !== "do_nothing") {
              this.applyAIActions(result.actions);
              this.sound.upgrade();
            }
          } else if (!this.claudeEnabled) {
            // Disabled during the call (503)
            this.addThought("No AI key configured — running on local autopilot. Add ANTHROPIC_API_KEY to .env.local for Claude AI.", "reflection");
            this.localAIDecisions();
          } else {
            this.localAIDecisions();
          }
        })
        .catch(() => {
          this.aiPending = false;
          this.claudeEnabled = false;
          this.addThought("Claude AI connection failed — switching to local autopilot.", "reflection");
          this.localAIDecisions();
        });
    } else if (!this.claudeEnabled) {
      this.localAIDecisions();
    }
    // If aiPending, skip this cycle (waiting for Claude response)
  }

  localAIDecisions() {
    if (this.tryUpgradeDecision()) {
      this.sound.upgrade();
    } else {
      this.makeObservation();
    }
  }

  tryUpgradeDecision(): boolean {
    const queueLen = this.queue.length;
    const occupiedTables = this.tableOccupants.slice(0, this.purchasedTables).filter(o => o !== null).length;
    const tableUtilization = this.purchasedTables > 0 ? occupiedTables / this.purchasedTables : 0;
    const avgWait = this.customersServed > 0 ? this.totalWaitAccum / this.customersServed : 0;
    const unlockedCount = this.menuItems.filter(m => m.unlocked).length;

    // PRIORITY 1: Hire barista if queue is long (wages are $14/min, no upfront cost)
    if (queueLen >= 3 && this.baristas.length < BARISTA_SLOTS.length) {
      this.hireBarista();
      this.addThought(
        `Queue is ${queueLen} deep! Hired barista #${this.baristas.length} at $14/min. We need hands on deck.`,
        "decision"
      );
      return true;
    }

    // PRIORITY 2: Buy table if seating is full
    if (tableUtilization >= 0.75 && this.purchasedTables < TABLE_POSITIONS.length) {
      const cost = TABLE_COSTS[this.purchasedTables];
      if (this.money >= cost) {
        this.buyTable();
        this.addThought(
          `Tables ${Math.round(tableUtilization * 100)}% full — bought table #${this.purchasedTables} for $${cost}. More seats = more revenue.`,
          "decision"
        );
        return true;
      }
    }

    // PRIORITY 3: Upgrade coffee machine if wait times are high
    if (avgWait > 12 && this.upgradeLevels.coffeeMachine < UPGRADES.coffeeMachine.maxLevel) {
      const cost = UPGRADES.coffeeMachine.costs[this.upgradeLevels.coffeeMachine];
      if (this.money >= cost) {
        this.purchaseUpgrade("coffeeMachine");
        this.addThought(
          `Avg wait ${avgWait.toFixed(1)}s is too slow. Upgraded coffee machine to Lv.${this.upgradeLevels.coffeeMachine} for $${cost}. ${Math.round((1 - this.getPrepMultiplier()) * 100)}% faster prep!`,
          "decision"
        );
        return true;
      }
    }

    // PRIORITY 4: Upgrade ambiance if rating is dropping
    if (this.rating < 3.8 && this.upgradeLevels.ambiance < UPGRADES.ambiance.maxLevel) {
      const cost = UPGRADES.ambiance.costs[this.upgradeLevels.ambiance];
      if (this.money >= cost) {
        this.purchaseUpgrade("ambiance");
        this.addThought(
          `Rating ${this.rating}/5 is concerning. Upgraded ambiance to Lv.${this.upgradeLevels.ambiance} for $${cost}. Customers will be more patient now.`,
          "decision"
        );
        return true;
      }
    }

    // PRIORITY 5: Unlock new menu items for variety
    if (unlockedCount < 7) {
      const nextItem = this.menuItems.find(m => !m.unlocked);
      if (nextItem && this.money >= nextItem.unlockCost && this.money > nextItem.unlockCost + 100) {
        const idx = this.menuItems.indexOf(nextItem);
        this.unlockMenuItem(idx);
        this.addThought(
          `Expanding our menu! Unlocked "${nextItem.name}" for $${nextItem.unlockCost}. Now serving ${unlockedCount + 1} items. Variety is key!`,
          "decision"
        );
        return true;
      }
    }

    // PRIORITY 6: Marketing if customer flow is low
    if (this.day > 2 && this.ordersToday < this.day * 2 && this.upgradeLevels.marketing < UPGRADES.marketing.maxLevel) {
      const cost = UPGRADES.marketing.costs[this.upgradeLevels.marketing];
      if (this.money >= cost && this.money > cost + 50) {
        this.purchaseUpgrade("marketing");
        this.addThought(
          `Only ${this.ordersToday} orders on day ${this.day}. Invested $${cost} in marketing (Lv.${this.upgradeLevels.marketing}). More customers incoming!`,
          "decision"
        );
        return true;
      }
    }

    // PRIORITY 7: Barista training for efficiency
    if (this.baristas.length >= 2 && this.upgradeLevels.baristaTraining < UPGRADES.baristaTraining.maxLevel) {
      const cost = UPGRADES.baristaTraining.costs[this.upgradeLevels.baristaTraining];
      if (this.money >= cost && this.money > cost + 200) {
        this.purchaseUpgrade("baristaTraining");
        this.addThought(
          `Training baristas to Lv.${this.upgradeLevels.baristaTraining} for $${cost}. ${Math.round(this.upgradeLevels.baristaTraining * 15)}% speed boost!`,
          "decision"
        );
        return true;
      }
    }

    // PRIORITY 8: Hire second barista earlier if queue builds (wages only, no upfront)
    if (queueLen >= 2 && this.baristas.length < BARISTA_SLOTS.length) {
      this.hireBarista();
      this.addThought(
        `Queue building to ${queueLen}. Hired barista #${this.baristas.length} at $14/min to keep service flowing.`,
        "decision"
      );
      return true;
    }

    // PRIORITY 9: Price adjustments when things are stable
    if (Math.random() < 0.4) {
      const unlocked = this.menuItems.filter(m => m.unlocked);
      if (unlocked.length > 0) {
        const item = unlocked[Math.floor(Math.random() * unlocked.length)];
        const idx = this.menuItems.indexOf(item);
        if (this.rating >= 4.3 && item.currentPrice < item.basePrice * 1.5) {
          this.adjustPrice(idx, 0.5);
          this.addThought(
            `Rating is strong at ${this.rating}/5 — raised "${item.name}" to $${item.currentPrice.toFixed(1)}. Premium quality deserves premium prices.`,
            "strategy"
          );
          return true;
        } else if (this.rating < 3.5 && item.currentPrice > item.basePrice * 0.8) {
          this.adjustPrice(idx, -0.5);
          this.addThought(
            `Rating low at ${this.rating}/5 — discounted "${item.name}" to $${item.currentPrice.toFixed(1)}. Value pricing to rebuild reputation.`,
            "strategy"
          );
          return true;
        }
      }
    }

    return false;
  }

  makeObservation() {
    const rand = Math.random();
    const avgWait = this.customersServed > 0 ? (this.totalWaitAccum / this.customersServed).toFixed(1) : "0";
    const unlockedCount = this.menuItems.filter(m => m.unlocked).length;

    if (rand < 0.12) {
      if (this.rating >= 4.5) {
        this.addThought(`Rating ${this.rating}/5.0 — customers love us! Investments in quality are paying off.`, "observation");
      } else if (this.rating < 3.5) {
        this.addThought(`Rating ${this.rating}/5.0 is worrying. Focus: reduce wait times and upgrade ambiance.`, "observation");
      } else {
        this.addThought(`Rating holding at ${this.rating}/5.0. Steady but room to improve.`, "observation");
      }
    } else if (rand < 0.24) {
      this.addThought(
        `Wait time avg: ${avgWait}s. ${parseFloat(avgWait) < 10 ? "In target range." : "Above target — consider coffee machine upgrade or more baristas."}`,
        "observation"
      );
    } else if (rand < 0.36) {
      this.addThought(
        `Menu: ${unlockedCount}/${this.menuItems.length} items. Tables: ${this.purchasedTables}/${TABLE_POSITIONS.length}. Baristas: ${this.baristas.length}/3. Funds: $${this.money.toFixed(0)}.`,
        "observation"
      );
    } else if (rand < 0.48) {
      const coffeeRatio = this.coffeeSold > 0 ? (this.coffeeSold / Math.max(1, this.coffeeSold + this.cakesSold) * 100).toFixed(0) : "0";
      this.addThought(
        `Sales mix: ${coffeeRatio}% coffee, ${100 - parseInt(coffeeRatio)}% food. ${parseInt(coffeeRatio) > 70 ? "Unlock more food items to diversify." : "Good balance!"}`,
        "strategy"
      );
    } else if (rand < 0.6) {
      this.addThought(
        `Day ${this.day} revenue: $${this.dailyRevenue.toFixed(0)} from ${this.dailyOrders} orders. ${this.dailyRevenue > this.prevDayRevenue ? "Trending up!" : "Need to boost traffic."}`,
        "observation"
      );
    } else if (rand < 0.72) {
      const upgradeNames = Object.entries(UPGRADES)
        .filter(([key]) => this.upgradeLevels[key] > 0)
        .map(([key, def]) => `${def.name} Lv.${this.upgradeLevels[key]}`)
        .join(", ");
      this.addThought(
        upgradeNames
          ? `Active upgrades: ${upgradeNames}. Every investment compounds into better service.`
          : `No upgrades yet. Saving up for our first investment — considering options carefully.`,
        "reflection"
      );
    } else if (rand < 0.84) {
      this.addThought(
        `${this.customersServed} total customers served. $${this.totalRevenue.toFixed(0)} lifetime revenue. Building something great here.`,
        "reflection"
      );
    } else if (rand < 0.92) {
      // Stock observation
      const lowCakes = this.menuItems
        .filter((m, i) => m.type === "cake" && m.unlocked && this.itemStock[i] <= 3)
        .map(m => m.name);
      if (lowCakes.length > 0) {
        this.addThought(
          `Inventory check: ${lowCakes.join(", ")} running low. ${this.pendingOrders.length > 0 ? `${this.pendingOrders.length} delivery order${this.pendingOrders.length > 1 ? "s" : ""} en route.` : "Need to reorder soon!"}`,
          "strategy"
        );
      } else {
        this.addThought(
          `Stock levels: ${this.ingredientStock.coffeeBeans} coffee servings, ${this.ingredientStock.milk} milk servings. ${this.pendingOrders.length > 0 ? `${this.pendingOrders.length} delivery incoming.` : "Supplies looking good."}`,
          "observation"
        );
      }
    } else {
      this.addThought(
        `${this.baristas.length} barista${this.baristas.length > 1 ? "s" : ""} on shift. ${this.queue.length > 0 ? `${this.queue.length} in queue.` : "No queue — smooth operations."} Watching closely.`,
        "strategy"
      );
    }
  }

  update(dt: number) {
    this.gameTime += dt;

    // Process pending stock deliveries
    for (let i = this.pendingOrders.length - 1; i >= 0; i--) {
      const order = this.pendingOrders[i];
      if (this.gameTime >= order.arrivalTime) {
        if (order.type === "coffeeBeans") {
          this.ingredientStock.coffeeBeans += order.quantity;
        } else if (order.type === "milk") {
          this.ingredientStock.milk += order.quantity;
        } else {
          const idx = this.menuItems.findIndex(m => m.name === order.type);
          if (idx >= 0) this.itemStock[idx] += order.quantity;
        }
        this.sound.deliveryArrive();
        this.addEvent(`Delivery: ${order.quantity}x ${order.type}`);
        this.addThought(
          `Delivery arrived: ${order.quantity}x ${order.type}! Stock replenished.`,
          "observation"
        );
        this.pendingOrders.splice(i, 1);
      }
    }

    // Stock management check every 5 seconds
    this.stockCheckTimer += dt;
    if (this.stockCheckTimer >= 5) {
      this.stockCheckTimer = 0;
      this.manageStock();
    }

    // Day cycle (every 90 seconds = 1 day)
    this.dayTimer += dt;
    if (this.dayTimer >= 90) {
      this.dayTimer = 0;
      this.day++;
      if (this.dailyOrders > 0) this.streak++;
      else this.streak = 0;
      this.prevDayRevenue = this.dailyRevenue;
      this.dailyRevenue = 0;
      this.dailyOrders = 0;
      this.ordersToday = 0;
      this.dailyIncome = 0;
      this.dailyWagesCost = 0;
      this.dailyExpenses = 0;
      this.sound.newDay();
      this.addEvent(`Day ${this.day} started — yesterday: $${this.prevDayRevenue.toFixed(0)}`);
      this.addThought(
        `Day ${this.day} begins! Yesterday's revenue was $${this.prevDayRevenue.toFixed(0)}. Let's beat it today.`,
        "reflection"
      );
    }

    // Barista wages — $14/minute per barista, deducted every 60s
    this.wageTimer += dt;
    if (this.wageTimer >= 60) {
      this.wageTimer -= 60;
      const wages = this.baristas.length * 14;
      if (wages > 0) {
        this.money -= wages;
        this.totalWages += wages;
        this.dailyWagesCost += wages;
        this.dailyExpenses += wages;
        this.addEvent(`Paid $${wages} wages (${this.baristas.length} barista${this.baristas.length > 1 ? "s" : ""} × $14/min)`);
      }
    }

    // Spawn customers
    this.spawnTimer += dt;
    // Rating affects customer flow: high rating = more customers, low rating = fewer
    // rating 5.0 → 0.6x interval (very busy), rating 2.5 → 1.0x, rating 1.0 → 1.6x (ghost town)
    const ratingFactor = 1.6 - (this.rating / 5) * 1.0;
    // Day acceleration capped: interval shrinks slowly, minimum 3s between customers
    const dayAccel = Math.min(this.day * 0.05, 3);
    const interval = Math.max(3.0, (this.spawnInterval - dayAccel) * this.getSpawnMultiplier() * ratingFactor);
    if (this.spawnTimer >= interval && this.customers.length < 15) {
      this.spawnTimer = 0;
      this.spawnCustomer();
    }

    this.updateBaristas(dt);
    this.updateCustomers(dt);
    this.updatePopups(dt);
    this.updateVisuals();
    this.updateStockHud();

    // Record funds history every 5 seconds (keeps array manageable)
    this.fundsSnapshotTimer += dt;
    if (this.fundsSnapshotTimer >= 5) {
      this.fundsSnapshotTimer = 0;
      this.fundsHistory.push({ time: this.gameTime, money: +this.money.toFixed(2) });
      if (this.fundsHistory.length > 500) this.fundsHistory.shift(); // Cap at ~40 min of data
    }

    // AI decision cycle — 30s for Claude (API cost), 12s for local fallback
    const aiInterval = this.claudeEnabled ? 30 : 12;
    this.aiTimer += dt;
    if (this.aiTimer >= aiInterval) {
      this.aiTimer = 0;
      this.aiDecisions();
    }

    // Update thought timestamps
    for (const t of this.thoughts) {
      const age = this.gameTime - (this.gameTime - this.thoughts.indexOf(t) * 12);
      if (this.thoughts.indexOf(t) === 0) t.time = "just now";
      else {
        const idx = this.thoughts.indexOf(t);
        const secs = idx * 12;
        t.time = secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;
      }
    }
  }

  getStats(): GameStats {
    return {
      coffeeSold: this.coffeeSold,
      cakesSold: this.cakesSold,
      revenue: Math.round(this.totalRevenue * 100) / 100,
      baristasCount: this.baristas.length,
      rating: this.rating,
      customersServed: this.customersServed,
      ordersToday: this.ordersToday,
      profitMargin: this.totalRevenue > 0 ? Math.round((100 - 30 - this.baristas.length * 8) * 10) / 10 : 0,
      streak: this.streak,
      avgWaitTime: this.customersServed > 0 ? Math.round(this.totalWaitAccum / this.customersServed * 10) / 10 : 0,
      day: this.day,
      money: Math.round(this.money * 100) / 100,
      tables: this.purchasedTables,
      maxTables: TABLE_POSITIONS.length,
      unlockedItems: this.menuItems.filter(m => m.unlocked).length,
      totalItems: this.menuItems.length,
      upgrades: Object.entries(UPGRADES).map(([key, def]) => ({
        name: def.name,
        level: this.upgradeLevels[key],
        maxLevel: def.maxLevel,
      })),
      menuItemsList: this.menuItems.map((m, i) => ({
        name: m.name,
        type: m.type,
        currentPrice: m.currentPrice,
        basePrice: m.basePrice,
        unlocked: m.unlocked,
        unlockCost: m.unlockCost,
        stock: this.itemStock[i],
        recipe: m.recipe,
        wholesaleCost: m.wholesaleCost,
      })),
      stock: {
        coffeeBeans: this.ingredientStock.coffeeBeans,
        milk: this.ingredientStock.milk,
      },
      pendingDeliveries: this.pendingOrders.length,
      fundsHistory: this.fundsHistory,
      financials: {
        totalIncome: +this.totalIncome.toFixed(2),
        totalWages: +this.totalWages.toFixed(2),
        totalStockCost: +this.totalStockCost.toFixed(2),
        totalUpgrades: +this.totalUpgradeCost.toFixed(2),
        totalTableCost: +this.totalTableCost.toFixed(2),
        totalUnlockCost: +this.totalUnlockCost.toFixed(2),
        dailyIncome: +this.dailyIncome.toFixed(2),
        dailyWages: +this.dailyWagesCost.toFixed(2),
        dailyExpenses: +this.dailyExpenses.toFixed(2),
      },
    };
  }

  dispose() {
    // Clean up all meshes
    for (const b of this.baristas) {
      this.characterGroup.remove(b.mesh);
      (b.mesh.material as THREE.MeshBasicMaterial).dispose();
      this.removeProgressBar(b);
    }
    for (const c of this.customers) {
      this.characterGroup.remove(c.mesh);
      (c.mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    for (const p of this.moneyPopups) {
      this.uiGroup.remove(p.mesh);
      (p.mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    // Clean up stock HUD
    this.scene.remove(this.stockHudMesh);
    this.stockHudTex.dispose();
    (this.stockHudMesh.material as THREE.MeshBasicMaterial).dispose();
    this.stockHudGeo.dispose();

    // Clean up table meshes
    if (this.tableMeshes.length > 0) {
      (this.tableMeshes[0].material as THREE.MeshBasicMaterial).map?.dispose();
    }
    for (const m of this.tableMeshes) {
      this.scene.remove(m);
      (m.material as THREE.MeshBasicMaterial).dispose();
    }
    // Clean up decoration meshes
    for (const d of this.decorMeshes) {
      this.scene.remove(d.mesh);
      (d.mesh.material as THREE.MeshBasicMaterial).map?.dispose();
      (d.mesh.material as THREE.MeshBasicMaterial).dispose();
      d.mesh.geometry.dispose();
    }
    this.sharedGeo.dispose();
    this.shadowGeo.dispose();
    this.progressGeo.dispose();
    this.popupGeo.dispose();
    this.bubbleGeo.dispose();
    this.tableGeo.dispose();
    this.shadowTex.dispose();
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
}

export default function CafeGame({ onStatsUpdate, onThoughtsUpdate }: CafeGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CafeEngine | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  const statsCallback = useCallback(
    (stats: GameStats) => onStatsUpdate?.(stats),
    [onStatsUpdate]
  );
  const thoughtsCallback = useCallback(
    (thoughts: AIThought[]) => onThoughtsUpdate?.(thoughts),
    [onThoughtsUpdate]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Three.js Setup ──
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setClearColor(0x0c0c14);
    renderer.setPixelRatio(1); // Force 1:1 for pixel look
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c14);

    const camera = new THREE.OrthographicCamera(0, GAME_W, GAME_H, 0, 0.1, 100);
    camera.position.set(0, 0, 10);

    // ── Background ──
    const bgTex = createCafeBackground();
    const bgGeo = new THREE.PlaneGeometry(GAME_W, GAME_H);
    const bgMat = new THREE.MeshBasicMaterial({ map: bgTex });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(GAME_W / 2, GAME_H / 2, 0);
    scene.add(bgMesh);

    // ── Game Engine ──
    const engine = new CafeEngine(scene);
    engineRef.current = engine;

    // ── Audio — resume on first user interaction (browser autoplay policy) ──
    const resumeAudio = () => engine.sound.resume();
    container.addEventListener("click", resumeAudio);
    container.addEventListener("touchstart", resumeAudio);
    document.addEventListener("click", resumeAudio, { once: true });

    // ── Resize ──
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);

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

    // ── Game Loop ──
    let lastTime = 0;
    let statsTimer = 0;

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      engine.update(dt);

      // Throttle stats updates
      statsTimer += dt;
      if (statsTimer >= 0.5) {
        statsTimer = 0;
        statsCallback(engine.getStats());
        thoughtsCallback([...engine.thoughts]);
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    // ── Cleanup ──
    return () => {
      cancelAnimationFrame(frameRef.current);
      resizeObs.disconnect();
      container.removeEventListener("click", resumeAudio);
      container.removeEventListener("touchstart", resumeAudio);
      engine.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      bgTex.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
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
