"use client";

import { ReactNode, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "wagmi";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { sepolia } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
const isWalletConfigured = projectId && projectId !== "placeholder" && projectId !== "YOUR_PROJECT_ID";

// Minimal wagmi config — always present so useAccount/useConnect don't crash
const minimalConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

// Full RainbowKit config — only when WalletConnect project ID is valid
const fullConfig = isWalletConfigured
  ? getDefaultConfig({
      appName: "AgentPay",
      projectId,
      chains: [sepolia],
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

  if (!mounted) return null;

  // Full wallet connection with RainbowKit
  if (fullConfig) {
    return (
      <WagmiProvider config={fullConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#5B8FB9",
              accentColorForeground: "white",
              borderRadius: "medium",
            })}
            initialChain={sepolia}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  // Minimal config — WagmiProvider without RainbowKit (wallet connect won't work but app won't crash)
  return (
    <WagmiProvider config={minimalConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
