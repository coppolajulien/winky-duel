export const DURATION = 30;
export const STAKES = [1, 5, 10, 25, 50, 100] as const;
export const APP_URL = "https://winky-duel.vercel.app";

// ─── Game Config ────────────────────────────────────────────────
export const BLINK_THRESHOLD = 0.24;  // blendshape score 0→1 (eyes closed > threshold = blink)
export const BLINK_COOLDOWN = 120;    // ms between registered blinks (detection)
export const MIN_BLINK_INTERVAL = 200; // ms anti-cheat: max 5 blinks/sec
export const MAX_SCORE = 150;          // anti-cheat: score cap per game
export const SUS_THRESHOLD = 120;      // blink count that triggers funny messages

// ─── Camera Config ──────────────────────────────────────────────
export const CAMERA_WIDTH = 320;
export const CAMERA_HEIGHT = 240;
export const CAMERA_TIMEOUT = 10_000; // ms to wait for video stream
export const CAMERA_WARMUP = 300;     // ms before blink detection starts

// ─── Data Fetching ──────────────────────────────────────────────
export const MAX_DUELS = 200;           // max duels to fetch for leaderboard
export const DUEL_HISTORY_WINDOW = 50;  // last N duels to show in history
export const DUEL_REFRESH_INTERVAL = 10_000; // ms between auto-refreshes

// Platform fee (matches on-chain RAKE_BPS). Change here when contract is redeployed.
export const RAKE_BPS = 250; // 2.5%

/** Net profit: opponent's stake minus rake on the full pool */
export function netWin(stake: number): string {
  const pool = stake * 2;
  const fee = (pool * RAKE_BPS) / 10000;
  const profit = stake - fee;
  return profit % 1 === 0 ? String(profit) : profit.toFixed(2);
}

// ─── Background Slides ──────────────────────────────────────────
export const DESKTOP_SLIDES = [
  "/desktop-bg.jpg",
  "/desktop-bg-1.jpg",
  "/desktop-bg-2.jpg",
  "/desktop-bg-3.jpg",
  "/desktop-bg-4.jpg",
  "/desktop-bg-5.jpg",
  "/desktop-bg-6.jpg",
  "/desktop-bg-7.jpg",
  "/desktop-bg-8.jpg",
  "/desktop-bg-9.jpg",
  "/desktop-bg-10.jpg",
  "/desktop-bg-11.jpg",
] as const;

export const MOBILE_SLIDES = [
  "/mobile-bg.png",
  "/mobile-bg-1.png",
  "/mobile-bg-2.png",
  "/mobile-bg-3.png",
  "/mobile-bg-4.png",
  "/mobile-bg-5.png",
  "/mobile-bg-6.png",
  "/mobile-bg-7.png",
  "/mobile-bg-8.png",
  "/mobile-bg-9.png",
  "/mobile-bg-10.png",
  "/mobile-bg-11.png",
] as const;

// ─── Chain & Contract Config ────────────────────────────────────
export const WINKY_DUEL_ADDRESS = "0xE51A1C6D006f2aD6d34dC31DB904b30546aB764e" as const;
export const MOCK_USDM_ADDRESS = "0x8A017435e8dD3aeCA65a1eA4411eD81b9302Ae9C" as const;
export const BLOCK_EXPLORER_URL = "https://megaeth-testnet-v2.blockscout.com" as const;
export const WALLET_PROFILE_URL = "https://mtrkr.xyz" as const;

// ─── ERC-20 ABI (balanceOf + approve + allowance) ───────────────
export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** @deprecated Use ERC20_ABI instead */
export const ERC20_BALANCE_ABI = ERC20_ABI;

// ─── WinkyDuel ABI (from compiled artifact) ─────────────────────
export const WINKY_DUEL_ABI = [
  // Errors
  { inputs: [], name: "CannotChallengeSelf", type: "error" },
  { inputs: [], name: "DuelNotFound", type: "error" },
  { inputs: [], name: "DuelNotOpen", type: "error" },
  { inputs: [], name: "DuelNotLocked", type: "error" },
  { inputs: [], name: "InsufficientStake", type: "error" },
  { inputs: [], name: "InvalidToken", type: "error" },
  { inputs: [], name: "NoRake", type: "error" },
  { inputs: [], name: "NotCreator", type: "error" },
  { inputs: [], name: "NotChallenger", type: "error" },
  { inputs: [], name: "NotOwner", type: "error" },
  { inputs: [], name: "StakeMismatch", type: "error" },
  { inputs: [], name: "TooEarly", type: "error" },
  { inputs: [], name: "TransferFailed", type: "error" },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "duelId", type: "uint256" },
      { indexed: true, name: "player", type: "address" },
    ],
    name: "BlinkRecorded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "duelId", type: "uint256" }],
    name: "DuelAbandoned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "duelId", type: "uint256" }],
    name: "DuelCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "duelId", type: "uint256" },
      { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "stake", type: "uint96" },
      { indexed: false, name: "score", type: "uint32" },
    ],
    name: "DuelCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "duelId", type: "uint256" },
      { indexed: true, name: "challenger", type: "address" },
    ],
    name: "DuelJoined",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "duelId", type: "uint256" },
      { indexed: true, name: "winner", type: "address" },
      { indexed: false, name: "payout", type: "uint256" },
    ],
    name: "DuelSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "RakeWithdrawn",
    type: "event",
  },
  // Read functions
  {
    inputs: [],
    name: "ABANDON_TIMEOUT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_STAKE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "RAKE_BPS",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "duelId", type: "uint256" }],
    name: "getDuel",
    outputs: [
      {
        components: [
          { name: "creator", type: "address" },
          { name: "challenger", type: "address" },
          { name: "stake", type: "uint96" },
          { name: "creatorScore", type: "uint32" },
          { name: "challengerScore", type: "uint32" },
          { name: "status", type: "uint8" },
          { name: "joinedAt", type: "uint40" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getOpenDuels",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextDuelId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "openDuelCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "rakeBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "score", type: "uint32" },
      { name: "amount", type: "uint256" },
    ],
    name: "createDuel",
    outputs: [{ name: "duelId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "duelId", type: "uint256" }],
    name: "joinDuel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "duelId", type: "uint256" },
      { name: "score", type: "uint32" },
    ],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "duelId", type: "uint256" }],
    name: "claimAbandoned",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "duelId", type: "uint256" }],
    name: "cancelDuel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "duelId", type: "uint256" }],
    name: "recordBlink",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawRake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
