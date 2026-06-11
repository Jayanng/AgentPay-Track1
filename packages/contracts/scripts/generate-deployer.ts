/**
 * Generate a fresh deployer wallet for the escrow contract.
 * Run: npx tsx scripts/generate-deployer.ts
 */
import crypto from 'crypto';
import { privateToAddress } from 'ethereumjs-util';

// Generate random 32-byte private key
const pkBytes = crypto.randomBytes(32);
const privateKey = '0x' + pkBytes.toString('hex');

// Derive Ethereum address
const addressBuffer = privateToAddress(pkBytes);
const address = '0x' + addressBuffer.toString('hex');

console.log('============================================================');
console.log('  AgentPay Deployer Wallet Generated');
console.log('============================================================');
console.log(`  Private Key: ${privateKey}`);
console.log(`  Address:     ${address}`);
console.log('============================================================');
console.log('');
console.log('Next steps:');
console.log('  1. Add to packages/contracts/.env:');
console.log(`     DEPLOY_PRIVATE_KEY=${privateKey}`);
console.log('');
console.log('  2. Fund this address with Sepolia ETH:');
console.log(`     curl.exe -X POST http://localhost:3001/api/caw/fund-deployer -H "Content-Type: application/json" -d '{"address":"${address}","amount":"0.003"}'`);
console.log('');
console.log('  3. Deploy the escrow contract:');
console.log('     cd packages/contracts && npx hardhat run scripts/deploy-escrow.ts --network sepolia');
console.log('');
