'use client';

import { useState, useEffect } from 'react';

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
}

interface CawStatus {
  wallet: { address: string; balance: string; uuid: string };
  pacts: Pact[];
  recentTxs: Transaction[];
}

export function CawStatusPanel() {
  const [status, setStatus] = useState<CawStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/caw/wallet');
      if (!res.ok) throw new Error('Failed to fetch CAW status');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <p className="text-sm text-muted-foreground animate-pulse">Loading CAW status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
        <p className="text-sm text-red-500">CAW unavailable: {error}</p>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === 'active' || lower === 'completed') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (lower === 'pending_approval') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (lower === 'blocked' || lower === 'failed') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Cobo Agentic Wallet</h2>
        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Sepolia Testnet
        </span>
      </div>

      {/* Wallet Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Address:</span>
          <code className="ml-2 text-xs font-mono text-foreground">
            {status.wallet.address}
          </code>
        </div>
        <div>
          <span className="text-muted-foreground">Balance:</span>
          <span className="ml-2 font-semibold text-foreground">
            {status.wallet.balance} SETH
          </span>
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
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-1">
            {status.recentTxs?.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                <span className="text-xs font-mono text-muted-foreground">{tx.id}</span>
                <div className="flex items-center gap-2">
                  {tx.amount && <span className="text-foreground">{tx.amount} SETH</span>}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
