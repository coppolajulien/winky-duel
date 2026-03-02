export type GamePhase = "idle" | "countdown" | "playing" | "submitting" | "result";

export interface Duel {
  id: string;
  creator: string;
  stake: number;
  score: number;
  time: string;
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
  status: "pending" | "confirmed";
}

export interface ChartPoint {
  t: number;
  you: number;
  target?: number;
}

export interface GameResult {
  my: number;
  target: number | null;
  won: boolean | null;
  isChallenge: boolean;
}
