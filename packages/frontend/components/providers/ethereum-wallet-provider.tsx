"use client";

import { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { baseSepolia, base, mainnet, sepolia } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const isWalletConfigured = projectId && projectId !== "placeholder" && projectId !== "YOUR_PROJECT_ID";

// All supported chains - Base first since it's the default
const supportedChains = [
  baseSepolia,      // Base testnet
  base,             // Base mainnet
  mainnet,          // Ethereum mainnet
  sepolia,          // Ethereum testnet
] as const;

// Only create Wagmi config if WalletConnect is properly configured
const config = isWalletConfigured
  ? createConfig({
      chains: supportedChains,
      transports: {
        [baseSepolia.id]: http(),
        [base.id]: http(),
        [mainnet.id]: http(),
        [sepolia.id]: http(),
      },
    })
  : null;

interface EthereumWalletProviderProps {
  children: ReactNode;
}

export function EthereumWalletProvider({ children }: EthereumWalletProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If WalletConnect is not configured, render children without wallet providers
  if (!isWalletConfigured || !config) {
    if (!mounted) return null;
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#5B8FB9", // AgentPay blue from logo
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
          initialChain={sepolia}
        >
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
