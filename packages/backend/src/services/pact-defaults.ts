/**
 * Default Pact Policies for AgentPay
 * Submits buyer, seller, and settler policies on backend startup.
 */

import { cawService } from './cobo-caw';

const CAW_ETH_ADDRESS = process.env.CAW_ETH_ADDRESS || '0xa22c5d0840aae11a5483ca6dff12206905320496';

const BUYER_PACT_SPEC = {
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
        deny_if: { amount_gt: '0.005' },
        rolling_window: { window: '24h', max_tx_count: 20 },
      },
      priority: 0,
      is_active: true,
    },
  ],
  completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }], // 7 days
};

const SELLER_PACT_SPEC = {
  policies: [
    {
      name: 'seller-receive-only',
      type: 'transfer',
      rules: {
        effect: 'allow',
        when: {
          chain_in: ['SETH'],
          token_in: [{ chain_id: 'SETH', token_id: 'SETH' }],
          destination_address_in: [CAW_ETH_ADDRESS],
        },
      },
      priority: 0,
      is_active: true,
    },
  ],
  completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
};

const SETTLER_PACT_SPEC = {
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
        require_approval_if: { amount_gt: '0.01' },
        rolling_window: { window: '24h', max_tx_count: 10, max_usd: '50' },
      },
      priority: 0,
      is_active: true,
    },
  ],
  completion_conditions: [{ type: 'time_elapsed', threshold: '604800' }],
};

export async function initializeDefaultPacts() {
  try {
    const existingPacts = await cawService.listPacts();
    const activePacts = existingPacts.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'active' || p.status === 'PENDING_APPROVAL'
    );

    if (activePacts.length > 0) {
      console.log('[Pacts] Already have active/pending pacts, skipping submission');
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

    console.log('[Pacts] All default pacts submitted. Owner must approve in Cobo Agentic Wallet app.');
  } catch (error: any) {
    console.error('[Pacts] Failed to initialize default pacts:', error.message);
    // Don't throw — allow server to start even if pact submission fails
  }
}
