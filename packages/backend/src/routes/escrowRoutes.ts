/**
 * Escrow Routes
 * CRUD operations for the AgentPay escrow flow.
 */

import { Router } from 'express';
import { escrowService } from '../services/escrow.js';

const router: Router = Router();

// POST /api/escrow/create — Create new escrow with ETH deposit
router.post('/create', async (req, res) => {
  try {
    const { seller, resourceId, amount } = req.body;

    if (!seller || !resourceId || !amount) {
      res.status(400).json({
        error: 'seller, resourceId, and amount are required',
      });
      return;
    }

    if (!escrowService.isConfigured()) {
      res.status(503).json({
        error: 'Escrow contract not deployed. Set ESCROW_CONTRACT_ADDRESS in .env',
      });
      return;
    }

    const result = await escrowService.createEscrow(seller, resourceId, amount);
    res.json({ status: 'created', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create escrow' });
  }
});

// POST /api/escrow/:id/confirm — Buyer confirms delivery
router.post('/:id/confirm', async (req, res) => {
  try {
    const escrowId = parseInt(req.params.id, 10);
    if (isNaN(escrowId)) {
      res.status(400).json({ error: 'Invalid escrow ID' });
      return;
    }

    const result = await escrowService.confirmDelivery(escrowId);
    res.json({ status: 'delivery_confirmed', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to confirm delivery' });
  }
});

// POST /api/escrow/:id/release — Release payment to seller
router.post('/:id/release', async (req, res) => {
  try {
    const escrowId = parseInt(req.params.id, 10);
    if (isNaN(escrowId)) {
      res.status(400).json({ error: 'Invalid escrow ID' });
      return;
    }

    const result = await escrowService.releasePayment(escrowId);
    res.json({ status: 'payment_released', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to release payment' });
  }
});

// POST /api/escrow/:id/refund — Refund buyer
router.post('/:id/refund', async (req, res) => {
  try {
    const escrowId = parseInt(req.params.id, 10);
    if (isNaN(escrowId)) {
      res.status(400).json({ error: 'Invalid escrow ID' });
      return;
    }

    const result = await escrowService.refundBuyer(escrowId);
    res.json({ status: 'payment_refunded', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to refund buyer' });
  }
});

// POST /api/escrow/:id/dispute — Open dispute
router.post('/:id/dispute', async (req, res) => {
  try {
    const escrowId = parseInt(req.params.id, 10);
    if (isNaN(escrowId)) {
      res.status(400).json({ error: 'Invalid escrow ID' });
      return;
    }

    const result = await escrowService.openDispute(escrowId);
    res.json({ status: 'dispute_opened', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to open dispute' });
  }
});

// GET /api/escrow/:id — Get escrow status
router.get('/:id', async (req, res) => {
  try {
    const escrowId = parseInt(req.params.id, 10);
    if (isNaN(escrowId)) {
      res.status(400).json({ error: 'Invalid escrow ID' });
      return;
    }

    // For now, return a placeholder — full implementation would read from contract or DB
    res.json({
      escrowId,
      note: 'Escrow status tracking via MongoDB. Contract read requires additional setup.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch escrow status' });
  }
});

export default router;
