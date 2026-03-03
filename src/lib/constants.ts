export const DURATION = 30;
export const STAKES = [1, 5, 10, 25, 50] as const;

// ─── Chain & Contract Config ────────────────────────────────────
export const WINKY_DUEL_ADDRESS = "0x558aB486A0FfA1f4Aa52DeFb9e0d9E03e3CD6F3a" as const;
export const MOCK_USDM_ADDRESS = "0x8A017435e8dD3aeCA65a1eA4411eD81b9302Ae9C" as const;
export const BLOCK_EXPLORER_URL = "https://megaeth-testnet-v2.blockscout.com" as const;

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
  { inputs: [], name: "InsufficientStake", type: "error" },
  { inputs: [], name: "InvalidToken", type: "error" },
  { inputs: [], name: "NoRake", type: "error" },
  { inputs: [], name: "NotCreator", type: "error" },
  { inputs: [], name: "NotOwner", type: "error" },
  { inputs: [], name: "StakeMismatch", type: "error" },
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
    inputs: [
      { name: "duelId", type: "uint256" },
      { name: "score", type: "uint32" },
    ],
    name: "challengeDuel",
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
