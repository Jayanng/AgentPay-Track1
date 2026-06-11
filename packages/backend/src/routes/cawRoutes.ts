/**
 * CAW (Cobo Agentic Wallet) Routes
 * Exposes wallet balance, pacts, transactions, and demo endpoints.
 */

import { Router } from 'express';
import { cawService } from '../services/cobo-caw.js';

const router: Router = Router();
const POLICY_DENIAL_CODES = new Set(['TRANSFER_LIMIT_EXCEEDED', 'POLICY_DENIED']);
const NETWORK_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  'EACCES',
]);

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

// ==================== Wallet ====================

// GET /api/caw/wallet — Full wallet info (address, balance, pacts, recent txs)
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

// GET /api/caw/health — CAW API connectivity check
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
    const code = getErrorCode(error);
    res.status(502).json({
      status: 'disconnected',
      api_url: process.env.CAW_API_URL,
      error: error?.message,
      code,
    });
  }
});

// GET /api/caw/balance — Just the balance
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

// GET /api/caw/transactions — Recent transactions
router.get('/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const txs = await cawService.listTransactions(limit);
    res.json({ transactions: txs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// GET /api/caw/debug — Full diagnostic info (pacts with raw data, balance, wallet info)
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

// POST /api/caw/reinit-pacts — Force re-submit all default pacts (verbose)
router.post('/reinit-pacts', async (_req, res) => {
  const log: string[] = [];
  try {
    // Clear the guard
    (globalThis as any).__agentpayPactsInitialized = false;
    log.push('Cleared globalThis guard');

    // Step 1: List existing pacts with RAW response
    log.push('Step 1: Listing existing pacts...');
    let existingPacts: any[] = [];
    try {
      const response = await (await import('../services/cobo-caw.js')).cawService.listPacts();
      existingPacts = response;
      log.push(`Found ${existingPacts.length} existing pacts: ${JSON.stringify(existingPacts)}`);
    } catch (e: any) {
      log.push(`listPacts error: ${e.message}`);
    }

    // Step 2: Submit pacts directly (bypass the initializer)
    const { cawService } = await import('../services/cobo-caw.js');
    const CAW_ETH_ADDRESS = process.env.CAW_ETH_ADDRESS || '0xa22c5d0840aae11a5483ca6dff12206905320496';
    
    const results: any[] = [];

    // Buyer Pact
    log.push('Step 2a: Submitting Buyer Pact...');
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
      log.push(`Buyer Pact result: ${JSON.stringify(buyerPact)}`);
      results.push({ name: 'Buyer', ...buyerPact });
    } catch (e: any) {
      log.push(`Buyer Pact error: ${e.message}, cawResponse: ${JSON.stringify(e?.cawResponse)?.slice(0, 500)}`);
      results.push({ name: 'Buyer', error: e.message, cawResponse: e?.cawResponse });
    }

    // Seller Pact
    log.push('Step 2b: Submitting Seller Pact...');
    try {
      const sellerPact = await cawService.submitPact(
        'Seller Policy - receive payments only to agent wallet',
        {
          execution_plan: `# Seller Receive-Only Policy\n\nOnly allows receiving SETH transfers to the agent wallet address.\nNo outbound transfers allowed under this pact.\nPact expires after 7 days.`,
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
      log.push(`Seller Pact result: ${JSON.stringify(sellerPact)}`);
      results.push({ name: 'Seller', ...sellerPact });
    } catch (e: any) {
      log.push(`Seller Pact error: ${e.message}, cawResponse: ${JSON.stringify(e?.cawResponse)?.slice(0, 500)}`);
      results.push({ name: 'Seller', error: e.message, cawResponse: e?.cawResponse });
    }

    // Settler Pact
    log.push('Step 2c: Submitting Settler Pact...');
    try {
      const settlerPact = await cawService.submitPact(
        'Settler Policy - escrow operations, requires approval above 0.01 ETH',
        {
          execution_plan: `# Settler Escrow Policy\n\nExecute escrow contract calls on SETH.\nTransfers above 0.01 ETH require owner approval.\nRolling 24h: max 10 transactions.\nPact expires after 7 days.`,
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
      log.push(`Settler Pact result: ${JSON.stringify(settlerPact)}`);
      results.push({ name: 'Settler', ...settlerPact });
    } catch (e: any) {
      log.push(`Settler Pact error: ${e.message}, cawResponse: ${JSON.stringify(e?.cawResponse)?.slice(0, 500)}`);
      results.push({ name: 'Settler', error: e.message, cawResponse: e?.cawResponse });
    }

    // Step 3: List pacts again
    log.push('Step 3: Listing pacts after submission...');
    try {
      const afterPacts = await cawService.listPacts();
      log.push(`After: ${afterPacts.length} pacts: ${JSON.stringify(afterPacts)}`);
    } catch (e: any) {
      log.push(`listPacts after error: ${e.message}`);
    }

    res.json({
      message: 'Pact re-initialization complete',
      log,
      results,
      note: 'Check the log for submission details. If pacts show PENDING_APPROVAL, approve them in the Cobo dashboard.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message, log, caw_error: error?.cawResponse });
  }
});

// POST /api/caw/fund-deployer — Send SETH from CAW wallet to deployer address
// Used to fund the escrow contract deployer wallet
router.post('/fund-deployer', async (req, res) => {
  try {
    const { address, amount } = req.body;
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

    const result = await cawService.transferTokens(
      address,
      String(numAmount),
      'SETH',
      'SETH',
      `fund-deployer-${Date.now()}`
    );

    res.json({
      status: 'FUNDED',
      message: `Sent ${amount} SETH to deployer address`,
      destination: address,
      amount: `${amount} SETH`,
      transaction_hash: result.transaction_hash,
      etherscan: result.transaction_hash
        ? `https://sepolia.etherscan.io/tx/${result.transaction_hash}`
        : undefined,
    });
  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorCode = getErrorCode(error);

    if (statusCode === 403 || (errorCode ? POLICY_DENIAL_CODES.has(errorCode) : false)) {
      const errorDetails = error?.response?.data?.error || error?.body?.error || error?.details || {};
      res.json({
        status: 'BLOCKED',
        reason: errorDetails?.reason || 'Pact policy blocked this transfer',
        message: 'Transfer exceeds Buyer Policy spend limit (max 0.005 ETH per tx)',
        error: error?.message,
      });
      return;
    }

    // Log the full error for debugging
    const errData = error?.cawResponse || error?.response?.data || error?.response?.body || error?.details || {};
    console.error('[fund-deployer] Error:', error.message, 'Status:', error?.status, 'CAW response:', JSON.stringify(errData).slice(0, 500));

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

// POST /api/pacts/submit — Submit a new pact
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

// GET /api/pacts/:id — Get pact status
router.get('/:id', async (req, res) => {
  try {
    const pact = await cawService.getPact(req.params.id);
    res.json(pact);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch pact' });
  }
});

// GET /api/pacts — List all pacts (alias)
router.get('/', async (_req, res) => {
  try {
    const pacts = await cawService.listPacts();
    res.json({ pacts });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch pacts' });
  }
});

// POST /api/pacts/:id/revoke — Revoke a pact
router.post('/:id/revoke', async (req, res) => {
  try {
    const result = await cawService.revokePact(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to revoke pact' });
  }
});

// ==================== Demo Endpoints ====================

// POST /api/demo/blocked-transaction — Try to transfer 0.01 ETH (exceeds 0.005 limit)
router.post('/blocked-transaction', async (_req, res) => {
  try {
    const result = await cawService.transferTokens(
      '0x0000000000000000000000000000000000000001',
      '0.01',
      'SETH',
      'SETH',
      `demo-blocked-${Date.now()}`
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
      const errorDetails = error?.response?.data?.error || error?.body?.error || error?.details || {};
      res.json({
        status: 'BLOCKED',
        reason: errorDetails?.reason || 'Transaction exceeds Buyer Policy spend limit',
        policy: 'Buyer Policy - max 0.005 ETH per transaction',
        attempted_amount: '0.01 ETH',
        limit: '0.005 ETH',
        error_code: errorCode,
        error_details: errorDetails,
      });
      return;
    }

    if (statusCode === 401 || errorCode === 'UNAUTHORIZED') {
      res.status(502).json({
        status: 'ERROR',
        message: 'CAW API authentication failed - check CAW_API_KEY',
        error: error?.message,
      });
      return;
    }

    if (isNetworkFailure(error)) {
      res.status(502).json({
        status: 'ERROR',
        message: 'Cannot reach Cobo Agentic Wallet API - check network connectivity',
        error: error?.message,
      });
      return;
    }

    res.status(500).json({
      status: 'ERROR',
      message: 'Unexpected error during transaction',
      error: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
});

// POST /api/demo/allowed-transaction — Try to transfer 0.001 ETH (within limits)
router.post('/allowed-transaction', async (_req, res) => {
  try {
    const result = await cawService.transferTokens(
      '0x0000000000000000000000000000000000000001',
      '0.001',
      'SETH',
      'SETH',
      `demo-allowed-${Date.now()}`
    );
    res.json({
      status: 'APPROVED',
      message: 'Transaction passed Buyer Policy checks',
      transaction_hash: result.transaction_hash || (result as any).id,
      amount: '0.001 ETH',
      etherscan: result.transaction_hash
        ? `https://sepolia.etherscan.io/tx/${result.transaction_hash}`
        : undefined,
    });
  } catch (error: any) {
    const statusCode = getStatusCode(error);
    const errorCode = getErrorCode(error);
    if (statusCode === 403) {
      res.json({
        status: 'BLOCKED',
        reason: 'Transaction was blocked by policy',
        error: error?.message,
      });
      return;
    }

    if (statusCode === 401 || errorCode === 'UNAUTHORIZED') {
      res.status(502).json({
        status: 'ERROR',
        message: 'CAW API authentication failed - check CAW_API_KEY',
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

// POST /api/demo/onchain-flow — Full on-chain escrow demo
// 1. Tests Pact policy with a small transfer
// 2. Returns TX hash + Etherscan verification links
router.post('/onchain-flow', async (_req, res) => {
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

    // Step 2: Attempt a micro-transfer (0.0001 ETH) to prove on-chain capability
    if (Number(balance) > 0.001) {
      try {
        const transferResult = await cawService.transferTokens(
          '0x0000000000000000000000000000000000000001',
          '0.0001',
          'SETH',
          'SETH',
          `onchain-demo-${Date.now()}`
        );
        flowResult.steps.push({
          step: 2,
          name: 'Micro Transfer (Pact Policy Check)',
          status: 'APPROVED',
          amount: '0.0001 SETH',
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
            message: 'Pact policy blocked this transaction',
            error: txError?.message,
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
        status: 'SKIPPED',
        message: 'Insufficient balance for test transfer. Fund wallet with SETH first.',
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
