import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING — in-memory, per session, non-bypassable
// ═══════════════════════════════════════════════════════════════

const sessions = new Map<string, { lastCall: number; count: number; created: number }>();
const RATE_LIMIT_MS = 20_000;   // Min 20s between calls
const MAX_CALLS = 300;          // Max calls per session lifetime
const SESSION_TTL = 3600_000;   // Sessions expire after 1 hour

// Periodic cleanup of expired sessions
function cleanSessions() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.created > SESSION_TTL) sessions.delete(id);
  }
}

// ═══════════════════════════════════════════════════════════════
// INPUT VALIDATION — reject anything malformed before it hits Claude
// ═══════════════════════════════════════════════════════════════

interface GameStateInput {
  day: number;
  money: number;
  rating: number;
  baristas: number;
  queue: number;
  tables: number;
  beans: number;
  milk: number;
  ordersToday: number;
  dailyRev: number;
  menu: unknown[];
  upgrades: unknown[];
  deliveries: unknown[];
  events: string[];
}

function validateGameState(body: unknown): body is GameStateInput {
  if (!body || typeof body !== "object") return false;
  const s = body as Record<string, unknown>;

  // Type + range checks on critical numeric fields
  if (typeof s.money !== "number" || s.money < -500 || s.money > 999999) return false;
  if (typeof s.rating !== "number" || s.rating < 0 || s.rating > 5.1) return false;
  if (typeof s.day !== "number" || s.day < 0 || s.day > 99999) return false;
  if (typeof s.baristas !== "number" || s.baristas < 0 || s.baristas > 10) return false;
  if (typeof s.queue !== "number") return false;
  if (typeof s.tables !== "number") return false;
  if (typeof s.beans !== "number") return false;
  if (typeof s.milk !== "number") return false;
  if (typeof s.ordersToday !== "number") return false;
  if (typeof s.dailyRev !== "number") return false;

  // Arrays exist and are bounded
  if (!Array.isArray(s.menu) || s.menu.length > 20) return false;
  if (!Array.isArray(s.upgrades) || s.upgrades.length > 10) return false;
  if (!Array.isArray(s.deliveries) || s.deliveries.length > 20) return false;
  if (!Array.isArray(s.events) || s.events.length > 20) return false;

  // Sanitize event strings
  for (const e of s.events as unknown[]) {
    if (typeof e !== "string" || e.length > 200) return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════
// OUTPUT VALIDATION — never trust model output blindly
// ═══════════════════════════════════════════════════════════════

const VALID_ACTIONS = new Set([
  "hire_barista", "fire_barista", "buy_table",
  "upgrade_coffee_machine", "upgrade_barista_training",
  "upgrade_ambiance", "upgrade_marketing",
  "unlock_menu_item", "adjust_price",
  "order_coffee_beans", "order_milk", "order_cake_stock",
  "do_nothing",
]);

interface ValidAction {
  type: string;
  target?: string;
  value?: number;
}

function validateActions(raw: unknown): ValidAction[] {
  if (!Array.isArray(raw)) return [];
  const results: ValidAction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const a = item as Record<string, unknown>;
    const type = String(a.type ?? "");
    if (!VALID_ACTIONS.has(type)) continue;
    results.push({
      type,
      target: typeof a.target === "string" ? a.target.slice(0, 50) : undefined,
      value: typeof a.value === "number" ? Math.max(-5, Math.min(5, a.value)) : undefined,
    });
    if (results.length >= 5) break; // Max 5 actions per decision
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT — teaches Claude the game
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You manage "Claude's Cafe", a pixel-art cafe sim. Receive state, make decisions.

GOAL: Maximize revenue+rating(1-5). Start $100+stock.

RULES: Rating→customer flow (5★=busy,1★=dead). Out of stock→angry→rating drops. Deliveries take 60s. Day=90s real-time. Long waits→leave→rating drops.

COSTS: Barista: no upfront cost, $14/min wage each(max 3)—more baristas=higher ongoing cost! Tables: 2 free, then $120,$160,$200,$250,$300,$350. Beans 40/$12. Milk 30/$6. Cakes: wholesale×batch.
Upgrades(5 levels each): Machine[$200,$350,$550,$800,$1200] Training[$150,$300,$500,$750,$1100] Ambiance[$100,$200,$400,$650,$950] Marketing[$120,$250,$400,$600,$900]

RECIPES: Espresso=1bean Latte/Cappuccino/Mocha=1bean+1milk ColdBrew=2bean MatchaLatte=1milk Tiramisu(cake)=1bean

STATE: menu stock=-1 means uses beans/milk. Locked items show unlockCost. Upgrades only if below max. deliveries=[type,qty,eta_sec].

STRATEGY: Keep reserves for restocking+wages! Out-of-stock kills rating. More baristas=shorter waits but higher wage bill. Hiring is free but wages add up—don't over-hire early! Fire baristas if wages>income. Adjust prices freely (adjust_price with delta, e.g. +0.5 or -1.0). It is perfectly fine to do_nothing if the situation is stable.`;

// ═══════════════════════════════════════════════════════════════
// TOOL DEFINITION — structured output for reliable parsing
// ═══════════════════════════════════════════════════════════════

const DECISION_TOOL: Anthropic.Tool = {
  name: "decide",
  description: "Cafe management decisions",
  input_schema: {
    type: "object" as const,
    properties: {
      thought: {
        type: "string",
        description: "1-2 sentence reasoning (shown to player)",
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "hire_barista", "fire_barista", "buy_table",
                "upgrade_coffee_machine", "upgrade_barista_training",
                "upgrade_ambiance", "upgrade_marketing",
                "unlock_menu_item", "adjust_price",
                "order_coffee_beans", "order_milk", "order_cake_stock",
                "do_nothing",
              ],
            },
            target: { type: "string", description: "Item name" },
            value: { type: "number", description: "Price delta" },
          },
          required: ["type"],
        },
      },
    },
    required: ["thought", "actions"],
  },
};

// ═══════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  // ── 1. Check API key exists (server-side only) ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  // ── 2. Rate limiting ──
  cleanSessions();
  const sessionId = request.headers.get("x-session-id");
  if (!sessionId || sessionId.length < 8 || sessionId.length > 64) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const now = Date.now();
  const session = sessions.get(sessionId) || { lastCall: 0, count: 0, created: now };

  if (now - session.lastCall < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "Rate limited", retryAfter: RATE_LIMIT_MS / 1000 }, { status: 429 });
  }
  if (session.count >= MAX_CALLS) {
    return NextResponse.json({ error: "Session limit reached" }, { status: 429 });
  }

  session.lastCall = now;
  session.count++;
  sessions.set(sessionId, session);

  // ── 3. Parse + validate input ──
  let gameState: GameStateInput;
  try {
    const body = await request.json();
    if (!validateGameState(body)) {
      return NextResponse.json({ error: "Invalid game state" }, { status: 400 });
    }
    gameState = body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 4. Call Claude ──
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 280,
      system: SYSTEM_PROMPT,
      tools: [DECISION_TOOL],
      tool_choice: { type: "tool", name: "decide" },
      messages: [
        {
          role: "user",
          content: JSON.stringify(gameState),
        },
      ],
    });

    // ── 5. Extract + validate tool response ──
    const toolUse = response.content.find((c): c is Anthropic.ToolUseBlock => c.type === "tool_use");
    if (!toolUse) {
      return NextResponse.json({ error: "No decision returned" }, { status: 500 });
    }

    const input = toolUse.input as { thought?: string; actions?: unknown[] };
    const thought = typeof input.thought === "string" ? input.thought.slice(0, 500) : "Analyzing...";
    const actions = validateActions(input.actions);

    return NextResponse.json({ thought, actions });
  } catch (err) {
    console.error("[ai-decision] Claude API error:", err);
    return NextResponse.json({ error: "AI temporarily unavailable" }, { status: 502 });
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
