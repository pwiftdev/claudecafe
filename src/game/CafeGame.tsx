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

const MENU = [
  { name: "Espresso", type: "coffee" as const, price: 3.5, prep: 2.5 },
  { name: "Latte", type: "coffee" as const, price: 4.5, prep: 3.2 },
  { name: "Cappuccino", type: "coffee" as const, price: 4.0, prep: 2.8 },
  { name: "Mocha", type: "coffee" as const, price: 5.0, prep: 3.5 },
  { name: "Chocolate Cake", type: "cake" as const, price: 5.5, prep: 3.8 },
  { name: "Croissant", type: "cake" as const, price: 3.0, prep: 2.0 },
  { name: "Muffin", type: "cake" as const, price: 3.5, prep: 2.2 },
  { name: "Cheesecake", type: "cake" as const, price: 6.0, prep: 4.0 },
];

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

  // ── TABLES ──
  TABLE_POSITIONS.forEach((t) => {
    const x = t.x * T, y = cy(t.y);
    // table top (circle-ish)
    px(ctx, x - 4, y + 2, T + 8, T - 4, "#6b4a2e");
    px(ctx, x - 2, y, T + 4, T, "#7a5838");
    px(ctx, x, y - 2, T, T + 4, "#7a5838");
    // center
    px(ctx, x + 2, y + 2, T - 4, T - 4, "#8b6840");
    // chairs (4 around table)
    const chairC = "#4a3422";
    px(ctx, x - T + 4, y + 4, 8, 8, chairC); // left
    px(ctx, x + T - 4, y + 4, 8, 8, chairC); // right
    px(ctx, x + 4, y - T + 4, 8, 8, chairC); // bottom
    px(ctx, x + 4, y + T - 4, 8, 8, chairC); // top
  });

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
}

interface MoneyPopup {
  mesh: THREE.Mesh;
  timer: number;
  y: number;
}

// ═══════════════════════════════════════════════════════════════
// GAME ENGINE
// ═══════════════════════════════════════════════════════════════

class CafeEngine {
  scene: THREE.Scene;
  characterGroup: THREE.Group;
  uiGroup: THREE.Group;

  baristas: Barista[] = [];
  customers: Customer[] = [];
  queue: number[] = []; // customer IDs in queue order
  tableOccupants: (number | null)[];
  moneyPopups: MoneyPopup[] = [];

  money = 500;
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
  spawnInterval = 5;
  nextId = 1;
  aiTimer = 0;
  gameTime = 0;
  thoughts: AIThought[] = [];
  thoughtId = 1;

  sharedGeo = new THREE.PlaneGeometry(CHAR_W, CHAR_H);
  shadowGeo = new THREE.PlaneGeometry(0.5, 0.2);
  progressGeo = new THREE.PlaneGeometry(0.6, 0.12);
  popupGeo = new THREE.PlaneGeometry(1.2, 0.3);
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

  spawnCustomer() {
    const texIndex = Math.floor(Math.random() * this.customerTextures.length);
    const tex = this.customerTextures[texIndex];
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    mesh.position.set(DOOR_X, DOOR_Y, 0.5);
    this.characterGroup.add(mesh);

    const item = MENU[Math.floor(Math.random() * MENU.length)];

    const customer: Customer = {
      id: this.nextId++,
      x: DOOR_X,
      y: DOOR_Y,
      targetX: DOOR_X,
      targetY: DOOR_Y,
      state: "entering",
      timer: 0,
      order: { ...item },
      waitStartTime: this.gameTime,
      totalWait: 0,
      tableIndex: -1,
      mesh,
      bobOffset: 0,
      bobTimer: 0,
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
      .map((occ, i) => (occ === null ? i : -1))
      .filter((i) => i >= 0);
    return free.length > 0 ? free[Math.floor(Math.random() * free.length)] : -1;
  }

  moveToward(entity: { x: number; y: number; targetX: number; targetY: number }, dt: number): boolean {
    const dx = entity.targetX - entity.x;
    const dy = entity.targetY - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.05) {
      entity.x = entity.targetX;
      entity.y = entity.targetY;
      return true;
    }
    const step = Math.min(MOVE_SPEED * dt, dist);
    entity.x += (dx / dist) * step;
    entity.y += (dy / dist) * step;
    return false;
  }

  removeCustomer(customer: Customer) {
    this.characterGroup.remove(customer.mesh);
    (customer.mesh.material as THREE.MeshBasicMaterial).dispose();
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

      switch (b.state) {
        case "idle":
          b.targetX = slot.idle.x;
          b.targetY = slot.idle.y;
          this.moveToward(b, dt);

          // Check for waiting customer
          if (this.queue.length > 0) {
            const frontId = this.queue[0];
            const frontCustomer = this.customers.find((c) => c.id === frontId);
            if (frontCustomer && frontCustomer.state === "at_counter") {
              b.servingCustomerId = frontId;
              b.state = "going_to_counter";
              b.targetX = slot.counter.x;
              b.targetY = slot.counter.y;
            }
          }
          break;

        case "going_to_counter":
          if (this.moveToward(b, dt)) {
            b.state = "taking_order";
            b.timer = 1.0;
          }
          break;

        case "taking_order":
          b.timer -= dt;
          if (b.timer <= 0) {
            const customer = this.customers.find((c) => c.id === b.servingCustomerId);
            if (customer) {
              b.orderPrepTime = customer.order.prep;
              b.orderProgress = 0;
              customer.state = "waiting_drink";
            }
            b.state = "going_to_machine";
            b.targetX = slot.machine.x;
            b.targetY = slot.machine.y;
          }
          break;

        case "going_to_machine":
          if (this.moveToward(b, dt)) {
            b.state = "making";
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
          if (this.moveToward(b, dt)) {
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
          // Update queue position
          const myQIdx = this.queue.indexOf(c.id);
          if (myQIdx === 0) {
            // Front of queue — move to counter
            c.targetX = this.getQueuePos(0).x;
            c.targetY = QUEUE_Y + 0.5;
            if (this.moveToward(c, dt)) {
              c.state = "at_counter";
            }
          } else if (myQIdx > 0) {
            const pos = this.getQueuePos(myQIdx);
            c.targetX = pos.x;
            c.targetY = pos.y;
            this.moveToward(c, dt);
          }
          break;
        }

        case "at_counter":
          // Waiting for barista — just stand
          break;

        case "waiting_drink":
          // Waiting for barista to finish — just stand
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

  aiDecisions() {
    // Hire barista if queue is long and we can afford it
    if (this.queue.length >= 2 && this.baristas.length < BARISTA_SLOTS.length && this.money >= 150) {
      this.money -= 150;
      this.hireBarista();
      this.addThought(
        `Queue is ${this.queue.length} customers long. Hired barista #${this.baristas.length} for $150 to speed up service.`,
        "decision"
      );
    }

    // Observations based on game state
    const rand = Math.random();
    if (rand < 0.15) {
      if (this.rating >= 4.5) {
        this.addThought(
          `Customer rating is ${this.rating}/5.0 — excellent! Happy customers mean repeat business.`,
          "observation"
        );
      } else if (this.rating < 3.5) {
        this.addThought(
          `Rating dropped to ${this.rating}/5.0. Wait times are too long. Need to optimize our workflow.`,
          "observation"
        );
      }
    } else if (rand < 0.3) {
      const avg = this.customersServed > 0 ? (this.totalWaitAccum / this.customersServed).toFixed(1) : "0";
      this.addThought(
        `Average wait time is ${avg}s. ${parseFloat(avg) < 10 ? "That's within our target range." : "We should try to get this under 10 seconds."}`,
        "observation"
      );
    } else if (rand < 0.45) {
      const coffeeRatio = this.coffeeSold > 0 ? (this.coffeeSold / Math.max(1, this.coffeeSold + this.cakesSold) * 100).toFixed(0) : "0";
      this.addThought(
        `Coffee makes up ${coffeeRatio}% of sales. ${parseInt(coffeeRatio) > 70 ? "Should promote cake items to diversify revenue." : "Good product mix between coffee and food."}`,
        "strategy"
      );
    } else if (rand < 0.6) {
      this.addThought(
        `Day ${this.day} revenue: $${this.dailyRevenue.toFixed(0)} from ${this.dailyOrders} orders. ${this.dailyRevenue > this.prevDayRevenue ? "Trending up from yesterday!" : "Need to boost customer traffic."}`,
        "observation"
      );
    } else if (rand < 0.7 && this.baristas.length < BARISTA_SLOTS.length) {
      this.addThought(
        `Evaluating whether to hire barista #${this.baristas.length + 1}. Current funds: $${this.money.toFixed(0)}. ${this.money > 200 ? "We have the budget." : "Might need to save up more first."}`,
        "decision"
      );
    } else if (rand < 0.8) {
      this.addThought(
        `Total customers served: ${this.customersServed}. Each one is a chance to build brand loyalty. Keep up the quality!`,
        "reflection"
      );
    } else {
      this.addThought(
        `${this.baristas.length} barista${this.baristas.length > 1 ? "s" : ""} on shift. ${this.queue.length > 0 ? `${this.queue.length} in queue right now.` : "No queue — perfect efficiency."} Watching the flow carefully.`,
        "strategy"
      );
    }
  }

  update(dt: number) {
    this.gameTime += dt;

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
      this.addThought(
        `Day ${this.day} begins! Yesterday's revenue was $${this.prevDayRevenue.toFixed(0)}. Let's beat it today.`,
        "reflection"
      );
    }

    // Spawn customers
    this.spawnTimer += dt;
    // Speed up over time, max out at ~1.5s interval
    const interval = Math.max(1.5, this.spawnInterval - this.day * 0.1);
    if (this.spawnTimer >= interval && this.customers.length < 15) {
      this.spawnTimer = 0;
      this.spawnCustomer();
    }

    this.updateBaristas(dt);
    this.updateCustomers(dt);
    this.updatePopups(dt);

    // AI decision every 12 seconds
    this.aiTimer += dt;
    if (this.aiTimer >= 12) {
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
      profitMargin: this.totalRevenue > 0 ? Math.round((100 - 30 - this.baristas.length * 4) * 10) / 10 : 0,
      streak: this.streak,
      avgWaitTime: this.customersServed > 0 ? Math.round(this.totalWaitAccum / this.customersServed * 10) / 10 : 0,
      day: this.day,
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
    this.sharedGeo.dispose();
    this.shadowGeo.dispose();
    this.progressGeo.dispose();
    this.popupGeo.dispose();
    this.shadowTex.dispose();
    for (const t of this.baristaTextures) t.dispose();
    for (const t of this.customerTextures) t.dispose();
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
