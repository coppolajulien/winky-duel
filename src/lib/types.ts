export type GamePhase = "idle" | "approving" | "camera" | "countdown" | "playing" | "submitting" | "result";

// ─── On-chain types ─────────────────────────────────────────────

/** Matches the Solidity enum WinkyDuel.Status */
export enum DuelStatus {
  Open = 0,
  Settled = 1,
  Cancelled = 2,
}

/** Raw duel data from the contract */
export interface OnChainDuel {
  id: bigint;
  creator: `0x${string}`;
  challenger: `0x${string}`;
  stake: bigint;
  creatorScore: number;
  challengerScore: number;
  status: DuelStatus;
}

// ─── UI types ───────────────────────────────────────────────────

/** Duel formatted for display */
export interface Duel {
  id: bigint;
  creator: string;            // abbreviated "0x7aB3...c92F"
  creatorFull: `0x${string}`; // full address (for comparison)
  stake: number;              // human-readable e.g. 5 (USDM)
  stakeRaw: bigint;           // raw wei for contract calls
  score: number;              // creator's blink score
  time: string;               // "Open"
}

export interface LeaderboardEntry {
  r: number;
  addr: string;
  blinks: number;
  wins: number;
  earn: number;
}

export interface TxToastData {
  id: number;
  hash: string;
  status: "pending" | "confirmed" | "failed";
  label?: string;
}

export interface ChartPoint {
  t: number;
  you: number;
  target?: number;
}

/** Settled/cancelled duel for history display */
export interface HistoryDuel {
  id: bigint;
  creator: string;
  creatorFull: `0x${string}`;
  challenger: string;
  challengerFull: `0x${string}`;
  stake: number;
  creatorScore: number;
  challengerScore: number;
  status: DuelStatus;
  won: boolean | null; // relative to currentAddress — null = not involved or draw
}

export interface GameResult {
  my: number;
  target: number | null;
  won: boolean | null;
  isChallenge: boolean;
  error?: string;
}
