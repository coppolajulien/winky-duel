import { ethers, network } from "hardhat";

// USDm token addresses per network
const USDM_ADDRESSES: Record<string, string> = {
  // MegaETH Mainnet (chain 4326) — official USDm
  megaeth_mainnet: "0xfafddbb3fc7688494971a79cc65dca3ef82079e7",
  // MegaETH Testnet (chain 6343) — existing MockUSDM
  megaeth: "0x8A017435e8dD3aeCA65a1eA4411eD81b9302Ae9C",
};

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("─────────────────────────────────────────");
  console.log("Deploying WinkyDuel...");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH (for gas)");
  console.log("─────────────────────────────────────────");

  let usdmAddress = USDM_ADDRESSES[network.name];

  // On testnet: deploy a MockUSDM if no address set
  if (!usdmAddress && network.name === "megaeth") {
    console.log("\n📦 Deploying MockUSDM on testnet...");
    const mockFactory = await ethers.getContractFactory("MockUSDM");
    const mockUsdm = await mockFactory.deploy();
    await mockUsdm.waitForDeployment();
    usdmAddress = await mockUsdm.getAddress();
    console.log("✅ MockUSDM deployed to:", usdmAddress);

    // Mint some USDM to deployer for testing
    const mintTx = await mockUsdm.mint(deployer.address, ethers.parseEther("10000"));
    await mintTx.wait();
    console.log("🪙 Minted 10,000 USDM to deployer");
  }

  if (!usdmAddress) {
    console.error("❌ No USDM address configured for network:", network.name);
    process.exitCode = 1;
    return;
  }

  // Signer address for score attestation
  const signerAddress = process.env.GAME_SIGNER_ADDRESS;
  if (!signerAddress) {
    console.error("❌ GAME_SIGNER_ADDRESS env var not set");
    process.exitCode = 1;
    return;
  }

  console.log("\n📦 Deploying WinkyDuel with USDM:", usdmAddress);
  console.log("🔑 Trusted signer:", signerAddress);
  const factory = await ethers.getContractFactory("WinkyDuel");
  const duel = await factory.deploy(usdmAddress, signerAddress);
  await duel.waitForDeployment();

  const address = await duel.getAddress();
  console.log("\n✅ WinkyDuel deployed to:", address);
  console.log("💰 USDM token:", usdmAddress);
  console.log("🔑 Signer:", signerAddress);
  console.log(
    "🔍 Explorer:",
    `https://megaeth-testnet-v2.blockscout.com/address/${address}`
  );
  console.log("─────────────────────────────────────────");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
