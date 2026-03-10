import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { createPublicClient, http } from "viem";
import { appChain } from "@/lib/chain";
import { privateKeyToAccount } from "viem/accounts";
import { WINKY_DUEL_ADDRESS, WINKY_DUEL_ABI } from "@/lib/constants";

// ─── Redis ─────────────────────────────────────────────────────
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// ─── On-chain client ───────────────────────────────────────────
export const publicClient = createPublicClient({
  chain: appChain,
  transport: http(),
});

// ─── Game signer ───────────────────────────────────────────────
export function getSignerAccount() {
  const key = process.env.GAME_SIGNER_KEY;
  if (!key) throw new Error("GAME_SIGNER_KEY not set");
  return privateKeyToAccount(key as `0x${string}`);
}

// ─── Types ─────────────────────────────────────────────────────
export interface GameSession {
  sessionId: string;
  player: string;
  nonce: number;
  startedAt: number;      // ms timestamp (Date.now() at session creation)
  blinks: number[];       // client-reported timestamps (ms since startedAt)
  serverBlinks: number[]; // server-recorded timestamps (ms since startedAt)
  finished: boolean;
}

// ─── Redis keys ────────────────────────────────────────────────
export const SESSION_KEY = (id: string) => `game:session:${id}`;
export const ACTIVE_KEY = (player: string) => `game:active:${player.toLowerCase()}`;
const SESSION_TTL = 300; // 5 minutes

// ─── Session helpers ───────────────────────────────────────────
export async function getSession(sessionId: string): Promise<GameSession | null> {
  const data = await redis.get<GameSession>(SESSION_KEY(sessionId));
  return data;
}

export async function saveSession(session: GameSession): Promise<void> {
  await redis.set(SESSION_KEY(session.sessionId), session, { ex: SESSION_TTL });
}

// ─── On-chain nonce ────────────────────────────────────────────
export async function getOnChainNonce(player: string): Promise<bigint> {
  return publicClient.readContract({
    address: WINKY_DUEL_ADDRESS,
    abi: WINKY_DUEL_ABI,
    functionName: "nonces",
    args: [player as `0x${string}`],
  }) as Promise<bigint>;
}

// ─── Rate limiting ─────────────────────────────────────────────
export async function isRateLimited(ip: string, limit: number = 200, window: number = 60, prefix: string = "game"): Promise<boolean> {
  const key = `rl:${prefix}:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, window);
  return count > limit;
}

// ─── IP extraction ─────────────────────────────────────────────
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// ─── Validation ────────────────────────────────────────────────
export function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// ─── Game constants (must match client) ────────────────────────
export const GAME_DURATION_MS = 30_000;
export const MIN_GAME_DURATION_MS = 25_000;
export const MIN_BLINK_INTERVAL_MS = 200;
export const MAX_BLINKS_PER_SECOND = 7;
export const MAX_SCORE = 150;

// ─── Anti-bot constants (server-side only) ─────────────────
// Minimum real-time gap between blink API calls (generous to allow network jitter)
export const SERVER_MIN_BLINK_INTERVAL_MS = 100;
// Max allowed drift: client timestamp vs real elapsed time
export const MAX_CLOCK_DRIFT_MS = 5_000;
// Game window buffer: stop accepting blinks after game duration + buffer
export const GAME_WINDOW_BUFFER_MS = 5_000;
