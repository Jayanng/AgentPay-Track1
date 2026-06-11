'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ETHERSCAN_URL = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';
const CAW_ADDRESS = process.env.NEXT_PUBLIC_CAW_ETH_ADDRESS || '';

interface Pact {
  id: string;
  name?: string;
  intent?: string;
  status: string;
}

interface Transaction {
  id: string;
  status: string;
  amount?: string;
  created_at?: string;
  transaction_hash?: string;
}

interface CawStatus {
  wallet: { address: string; balance: string; uuid: string };
  pacts: Pact[];
  recentTxs: Transaction[];
  escrowContract?: string;
}

export function CawStatusPanel() {
  const [status, setStatus] = useState<CawStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/caw/wallet`);
      if (!res.ok) throw new Error('Failed to fetch CAW status');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <p className="text-sm text-muted-foreground animate-pulse">Loading CAW status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 flex items-center justify-between">
        <p className="text-sm text-red-500">CAW unavailable: {error}</p>
        <button
          onClick={() => { setLoading(true); fetchStatus(); }}
          className="text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === 'active' || lower === 'completed' || lower === 'released') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (lower === 'pending_approval' || lower === 'pending' || lower === 'delivered') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (lower === 'blocked' || lower === 'failed' || lower === 'disputed' || lower === 'refunded') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  const walletAddress = status.wallet.address || CAW_ADDRESS;

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Cobo Agentic Wallet</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Sepolia Testnet
          </span>
          <button
            onClick={() => { setLoading(true); fetchStatus(); }}
            className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Address:</span>
          <a
            href={`${ETHERSCAN_URL}/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-xs font-mono text-primary hover:underline"
          >
            {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'N/A'}
          </a>
        </div>
        <div>
          <span className="text-muted-foreground">Balance:</span>
          <span className="ml-2 font-semibold text-foreground">
            {status.wallet.balance} SETH
          </span>
        </div>
        {walletAddress && (
          <a
            href={`${ETHERSCAN_URL}/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View on Etherscan ↗
          </a>
        )}
      </div>

      {/* Escrow Contract Status */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Escrow Contract:</span>
          {status.escrowContract && status.escrowContract.startsWith('0x') ? (
            <a
              href={`${ETHERSCAN_URL}/address/${status.escrowContract}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-xs font-mono text-primary hover:underline"
            >
              {status.escrowContract.slice(0, 6)}...{status.escrowContract.slice(-4)}
            </a>
          ) : (
            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
              Not Deployed
            </span>
          )}
        </div>
      </div>

      {/* Active Pacts */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">Pact Policies</h3>
        {status.pacts?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pacts submitted yet.</p>
        ) : (
          <div className="space-y-1">
            {status.pacts?.map((pact) => (
              <div
                key={pact.id}
                className="flex items-center justify-between p-2 rounded-md border border-border/50"
              >
                <span className="text-sm font-medium text-foreground">
                  {pact.name || pact.intent || pact.id}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(pact.status)}`}>
                  {pact.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="font-semibold text-foreground mb-2">Recent Transactions</h3>
        {status.recentTxs?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet. Try the demo endpoints!</p>
        ) : (
          <div className="space-y-1">
            {status.recentTxs?.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  {tx.transaction_hash ? (
                    <a
                      href={`${ETHERSCAN_URL}/tx/${tx.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-primary hover:underline truncate max-w-[180px]"
                    >
                      {tx.transaction_hash.slice(0, 10)}...{tx.transaction_hash.slice(-8)}
                    </a>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[180px]">{tx.id}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tx.amount && <span className="text-foreground">{tx.amount} SETH</span>}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                  {tx.transaction_hash && (
                    <a
                      href={`${ETHERSCAN_URL}/tx/${tx.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* On-Chain Verification */}
      <div className="pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          All transactions verified on-chain via Cobo Agentic Wallet with Pact policy enforcement.
          {walletAddress && (
            <> Verify at{' '}
              <a
                href={`${ETHERSCAN_URL}/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Etherscan ↗
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
