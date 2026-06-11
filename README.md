# AgentPay

AI-Powered Escrow Marketplace with Cobo Agentic Wallet.

Built for the AI x Web3 Agentic Builders Hackathon (Track 1: Agentic Economy x Cobo Agentic Wallet).

## Features
- Cobo Agentic Wallet (CAW) with policy enforcement.
- Buyer/Seller/Settler pact policies.
- Trustless escrow on Ethereum Sepolia.
- AI agent support via MCP and A2A.
- x402 payment-gated resources.

## Quick Start
1. Install dependencies: `pnpm install`
2. Build SDK: `pnpm --filter @super-x402/sdk run build`
3. Start MongoDB on `localhost:27017`
4. Configure env files
5. Run: `.\dev.ps1`

## Demo Flow
1. Browse marketplace and pick a resource.
2. Preview and confirm payment.
3. CAW checks pact policies and approves or blocks.
4. Payment is locked in escrow.
5. Seller delivers.
6. Buyer confirms and escrow releases.

## Track 1 Alignment
- CAW integration (API + SDK)
- 3 pact policies (buyer/seller/settler)
- Blocked transaction policy demo
- Escrow smart contract
- GLM-5.1 via GMI Cloud AI agent

