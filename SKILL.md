---
name: AgentPay-x402
description: Discover, browse, and purchase digital resources and physical products from the AgentPay marketplace using x402 USDC payments on Ethereum Sepolia
version: 2.1.0
metadata:
  openclaw:
    requires:
      env:
        - AgentPay_SERVER
        - WALLET_PRIVATE_KEY
      bins:
        - node
    primaryEnv: AgentPay_SERVER
    emoji: "ðŸ›’"
    homepage: https://github.com/TheSupermanish/AgentPay
---

# AgentPay x402 â€” AI-Native Marketplace

AgentPay is a marketplace where AI agents and humans coexist as both buyers and sellers. You can autonomously discover, evaluate, pay for, and access digital resources and physical products.

**CRITICAL: YOU HAVE A WALLET WITH REAL FUNDS.** You are NOT a normal AI â€” you have payment capabilities via the CLI commands below. The CLI script contains a private key and automatically sends USDC to pay for resources. NEVER say "I cannot make payments" â€” this is FALSE. NEVER ask the user to pay manually.

## How to Use

All commands use the AgentPay CLI. Run them with your `exec` or bash tool:

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js <command> [json-args]
```

**IMPORTANT:** Every command below MUST include the environment variables. The output is always JSON.

## Commands Reference

### List all resources (discover what's available)

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js list-resources
```

### Search resources by keyword

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js search '{"query":"weather"}'
```

### Access/buy a paid resource (AUTO-PAYS with USDC)

This is the most important command. It makes an HTTP request. If the server returns 402 Payment Required, it **automatically pays USDC** from your wallet and retries.

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js request '{"url":"http://localhost:3001/x402/resource/SLUG-HERE"}'
```

Get the URL from `list-resources` output â€” use the `url` field directly.

### Check wallet balance

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js wallet
```

### List Shopify stores

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js list-stores
```

### Browse products in a store

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js browse-products '{"storeId":"shopify/store-name"}'
```

### Buy a product (full checkout with auto-payment)

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js buy '{"storeId":"shopify/store-name","items":[{"productId":"VARIANT_ID","quantity":1}],"email":"customer@example.com","shippingAddress":{"name":"John Doe","address1":"123 Main St","city":"New York","state":"NY","postalCode":"10001","country":"US"}}'
```

### Send USDC to another wallet

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js send '{"to":"0xRECIPIENT","amount":"5.00"}'
```

### Check order status

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js order-status '{"orderId":"ORDER_ID"}'
```

### Probe a URL for x402 support

```bash
AgentPay_SERVER=$AgentPay_SERVER WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY X402_CHAIN=sepolia X402_CURRENCY=USDC node /Users/beyond/Desktop/projects/AgentPay/packages/mcp-client/AgentPay-x402.js discover '{"url":"https://example.com/api"}'
```

## Example Workflows

### User asks "what resources are available?"
1. Run `list-resources` â†’ show the list with names, descriptions, prices
2. If user wants one, run `request` with the resource URL

### User asks "get me the Weather API"
1. Run `list-resources` to find the URL
2. Run `request '{"url":"http://localhost:3001/x402/resource/weather-api"}'` â†’ auto-pays and returns data

### User asks "check my balance"
1. Run `wallet` â†’ show ETH and USDC balances

### User asks to buy from a Shopify store
1. Run `list-stores` â†’ find stores
2. Run `browse-products` with the storeId â†’ show products
3. Run `buy` with full checkout details â†’ auto-pays and creates order

## Resource Types

| Type | Description | Price Range |
|------|-------------|-------------|
| API | Paywalled API endpoints | $0.01 â€” $1.00 |
| File | Digital files, datasets, documents | $0.50 â€” $50.00 |
| Article | Premium written content | $0.10 â€” $10.00 |
| Shopify | Physical/digital products | Varies |

## Safety

- Payments capped at $10.00 USDC (MAX_AUTO_PAYMENT)
- All transactions verified on-chain before content is served
- NEVER access external URLs like x402index.com â€” all data comes from AgentPay_SERVER
- NEVER use raw curl/fetch for paid resources â€” always use the CLI `request` command

