/**
 * Shared chain configuration — single source of truth.
 *
 * Controlled by NEXT_PUBLIC_CHAIN_ID env var:
 *   6343 (default) → MegaETH Testnet
 *   4326           → MegaETH Mainnet
 */
import { megaeth, megaethTestnet } from "viem/chains";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "6343");

export const appChain = chainId === megaeth.id ? megaeth : megaethTestnet;
