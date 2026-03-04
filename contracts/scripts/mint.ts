import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const MOCK_USDM = "0x8A017435e8dD3aeCA65a1eA4411eD81b9302Ae9C";

async function main() {
  const recipient = process.env.MINT_TO;
  if (!recipient) {
    console.error("Set MINT_TO=0x... in .env or pass via env");
    process.exit(1);
  }

  const amount = ethers.parseUnits("1000", 18); // 1000 USDM

  const usdm = await ethers.getContractAt(
    ["function mint(address to, uint256 amount) external", "function balanceOf(address) view returns (uint256)"],
    MOCK_USDM
  );

  console.log(`Minting 1000 USDM to ${recipient}...`);
  const tx = await usdm.mint(recipient, amount);
  await tx.wait();
  console.log(`✅ Minted! TX: ${tx.hash}`);

  const balance = await usdm.balanceOf(recipient);
  console.log(`Balance: ${ethers.formatUnits(balance, 18)} USDM`);
}

main().catch(console.error);
