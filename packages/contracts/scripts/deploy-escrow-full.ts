/**
 * Deploy AgentPayEscrow: All-in-one script
 *
 * This script:
 * 1. Generates a fresh deployer wallet
 * 2. Displays instructions to fund it via CAW
 * 3. Deploys the AgentPayEscrow contract to Sepolia
 *
 * Usage:
 *   cd packages/contracts
 *   npx tsx scripts/deploy-escrow-full.ts
 *
 * Or with an existing private key:
 *   DEPLOY_PRIVATE_KEY=0x... npx tsx scripts/deploy-escrow-full.ts
 */

import crypto from "crypto";
import { privateKeyToAccount } from "viem/accounts";

async function main() {
  let deployPrivateKey = process.env.DEPLOY_PRIVATE_KEY;

  if (!deployPrivateKey) {
    // Generate a fresh deployer wallet
    const pkBytes = crypto.randomBytes(32);
    deployPrivateKey = "0x" + pkBytes.toString("hex");
    const account = privateKeyToAccount(deployPrivateKey as `0x${string}`);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`  Fresh Deployer Wallet Generated`);
    console.log(`${"=".repeat(60)}`);
    console.log(`  Address:     ${account.address}`);
    console.log(`  Private Key: ${deployPrivateKey}`);
    console.log(`${"=".repeat(60)}`);
    console.log(`\n⚠️  This wallet has no ETH yet. Fund it first:\n`);
    console.log(`  Option A — Via CAW backend (recommended):`);
    console.log(
      `  curl.exe -X POST http://localhost:3001/api/caw/fund-deployer -H "Content-Type: application/json" -d '{"address":"${account.address}","amount":"0.003"}'`
    );
    console.log(`\n  Option B — Via Sepolia Faucet:`);
    console.log(`  Send 0.003+ Sepolia ETH to: ${account.address}`);
    console.log(`\n  Then re-run with:`);
    console.log(`  DEPLOY_PRIVATE_KEY=${deployPrivateKey} npx tsx scripts/deploy-escrow-full.ts`);
    console.log(`\n  Or add to packages/contracts/.env:`);
    console.log(`  DEPLOY_PRIVATE_KEY=${deployPrivateKey}\n`);
    process.exit(0);
  }

  // We have a private key — proceed with deployment
  const account = privateKeyToAccount(deployPrivateKey as `0x${string}`);
  console.log(`\nDeploying with account: ${account.address}`);

  // Check balance via RPC
  const { createPublicClient, http } = await import("viem");
  const { sepolia } = await import("viem/chains");
  const client = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const balance = await client.getBalance({ address: account.address });
  const balanceEth = Number(balance) / 1e18;
  console.log(`Account balance: ${balanceEth.toFixed(6)} ETH`);

  if (balance === 0n) {
    console.error(
      `\n❌ Deployer has no ETH. Fund ${account.address} on Sepolia first.`
    );
    console.error(
      `   curl.exe -X POST http://localhost:3001/api/caw/fund-deployer -H "Content-Type: application/json" -d '{"address":"${account.address}","amount":"0.003"}'`
    );
    process.exit(1);
  }

  // Deploy using Hardhat
  console.log("\nDeploying AgentPayEscrow...");
  const hre = await import("hardhat");
  const [deployer] = await hre.ethers.getSigners();
  const Escrow = await hre.ethers.getContractFactory("AgentPayEscrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  AgentPayEscrow deployed successfully!`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Contract Address: ${contractAddress}`);
  console.log(`  Network:          Sepolia (Chain ID: 11155111)`);
  console.log(
    `  Etherscan:        https://sepolia.etherscan.io/address/${contractAddress}`
  );
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
