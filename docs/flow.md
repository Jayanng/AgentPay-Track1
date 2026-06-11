# Sepolia Research

> Research compiled: 2026-03-31

---

## 1. Sepolia Overview

### What is Sepolia?

Sepolia is an **Ethereum testnet** that mimics the Ethereum Mainnet environment. It was introduced to replace the Goerli testnet and allows developers to deploy Solidity smart contracts and test applications before mainnet deployment.

### Architecture

- **Standard EVM**: Sepolia uses the standard Ethereum Virtual Machine (geth) as its execution layer.
- **Consensus**: Sepolia uses Proof of Authority (PoA) consensus, making it a permissioned testnet with predictable block production.
- **JSON-RPC**: Sepolia supports standard Ethereum JSON-RPC endpoints via any Ethereum node provider.
- **Full EVM equivalence**: Sepolia is fully EVM equivalent — any contract that works on Ethereum Mainnet works identically on Sepolia.

### EVM Compatibility

Sepolia is fully EVM compatible. Anything that runs on Ethereum after the Pectra upgrade can run on Sepolia. Supported EIPs include EIP-1014, EIP-1559, EIP-4844, EIP-5656, EIP-6780, and more.

**Source**: [Ethereum Sepolia](https://ethereum.org/en/developers/docs/networks/#sepolia), [Sepolia Testnet Info](https://github.com/eth-clients/sepolia)

---

## 2. Chain Details

### Sepolia

| Property | Value |
|----------|-------|
| Network Name | Sepolia |
| Chain ID | **11155111** |
| RPC Endpoint | `https://ethereum-sepolia-rpc.publicnode.com` |
| WebSocket | `wss://ethereum-sepolia-rpc.publicnode.com` |
| Block Explorer | https://sepolia.etherscan.io |
| Currency Symbol | ETH |
| Native/Gas Token | ETH |

### Ethereum Mainnet (for reference)

| Property | Value |
|----------|-------|
| Network Name | Ethereum Mainnet |
| Chain ID | **1** |
| RPC Endpoint | `https://ethereum-rpc.publicnode.com` |
| WebSocket | `wss://ethereum-rpc.publicnode.com` |
| Block Explorer | https://etherscan.io |
| Currency Symbol | ETH |
| Native/Gas Token | ETH |

### Third-Party RPC Providers

- **Alchemy**: [Sepolia RPC](https://www.alchemy.com/rpc/sepolia)
- **Infura**: [Sepolia](https://www.infura.io/networks/ethereum/sepolia)
- **ChainList**: [Sepolia (11155111)](https://chainlist.org/chain/11155111), [Ethereum Mainnet (1)](https://chainlist.org/chain/1)

**Source**: [ChainList Sepolia](https://chainlist.org/chain/11155111), [ChainList Ethereum Mainnet](https://chainlist.org/chain/1)

---

## 3. Wallet & Provider Support

### Standard EVM Account Model

Sepolia uses the standard Ethereum account model (EOAs + smart contract accounts). Key features:

- **EOAs**: Standard externally owned accounts controlled by private keys
- **ERC-4337 Account Abstraction**: Smart contract wallets that enable gas sponsorship, batched transactions, and social recovery
- **EIP-7702**: Allows EOAs to temporarily act as smart contract wallets during a transaction

### Wallet Support

Yes, Sepolia is fully supported by all major wallet providers:

1. **MetaMask**: Add Sepolia as a custom network or use built-in testnet support
2. **Coinbase Wallet**: Compatible as an EVM wallet  
3. **WalletConnect**: Supported via standard wagmi connectors
4. **Safe.global**: Multi-sig wallet management

### Embedded Wallet SDK Support

| Provider | Sepolia Support | Notes |
|----------|-----------------|-------|
| **MetaMask Embedded Wallets** | Yes | Testnet support out of the box |
| **Dynamic** | Yes | Supports Sepolia as a network |
| **Web3Auth** | Yes | Supports Sepolia testnet |
| **Privy** | Yes (via EVM) | Compatible with major EVM networks; works via Wagmi |
| **Gelato Smart Wallet** | Yes | Gasless transactions via EIP-7702, maintains EOA addresses |
| **Magic** | Yes | Supports Sepolia for testnet onboarding |

**Source**: [Account Abstraction on Ethereum](https://ethereum.org/en/developers/docs/account-abstraction/), [MetaMask Sepolia Docs](https://docs.metamask.io/wallet/reference/json-rpc-methods/), [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)

---

## 4. Developer Tools

### Solidity Contract Deployment

You can deploy Solidity contracts directly to Sepolia with **no code changes**. Standard EVM development tools work out of the box.

### Hardhat

Fully supported. Setup:

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [process.env.DEPLOY_WALLET_1],
      chainId: 11155111,
    },
    ethereum: {
      url: "https://ethereum-rpc.publicnode.com",
      accounts: [process.env.DEPLOY_WALLET_1],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

Deploy: `npx hardhat ignition deploy ./ignition/modules/MyContract.ts --network sepolia`
Verify: `npx hardhat verify --network sepolia <contract-address> <constructor-args>`

**Note**: Use an EOA wallet with test ETH from a Sepolia faucet.

### Foundry

Fully supported. Standard `forge create` and `cast` commands work with Sepolia.

### Remix IDE

Supported as an alternative deployment tool.

### Viem / Wagmi / Ethers.js

All fully compatible:

- **viem**: Requires version `2.9.6` or greater (contains Sepolia network definitions)
- **wagmi**: Pre-configured chain definitions available via `@wagmi/core/chains` (`sepolia`, `mainnet`)
- **ethers.js**: Standard JSON-RPC compatibility

```typescript
import { http, createConfig } from '@wagmi/core';
import { sepolia } from '@wagmi/core/chains';
import { injected } from '@wagmi/connectors';

export const config = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
});
```

### Contract Verification

Etherscan supports contract verification via the Hardhat verify plugin or API.

### ERC-20, ERC-721, ERC-8004 Considerations

- **ERC-20 / ERC-721**: Deploy identically to Ethereum. OpenZeppelin contracts work without modification.
- **ERC-8004**: As a standard EIP, ERC-8004 registries are deployable on Sepolia.
- **WETH**: Use WETH (`0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` on Sepolia) as the ERC-20 wrapped equivalent.

**Source**: [Ethereum Sepolia Docs](https://ethereum.org/en/developers/docs/networks/#sepolia), [Viem Chains](https://viem.sh/docs/chains/), [Hardhat Sepolia Setup](https://hardhat.org/hardhat-runner/docs/guides/sepolia)

---

## 5. DeFi Ecosystem

### Overview

Sepolia is an Ethereum testnet and does not have its own DeFi ecosystem. All major DeFi protocols are deployed on Ethereum Mainnet. For development and testing on Sepolia:

- Use testnet USDC (MockUSDC) deployed by your project
- Use test ETH from a Sepolia faucet for gas
- Mainnet-equivalent addresses for testing are available via third-party faucets

---

## 6. Automation & Keepers

### Automation Services

Sepolia supports standard Ethereum automation patterns:

- **Gelato**: Automated smart contract execution via relayers
- **Chainlink Keepers**: Decentralized event-driven execution
- **OpenZeppelin Defender**: Admin, automation, and relayer services

### Account Abstraction

Sepolia supports ERC-4337 Account Abstraction:

- **Bundlers**: Handle user operations and submit them to the EntryPoint contract
- **Paymasters**: Sponsor gas fees for users
- **Smart Contract Wallets**: Enable programmable transaction logic

**Source**: [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337), [Gelato Automation](https://docs.gelato.network/), [Chainlink Automation](https://docs.chain.link/chainlink-automation)

---

## 7. Wallet SDKs for Web Apps

### Wagmi / Viem

Wagmi is the recommended React framework for connecting to Sepolia. Standard setup:

```typescript
import { http, createConfig } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [injected(), walletConnect({ projectId: '...' })],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});
```

### MetaMask Support

Full support. Sepolia is available as a built-in testnet network in MetaMask.

| Setting | Value |
|---------|-------|
| Network Name | Sepolia |
| RPC URL | `https://ethereum-sepolia-rpc.publicnode.com` |
| Chain ID | 11155111 |
| Symbol | ETH |
| Explorer | `https://sepolia.etherscan.io` |

### RainbowKit

Sepolia is supported out of the box with RainbowKit:

```typescript
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { sepolia, mainnet } from 'wagmi/chains';

const chains = [sepolia, mainnet];
```

### Other Wallet Integrations

- **WalletConnect**: Supported via standard wagmi connectors
- **Coinbase Wallet**: Compatible as an EVM wallet
- **Safe.Global**: Multi-sig wallet management

**Source**: [Wagmi Docs](https://wagmi.sh), [Viem Docs](https://viem.sh), [RainbowKit](https://rainbowkit.com)

---

## 8. Testnet Details

### Configuration

| Property | Value |
|----------|-------|
| Chain ID | 11155111 |
| RPC | `https://ethereum-sepolia-rpc.publicnode.com` |
| WSS | `wss://ethereum-sepolia-rpc.publicnode.com` |
| Explorer | https://sepolia.etherscan.io |
| Currency | ETH |

### Faucets

| Faucet | URL | Amount |
|--------|-----|--------|
| **Chainstack Faucet** | https://faucet.chainstack.com/sepolia-faucet | 0.5 ETH/day |
| **Alchemy Faucet** | https://sepoliafaucet.com | 0.5 ETH/day |
| **Infura Faucet** | https://www.infura.io/faucet/sepolia | 0.5 ETH/day |

### Testnet Considerations

- Use a standard EOA wallet (MetaMask) for Hardhat/Foundry deployments
- Ensure you have enough test ETH for gas
- Etherscan supports contract verification on Sepolia

---

## 9. Gas & Fees

### Fee Structure

Sepolia uses the standard Ethereum EIP-1559 fee model:

```
Transaction fee = gas units x (base fee + priority fee)
```

| Component | Value | Description |
|-----------|-------|-------------|
| Base Fee | Dynamic | Adjusted per block based on network demand |
| Priority Fee (tip) | User-specified | Incentive for validators to include transaction |
| Gas Limit | User-specified | Max computation units for the transaction |

### Practical Costs

| Operation | Approximate Fee |
|-----------|----------------|
| ETH transfer (21000 gas) | ~0.001-0.01 ETH |
| ERC-20 transfer (~50000 gas) | ~0.002-0.02 ETH |
| Average transaction | < $0.01 (in testnet terms - free) |

Gas costs on Sepolia are paid in test ETH which has no real monetary value.

### Gas Sponsorship / Gasless Transactions

Sepolia supports gasless transactions via:

1. **ERC-4337 Paymasters**: Smart contract wallets can use paymasters to sponsor gas fees.

2. **Gelato Relay**: EIP-2771 meta-transactions through Gelato's relay infrastructure.

3. **OpenZeppelin Defender Relayer**: Automate and sponsor transactions.

### Comparison

| Chain | Avg Transaction Fee | Block Time | TPS |
|-------|-------------------|------------|-----|
| Sepolia | Free (test ETH) | ~12s | ~15 |
| Ethereum L1 | $1-50+ | ~12s | ~15 |
| Solana | ~$0.00025 | ~0.4s | ~4,000 |

**Source**: [Ethereum Gas](https://ethereum.org/en/developers/docs/gas/), [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559), [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)

---

## 10. Considerations

### Block & Finality

| Property | Value |
|----------|-------|
| Block time | ~12 seconds |
| Finality | ~12-14 seconds (1 epoch) |
| Max throughput | ~15 TPS (L1) |

### Standard EVM Compatibility

Sepolia is a standard Ethereum testnet and shares the same behavior as Ethereum Mainnet:

- No opcode differences
- Standard EOA account model
- No special precompiles beyond Ethereum standard
- Full EVM equivalence

### What Works Without Changes

- Standard Solidity contracts (ERC-20, ERC-721, ERC-1155, etc.)
- OpenZeppelin contract libraries
- Hardhat, Foundry, Remix IDE
- ethers.js, viem, wagmi
- MetaMask, Coinbase Wallet, WalletConnect
- TheGraph, Dune Analytics
- Standard EVM events and logs

**Source**: [Ethereum for Developers](https://ethereum.org/en/developers/docs/), [Sepolia Testnet](https://ethereum.org/en/developers/docs/networks/#sepolia)

---

## Key Resources

- [Ethereum Sepolia Documentation](https://ethereum.org/en/developers/docs/networks/#sepolia)
- [Etherscan Explorer](https://sepolia.etherscan.io)
- [Ethereum Developer Portal](https://ethereum.org/en/developers/)

## Additional Resources

- [Ethereum Sepolia Docs](https://ethereum.org/en/developers/docs/networks/#sepolia)
- [Hardhat Sepolia Guide](https://hardhat.org/hardhat-runner/docs/guides/sepolia)
- [Etherscan Explorer (Sepolia)](https://sepolia.etherscan.io)
- [Etherscan Explorer (Ethereum Mainnet)](https://etherscan.io)

---

## 11. AgentPay Integration Status

### Chain Config Added

Sepolia has been added to all chain registries:

| Package | File | Status |
|---------|------|--------|
| x402-sdk-eth | `src/chains.ts` | Added `sepolia` (11155111) |
| backend | `src/config/chain-config.ts` | Added network + ETH token type |
| backend | `src/x402-sdk/eth-utils.ts` | Added ETH to token/network types |
| frontend | `lib/chains.ts` | Added to SUPPORTED_CHAINS + CHAIN_BY_NAME |
| frontend | `lib/chain-config.ts` | Added defaults, native tokens, explorer URLs, USDC addresses |
| frontend | `components/providers/ethereum-wallet-provider.tsx` | Added to wagmi config |
| mcp-client | `src/config.js` | Added chain + token addresses |
| contracts | `hardhat.config.ts` | Added sepolia network |

### Contract Deployment

Deployment script: `packages/contracts/scripts/deploy-sepolia.ts`

```bash
# Prerequisites
# 1. Get test ETH from a Sepolia faucet
# 2. Set DEPLOY_PRIVATE_KEY in packages/backend/.env

# Compile contracts
cd packages/contracts && npx hardhat compile

# Deploy all contracts to Sepolia
npx tsx scripts/deploy-sepolia.ts
```

Deploys: MockUSDC, IdentityRegistry, ReputationRegistry, ValidationRegistry

### Environment Setup

```bash
# Backend
X402_CHAIN=sepolia
X402_CURRENCY=USDC
X402_TOKEN_ADDRESS=<deployed_musdc_address>

# Frontend
NEXT_PUBLIC_X402_CHAIN=sepolia
NEXT_PUBLIC_X402_CURRENCY=USDC

# Contracts
DEPLOY_PRIVATE_KEY=0x...  # EOA key, NOT COA
```

### Key Addresses (Sepolia)

| Token | Address |
|-------|---------|
| MockUSDC | `<deployed-address>` |
| WETH | `0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9` |

### TODO

- [ ] Deploy contracts to Sepolia
- [ ] Update Sepolia USDC address in all configs after deployment
- [ ] Test x402 payment flow on Sepolia
- [ ] Test ERC-8004 identity registration on Sepolia
- [ ] Verify contract source code on Etherscan
