/**
 * Transfer contract ownership to Privy wallet.
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx scripts/transfer-ownership.ts
 *
 * PRIVATE_KEY = the private key of the current owner (0x5577...A243)
 */

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { megaethTestnet } from "viem/chains";

const WINKY_DUEL_ADDRESS = "0x558aB486A0FfA1f4Aa52DeFb9e0d9E03e3CD6F3a" as const;
const NEW_OWNER = "0x2C150bd7D7be97723B3945d99ac70D7E2148227B" as const;

const ABI = [
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    console.error("Set PRIVATE_KEY env var (the current owner's private key)");
    process.exit(1);
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  console.log("Sender:", account.address);

  const publicClient = createPublicClient({
    chain: megaethTestnet,
    transport: http("https://carrot.megaeth.com/rpc"),
  });

  const currentOwner = await publicClient.readContract({
    address: WINKY_DUEL_ADDRESS,
    abi: ABI,
    functionName: "owner",
  });
  console.log("Current owner:", currentOwner);

  if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
    console.error("This private key does not match the current owner!");
    process.exit(1);
  }

  const walletClient = createWalletClient({
    account,
    chain: megaethTestnet,
    transport: http("https://carrot.megaeth.com/rpc"),
  });

  console.log(`Transferring ownership to ${NEW_OWNER}...`);
  const hash = await walletClient.writeContract({
    address: WINKY_DUEL_ADDRESS,
    abi: ABI,
    functionName: "transferOwnership",
    args: [NEW_OWNER],
  });

  console.log("TX hash:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Status:", receipt.status);

  const newOwner = await publicClient.readContract({
    address: WINKY_DUEL_ADDRESS,
    abi: ABI,
    functionName: "owner",
  });
  console.log("New owner:", newOwner);
  console.log("Done!");
}

main().catch(console.error);
