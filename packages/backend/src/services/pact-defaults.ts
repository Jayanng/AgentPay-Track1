/**
 * Default Pact Policies for AgentPay
 * Submits buyer, seller, and settler policies on backend startup.
 *
 * CAW Pact API requires:
 *   - spec.execution_plan (required, markdown string)
 *   - spec.policies[].rules.deny_if.usage_limits (for rolling window limits)
 *   - spec.completion_conditions (required)
 */

import { cawService } from './cobo-caw';

const CAW_ETH_ADDRESS = process.env.CAW_ETH_ADDRESS || '0xa22c5d0840aae11a5483ca6dff12206905320496';

const BUYER_PACT_SPEC = {
  execution_plan: `# Buyer Spending Policy

## Summary
Buyer spending policy for Sepolia ETH transfers on AgentPay marketplace.

## Operations
- Transfer up to 0.005 ETH per transaction on SETH (Sepolia)
- Maximum 20 transactions per 24-hour rolling window

## Risk Controls
- Per-tx cap: 0.005 ETH
- Rolling 24h limit: 20 transactions
- Pact expires after 7 days`,

  policies: [
    {
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
          usage_limits: {
            rolling_24h: { tx_count_gt: 20 },
          },
        },
      },
    },
  ],
  completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
};

const SELLER_PACT_SPEC = {
  execution_plan: `# Seller Receive-Only Policy

## Summary
Seller policy that only allows receiving payments to the agent wallet address.

## Operations
- Receive SETH transfers to the agent wallet
- No outbound transfers allowed under this pact

## Risk Controls
- Only inbound transfers to designated address
- Pact expires after 7 days`,

  policies: [
    {
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
    },
  ],
  completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
};

const SETTLER_PACT_SPEC = {
  execution_plan: `# Settler Escrow Policy

## Summary
Settler policy for escrow operations with approval escalation for large amounts.

## Operations
- Execute escrow contract calls on SETH
- Transfers above 0.01 ETH require owner approval

## Risk Controls
- Approval required for amounts above 0.01 ETH
- Rolling 24h: max 10 transactions
- Pact expires after 7 days`,

  policies: [
    {
      name: 'settler-escrow-limits',
      type: 'transfer',
      rules: {
        effect: 'allow',
        when: {
          chain_in: ['SETH'],
          token_in: [{ chain_id: 'SETH', token_id: 'SETH' }],
        },
        review_if: {
          amount_gt: '0.01',
        },
        deny_if: {
          usage_limits: {
            rolling_24h: { tx_count_gt: 10 },
          },
        },
      },
    },
  ],
  completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
};

export async function initializeDefaultPacts() {
  try {
    // Skip if CAW is not configured
    if (!process.env.CAW_API_KEY || !process.env.CAW_WALLET_UUID) {
      console.log('[Pacts] CAW not configured, skipping pact initialization');
      return;
    }

    // Skip if pacts were already submitted in this process (tsx watch guard)
    if ((globalThis as any).__agentpayPactsInitialized) {
      console.log('[Pacts] Already initialized in this process, skipping');
      return;
    }

    const existingPacts = await cawService.listPacts();
    const activePacts = existingPacts.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'active' || p.status === 'PENDING_APPROVAL'
    );

    if (activePacts.length > 0) {
      console.log(`[Pacts] Already have ${activePacts.length} active/pending pact(s), skipping submission`);
      (globalThis as any).__agentpayPactsInitialized = true;
      return;
    }

    console.log('[Pacts] Submitting default policies...');

    // Submit Buyer Policy
    const buyerPact = await cawService.submitPact(
      'Buyer Policy - max 0.005 ETH per transaction, 20 tx/day',
      BUYER_PACT_SPEC
    );
    console.log('[Pacts] Buyer Policy submitted:', buyerPact.id);

    // Submit Seller Policy
    const sellerPact = await cawService.submitPact(
      'Seller Policy - receive payments only to agent wallet',
      SELLER_PACT_SPEC
    );
    console.log('[Pacts] Seller Policy submitted:', sellerPact.id);

    // Submit Settler Policy
    const settlerPact = await cawService.submitPact(
      'Settler Policy - escrow operations, requires approval above 0.01 ETH',
      SETTLER_PACT_SPEC
    );
    console.log('[Pacts] Settler Policy submitted:', settlerPact.id);

    console.log('[Pacts] All default pacts submitted. Check CAW app for approval.');
    (globalThis as any).__agentpayPactsInitialized = true;
  } catch (error: any) {
    console.error('[Pacts] Failed to initialize default pacts:', error.message);
    // Don't throw — allow server to start even if pact submission fails
  }
}
