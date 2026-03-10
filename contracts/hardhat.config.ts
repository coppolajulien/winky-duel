import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    megaeth: {
      url: process.env.MEGAETH_RPC || "https://carrot.megaeth.com/rpc",
      chainId: 6343,
      accounts: [DEPLOYER_KEY],
    },
    "megaeth-mainnet": {
      url: process.env.MEGAETH_MAINNET_RPC || "https://mainnet.megaeth.com/rpc",
      chainId: 4326,
      accounts: [DEPLOYER_KEY],
    },
  },
};

export default config;
