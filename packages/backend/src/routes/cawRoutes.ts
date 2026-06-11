/**
 * CAW (Cobo Agentic Wallet) Routes
 * Exposes wallet balance, pacts, transactions, and demo endpoints.
 *
 * KEY: Every transfer MUST run inside a pact. Pass pact_id with each transfer.
 */

import { Router } from 'express';
import { cawService } from '../services/cobo-caw.js';

const router: Router = Router();
const POLICY_DENIAL_CODES = new Set(['TRANSFER_LIMIT_EXCEEDED', 'POLICY_DENIED', 'INSUFFICIENT_PERMISSION', 'permission_check_failed']);
const NETWORK_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH', 'EAI_AGAIN', 'EACCES']);

function getStatusCode(error: any): number | undefined {
  return error?.status || error?.statusCode || error?.response?.status;
}

function getErrorCode(error: any): string | undefined {
  return (
    error?.code ||
    error?.cause?.code ||
    error?.response?.data?.error?.code ||
    error?.body?.error?.code ||
    error?.error?.code
  );
}

function isNetworkFailure(error: any): boolean {
  const code = getErrorCode(error);
  const message = String(error?.message || '').toLowerCase();
  return (
    (code ? NETWORK_CODES.has(code) : false) ||
    message.includes('network') ||
    message.includes('timed out') ||
    message.includes('unable to connect') ||
    message.includes('fetch failed') ||
    message.includes('getaddrinfo')
  );
}

/** Helper: find an active pact that allows transfers */
async function findActiveTransferPact(): Promise<string | undefined> {
  try {
    const pacts = await cawService.listPacts();
    const active = pacts.find((p: any) =>
      (p.status === 'ACTIVE' || p.status === 'active') && p.id
    );
    return active?.id;
  } catch {
    return undefined;
  }
}

// ==================== Wallet ====================

// GET /api/caw/wallet — Full wallet info
router.get('/wallet', async (_req, res) => {
  try {
    const [balance, pacts, recentTxs] = await Promise.all([
      cawService.getBalance(),
      cawService.listPacts(),
      cawService.listTransactions(10),
    ]);

    res.json({
      wallet: {
        address: process.env.CAW_ETH_ADDRESS || '',
        balance,
        uuid: process.env.CAW_WALLET_UUID || '',
      },
      escrowContract: process.env.ESCROW_CONTRACT_ADDRESS || '',
      pacts,
      recentTxs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch wallet info' });
  }
});

// GET /api/caw/health
router.get('/health', async (_req, res) => {
  try {
    const balance = await cawService.getBalance();
    res.json({
      status: 'connected',
      api_url: process.env.CAW_API_URL,
      wallet_uuid: process.env.CAW_WALLET_UUID,
      wallet_address: process.env.CAW_ETH_ADDRESS,
      balance,
    });
  } catch (error: any) {
    res.status(502).json({
      status: 'disconnected',
      api_url: process.env.CAW_API_URL,
      error: error?.message,
    });
  }
});

// GET /api/caw/balance
router.get('/balance', async (_req, res) => {
  try {
    const balance = await cawService.getBalance();
    res.json({ balance, currency: 'SETH' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch balance' });
  }
});

// GET /api/caw/pacts — List all pacts
router.get('/pacts', async (_req, res) => {
  try {
    const pacts = await cawService.listPacts();
    res.json({ pacts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch pacts' });
  }
});

// GET /api/caw/transactions
router.get('/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const txs = await cawService.listTransactions(limit);
    res.json({ transactions: txs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// GET /api/caw/debug — Full diagnostic
router.get('/debug', async (_req, res) => {
  try {
    const [balance, walletInfo, pacts, txs] = await Promise.all([
      cawService.getBalance().catch((e) => `Error: ${e.message}`),
      cawService.getWalletInfo().catch((e) => `Error: ${e.message}`),
      cawService.listPacts().catch((e) => `Error: ${e.message}`),
      cawService.listTransactions(5).catch((e) => `Error: ${e.message}`),
    ]);

    res.json({
      env: {
        CAW_API_URL: process.env.CAW_API_URL,
        CAW_WALLET_UUID: process.env.CAW_WALLET_UUID,
        CAW_ETH_ADDRESS: process.env.CAW_ETH_ADDRESS,
        CAW_AGENT_ID: process.env.CAW_AGENT_ID,
        CHAIN: process.env.CHAIN,
      },
      balance,
      walletInfo,
      pacts,
      recentTxs: txs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== Pact Setup ====================

// POST /api/caw/reinit-pacts — Submit pacts and return pact IDs for transfer use
router.post('/reinit-pacts', async (_req, res) => {
  const log: string[] = [];
  try {
    (globalThis as any).__agentpayPactsInitialized = false;
    log.push('Cleared globalThis guard');

    const CAW_ETH_ADDRESS = process.env.CAW_ETH_ADDRESS || '0xa22c5d0840aae11a5483ca6dff12206905320496';
    const results: any[] = [];

    // Submit ONE comprehensive Buyer Pact that allows SETH transfers up to 0.005 ETH
    // This is the main pact we'll use for all transfers (including fund-deployer)
    log.push('Submitting Buyer Transfer Pact...');
    try {
      const buyerPact = await cawService.submitPact(
        'Buyer Policy - max 0.005 ETH per transaction, 20 tx/day',
        {
          execution_plan: `# Buyer Spending Policy\n\nTransfer up to 0.005 ETH per transaction on SETH (Sepolia).\nMaximum 20 transactions per 24-hour rolling window.\nPact expires after 7 days.`,
          policies: [{
            name: 'buyer-spend-limit',
            type: 'transfer',
            rules: {
              effect: 'allow',
              when: {
                chain_in: ['SETH'],
                token_in: [{ chain_id: 'SETH', token_id: 'SETH' }],
              },
              deny_if: {
                amount_gt: '0.005',
                usage_limits: { rolling_24h: { tx_count_gt: 20 } },
              },
            },
          }],
          completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
        }
      );
      log.push(`Buyer Pact: id=${buyerPact.id}, status=${buyerPact.status}, api_key=${buyerPact.api_key || 'none'}`);
      log.push(`Buyer Pact RAW: ${JSON.stringify(buyerPact.raw || {}).slice(0, 500)}`);
      results.push({ name: 'Buyer', ...buyerPact });
    } catch (e: any) {
      log.push(`Buyer Pact error: ${e.message}`);
      results.push({ name: 'Buyer', error: e.message, cawResponse: e?.cawResponse });
    }

    // Seller Pact (receive-only)
    log.push('Submitting Seller Pact...');
    try {
      const sellerPact = await cawService.submitPact(
        'Seller Policy - receive payments only to agent wallet',
        {
          execution_plan: `# Seller Receive-Only Policy\n\nOnly allows receiving SETH transfers to the agent wallet address.\nPact expires after 7 days.`,
          policies: [{
            name: 'seller-receive-only',
            type: 'transfer',
            rules: {
              effect: 'allow',
              when: {
                chain_in: ['SETH'],
                token_in: [{ chain_id: 'SETH', token_id: 'SETH' }],
                destination_address_in: [{ chain_id: 'SETH', address: CAW_ETH_ADDRESS }],
              },
            },
          }],
          completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
        }
      );
      log.push(`Seller Pact: id=${sellerPact.id}, status=${sellerPact.status}`);
      results.push({ name: 'Seller', ...sellerPact });
    } catch (e: any) {
      log.push(`Seller Pact error: ${e.message}`);
      results.push({ name: 'Seller', error: e.message, cawResponse: e?.cawResponse });
    }

    // Settler Pact (escrow with approval >0.01 ETH)
    log.push('Submitting Settler Pact...');
    try {
      const settlerPact = await cawService.submitPact(
        'Settler Policy - escrow operations, requires approval above 0.01 ETH',
        {
          execution_plan: `# Settler Escrow Policy\n\nExecute escrow contract calls on SETH.\nTransfers above 0.01 ETH require owner approval.\nPact expires after 7 days.`,
          policies: [{
            name: 'settler-escrow-limits',
            type: 'transfer',
            rules: {
              effect: 'allow',
              when: {
                chain_in: ['SETH'],
                token_in: [{ chain_id: 'SETH', token_id: 'SETH' }],
              },
              review_if: { amount_gt: '0.01' },
              deny_if: {
                usage_limits: { rolling_24h: { tx_count_gt: 10 } },
              },
            },
          }],
          completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
        }
      );
      log.push(`Settler Pact: id=${settlerPact.id}, status=${settlerPact.status}`);
      results.push({ name: 'Settler', ...settlerPact });
    } catch (e: any) {
      log.push(`Settler Pact error: ${e.message}`);
      results.push({ name: 'Settler', error: e.message, cawResponse: e?.cawResponse });
    }

    // List pacts after submission
    log.push('Listing pacts after submission...');
    try {
      const afterPacts = await cawService.listPacts();
      log.push(`After: ${afterPacts.length} pacts`);
    } catch (e: any) {
      log.push(`listPacts after error: ${e.message}`);
    }

    // Find the buyer pact ID for transfer use
    const buyerPactResult = results.find(r => r.name === 'Buyer' && r.id && r.status === 'active');

    res.json({
      message: 'Pact re-initialization complete',
      log,
      results,
      buyerPactId: buyerPactResult?.id || null,
      note: buyerPactResult?.id
        ? `Use buyerPactId="${buyerPactResult.id}" in fund-deployer requests`
        : 'No active buyer pact found — check Cobo dashboard for approval',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message, log, caw_error: error?.cawResponse });
  }
});

// ==================== Transfers ====================

// POST /api/caw/fund-deployer — Send SETH from CAW wallet to deployer address
// CRITICAL: Must pass pact_id — every transfer runs inside a pact
router.post('/fund-deployer', async (req, res) => {
  try {
    const { address, amount, pact_id } = req.body;
    if (!address || !amount) {
      res.status(400).json({ error: 'address and amount are required' });
      return;
    }
    if (!address.startsWith('0x') || address.length !== 42) {
      res.status(400).json({ error: 'Invalid Ethereum address' });
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 0.005) {
      res.status(400).json({ error: 'Amount must be between 0 and 0.005 ETH (Pact policy limit)' });
      return;
    }

    // Find pact_id if not provided — every transfer MUST run inside a pact
    let resolvedPactId = pact_id;
    if (!resolvedPactId) {
      resolvedPactId = await findActiveTransferPact();
      console.log(`[fund-deployer] Auto-resolved pact_id: ${resolvedPactId || 'NONE FOUND'}`);
    }

    const result = await cawService.transferTokens(
      address,
      String(numAmount),
      'SETH',
      'SETH',
      `fund-deployer-${Date.now()}`,
      resolvedPactId
    );

    res.json({
      status: 'FUNDED',
      message: `Sent ${amount} SETH to deployer address`,
      destination: address,
      amount: `${amount} SETH`,
      pact_id: resolvedPactId,
      transaction_hash: result.transaction_hash,
      transaction_id: result.id,
      etherscan: result.transaction_hash
        ? `https://sepolia.etherscan.io/tx/${result.transaction_hash}`
        : undefined,
    });
  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorCode = getErrorCode(error);

    if (statusCode === 403 || (errorCode ? POLICY_DENIAL_CODES.has(errorCode) : false)) {
      const errorDetails = error?.cawResponse?.error || error?.details || {};
      res.json({
        status: 'BLOCKED',
        reason: errorDetails?.reason || error?.reason || 'Pact policy blocked this transfer',
        error_code: errorCode || error?.code,
        message: `Transfer blocked (code: ${errorCode || 'unknown'}). Ensure an active buyer pact exists and pact_id is passed.`,
        error: error?.message,
        suggestion: 'Run POST /api/caw/reinit-pacts first, then pass the buyerPactId in the request body as pact_id',
      });
      return;
    }

    const errData = error?.cawResponse || error?.response?.data || {};
    console.error('[fund-deployer] Error:', error.message, 'CAW response:', JSON.stringify(errData).slice(0, 500));

    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to fund deployer',
      error: error?.message,
      caw_error: errData?.error || errData,
      http_status: error?.status,
    });
  }
});

// ==================== Pact Management ====================

// POST /api/caw/pacts/submit — Submit a new pact
router.post('/submit', async (req, res) => {
  try {
    const { intent, spec } = req.body;
    if (!intent || !spec) {
      res.status(400).json({ error: 'intent and spec are required' });
      return;
    }
    const pact = await cawService.submitPact(intent, spec);
    res.json(pact);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit pact' });
  }
});

// POST /api/caw/pacts/:id/revoke
router.post('/:id/revoke', async (req, res) => {
  try {
    const result = await cawService.revokePact(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to revoke pact' });
  }
});

// GET /api/caw/pacts/:id — Get pact status
router.get('/:id', async (req, res) => {
  try {
    const pact = await cawService.getPact(req.params.id);
    res.json(pact);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch pact' });
  }
});

// ==================== Demo Endpoints ====================

// POST /api/caw/demo/blocked-transaction — Try to transfer 0.01 ETH (exceeds 0.005 limit)
router.post('/demo/blocked-transaction', async (_req, res) => {
  try {
    const pactId = await findActiveTransferPact();
    const result = await cawService.transferTokens(
      '0x0000000000000000000000000000000000000001',
      '0.01',
      'SETH',
      'SETH',
      `demo-blocked-${Date.now()}`,
      pactId
    );
    res.json({
      status: 'ALLOWED',
      message: 'Transaction was not blocked - policy may not be active',
      result,
    });
  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorCode = getErrorCode(error);

    if (statusCode === 403 || (errorCode ? POLICY_DENIAL_CODES.has(errorCode) : false)) {
      res.json({
        status: 'BLOCKED',
        reason: 'Transaction exceeds Buyer Policy spend limit',
        policy: 'Buyer Policy - max 0.005 ETH per transaction',
        attempted_amount: '0.01 ETH',
        limit: '0.005 ETH',
        error_code: errorCode,
      });
      return;
    }

    res.status(500).json({
      status: 'ERROR',
      message: 'Unexpected error during transaction',
      error: error?.message,
    });
  }
});

// POST /api/caw/demo/allowed-transaction — Try to transfer 0.001 ETH (within limits)
router.post('/demo/allowed-transaction', async (_req, res) => {
  try {
    const pactId = await findActiveTransferPact();
    const result = await cawService.transferTokens(
      '0x0000000000000000000000000000000000000001',
      '0.001',
      'SETH',
      'SETH',
      `demo-allowed-${Date.now()}`,
      pactId
    );
    res.json({
      status: 'APPROVED',
      message: 'Transaction passed Buyer Policy checks',
      transaction_hash: result.transaction_hash || result.id,
      amount: '0.001 ETH',
      pact_id: pactId,
      etherscan: result.transaction_hash
        ? `https://sepolia.etherscan.io/tx/${result.transaction_hash}`
        : undefined,
    });
  } catch (error: any) {
    const statusCode = getStatusCode(error);
    if (statusCode === 403) {
      res.json({
        status: 'BLOCKED',
        reason: 'Transaction was blocked by policy',
        error: error?.message,
      });
      return;
    }

    res.status(502).json({
      status: 'ERROR',
      message: 'Cannot reach CAW API',
      error: error?.message,
    });
  }
});

// POST /api/caw/demo/onchain-flow — Full on-chain escrow demo
router.post('/demo/onchain-flow', async (_req, res) => {
  const flowResult: any = {
    steps: [],
    wallet: {
      address: process.env.CAW_ETH_ADDRESS || '',
      etherscan: `https://sepolia.etherscan.io/address/${process.env.CAW_ETH_ADDRESS}`,
    },
    escrowContract: process.env.ESCROW_CONTRACT_ADDRESS || null,
  };

  try {
    // Step 1: Check wallet balance
    const balance = await cawService.getBalance();
    flowResult.steps.push({
      step: 1,
      name: 'Wallet Balance Check',
      status: 'SUCCESS',
      balance: `${balance} SETH`,
    });

    // Step 2: Micro-transfer with pact
    const pactId = await findActiveTransferPact();
    if (Number(balance) > 0.001 && pactId) {
      try {
        const transferResult = await cawService.transferTokens(
          '0x0000000000000000000000000000000000000001',
          '0.0001',
          'SETH',
          'SETH',
          `onchain-demo-${Date.now()}`,
          pactId
        );
        flowResult.steps.push({
          step: 2,
          name: 'Micro Transfer (Pact Policy Check)',
          status: 'APPROVED',
          amount: '0.0001 SETH',
          pact_id: pactId,
          transaction_hash: transferResult.transaction_hash,
          etherscan: transferResult.transaction_hash
            ? `https://sepolia.etherscan.io/tx/${transferResult.transaction_hash}`
            : undefined,
          message: 'Transaction passed Buyer Policy (max 0.005 ETH per tx)',
        });
      } catch (txError: any) {
        const errorCode = getErrorCode(txError);
        if (getStatusCode(txError) === 403 || (errorCode ? POLICY_DENIAL_CODES.has(errorCode) : false)) {
          flowResult.steps.push({
            step: 2,
            name: 'Micro Transfer (Pact Policy Check)',
            status: 'BLOCKED_BY_POLICY',
            pact_id: pactId,
            message: 'Pact policy blocked this transaction',
            error: txError?.message,
            error_code: errorCode,
          });
        } else {
          flowResult.steps.push({
            step: 2,
            name: 'Micro Transfer (Pact Policy Check)',
            status: 'ERROR',
            error: txError?.message,
          });
        }
      }
    } else {
      flowResult.steps.push({
        step: 2,
        name: 'Micro Transfer (Pact Policy Check)',
        status: Number(balance) <= 0.001 ? 'INSUFFICIENT_BALANCE' : 'NO_ACTIVE_PACT',
        message: pactId ? 'Insufficient balance for test transfer.' : 'No active pact found. Run POST /api/caw/reinit-pacts first.',
      });
    }

    // Step 3: Escrow contract status
    if (process.env.ESCROW_CONTRACT_ADDRESS) {
      flowResult.steps.push({
        step: 3,
        name: 'Escrow Contract',
        status: 'DEPLOYED',
        address: process.env.ESCROW_CONTRACT_ADDRESS,
        etherscan: `https://sepolia.etherscan.io/address/${process.env.ESCROW_CONTRACT_ADDRESS}`,
      });
    } else {
      flowResult.steps.push({
        step: 3,
        name: 'Escrow Contract',
        status: 'NOT_DEPLOYED',
        message: 'Deploy with: cd packages/contracts && DEPLOY_PRIVATE_KEY=0x... pnpm deploy:escrow',
      });
    }

    // Step 4: List active pacts
    const pacts = await cawService.listPacts();
    const activePacts = pacts.filter((p: any) => p.status === 'ACTIVE' || p.status === 'active');
    flowResult.steps.push({
      step: 4,
      name: 'Active Pact Policies',
      status: activePacts.length > 0 ? 'ACTIVE' : 'NO_PACTS',
      count: activePacts.length,
      pacts: activePacts.map((p: any) => ({ id: p.id, intent: p.intent, status: p.status })),
    });

    res.json(flowResult);
  } catch (error: any) {
    flowResult.error = error.message;
    res.status(500).json(flowResult);
  }
});

export default router;
