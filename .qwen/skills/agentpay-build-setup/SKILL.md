---
name: agentpay-build-setup
description: Setup procedure for adapting AgentPay into AgentPay with Cobo Agentic Wallet (CAW) integration for the AI × Web3 Agentic Builders Hackathon
source: auto-skill
extracted_at: '2026-06-11T03:47:01.166Z'
---

## AgentPay Build Setup

### Overview
Adapt AgentPay (x402 marketplace) into AgentPay for Hackathon Track 1: Agentic Economy × Cobo Agentic Wallet. Switches chain from Base Sepolia to Ethereum Sepolia (SETH), integrates CAW SDK, adds escrow contract, and adds GLM-5.1 via GMI Cloud.

### Prerequisites
- `@cobo/agentic-wallet` SDK installed: `pnpm --filter backend add @cobo/agentic-wallet`
- CAW credentials in `packages/backend/.env`:
  - `CAW_API_KEY`, `CAW_API_URL`, `CAW_WALLET_UUID`, `CAW_AGENT_ID`, `CAW_ETH_ADDRESS`
- Chain set to `SETH` in backend `.env`, `sepolia` in frontend `.env.local`

### Key Services Created
- `packages/backend/src/services/cobo-caw.ts` — CAW wallet, transfers, pacts
- `packages/backend/src/services/pact-defaults.ts` — Auto-submits buyer/seller/settler policies on startup
- `packages/backend/src/services/escrow.ts` — Escrow via CAW contract-call API
- `packages/contracts/contracts/Escrow.sol` — Solidity escrow contract (deploy to Sepolia)

### Routes Registered in index.ts
- `/api/caw/*` — Wallet info, balance, pacts, transactions
- `/api/pacts/*` — Pact CRUD (submit, get, list, revoke)
- `/api/demo/*` — Blocked/allowed transaction demos
- `/api/escrow/*` — Escrow CRUD (create, confirm, release, refund, dispute)

### Demo Endpoints
- `POST /api/demo/blocked-transaction` — Tries 0.01 ETH transfer (exceeds 0.005 limit, returns 403)
- `POST /api/demo/allowed-transaction` — Tries 0.001 ETH transfer (within limits, succeeds)

### Pact Policy Defaults
Three pacts submitted on startup:
1. **Buyer Policy** — Max 0.005 ETH/tx, 20 tx/day, denies above limit
2. **Seller Policy** — Receive payments only to agent wallet
3. **Settler Policy** — Escrow operations, requires approval above 0.01 ETH

Pacts go to `PENDING_APPROVAL` status — owner must approve in Cobo Agentic Wallet app or via CLI (`caw pending approve <ID>`).

### Chain Configuration
- Backend default: `sepolia` (via `X402_CHAIN` env or fallback in `chain-config.ts`)
- Frontend default: `sepolia` (via `NEXT_PUBLIC_X402_CHAIN`)
- AI agent default: Sepolia (chainId 11155111, RPC: `https://ethereum-sepolia-rpc.publicnode.com`)
- Hardhat: Sepolia network added for contract deployment

### CAW SDK Usage
```typescript
import { Configuration, PactsApi, TransactionsApi, WalletsApi } from '@cobo/agentic-wallet';

const config = new Configuration({ apiKey: CAW_API_KEY, basePath: CAW_API_URL });
const pactsApi = new PactsApi(config);
const txApi = new TransactionsApi(config);
const walletsApi = new WalletsApi(config);
```

### Fallback
If `@cobo/agentic-wallet` SDK has issues, fall back to raw HTTP calls using fetch/axios with `X-API-Key` header.

### GLM-5.1 via GMI Cloud
Added to AI agent as `gmi` provider — uses OpenAI-compatible SDK with custom baseURL:
```typescript
const gmi = createOpenAI({ baseURL: 'https://api.gmicloud.ai/v1', apiKey: process.env.GMI_API_KEY });
const model = gmi('glm-5.1');
```
