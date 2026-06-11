/**
 * Deploy AgentPayEscrow contract to Ethereum Sepolia
 *
 * Usage:
 *   cd packages/contracts
 *   DEPLOY_PRIVATE_KEY=0x... npx hardhat run scripts/deploy-escrow.ts --network sepolia
 *
 * After deployment, copy the contract address to packages/backend/.env:
 *   ESCROW_CONTRACT_ADDRESS=0x...
 */

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AgentPayEscrow with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌ Deployer has no ETH. Fund the account on Sepolia first.");
    process.exit(1);
  }

  const Escrow = await ethers.getContractFactory("AgentPayEscrow");
  console.log("Deploying AgentPayEscrow...");

  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  AgentPayEscrow deployed successfully!`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Contract Address: ${contractAddress}`);
  console.log(`  Network:          Sepolia (Chain ID: 11155111)`);
  console.log(`  Etherscan:        https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n📝 Add to packages/backend/.env:`);
  console.log(`  ESCROW_CONTRACT_ADDRESS=${contractAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
