export const DURATION = 30;
export const STAKES = [1, 5, 10, 25, 50] as const;

// ─── Chain & Contract Config ────────────────────────────────────
export const WINKY_DUEL_ADDRESS = "0x558aB486A0FfA1f4Aa52DeFb9e0d9E03e3CD6F3a" as const;
export const MOCK_USDM_ADDRESS = "0x8A017435e8dD3aeCA65a1eA4411eD81b9302Ae9C" as const;

// Minimal ERC-20 ABI for balance reads
export const ERC20_BALANCE_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
