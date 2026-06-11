/**
 * Escrow Service
 * Uses Cobo CAW contract-call API to interact with the deployed AgentPayEscrow contract.
 */

import { encodeFunctionData, parseEther } from 'viem';
import { cawService } from './cobo-caw';

const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '';

// Minimal ABI for AgentPayEscrow contract
const ESCROW_ABI = [
  {
    name: 'createEscrow',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'seller', type: 'address' },
      { name: 'resourceId', type: 'bytes32' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'confirmDelivery',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'releasePayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'refundBuyer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'openDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getEscrow',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [
      { name: 'buyer', type: 'address' },
      { name: 'seller', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'resourceId', type: 'bytes32' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  },
  {
    name: 'escrowCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export interface EscrowDetails {
  escrowId: string;
  buyer: string;
  seller: string;
  amount: string;
  resourceId: string;
  status: 'Pending' | 'Delivered' | 'Released' | 'Refunded' | 'Disputed';
  createdAt: number;
  deadline: number;
}

export class EscrowService {
  private contractAddress: string;

  constructor() {
    this.contractAddress = ESCROW_CONTRACT_ADDRESS;
  }

  isConfigured(): boolean {
    return !!this.contractAddress && this.contractAddress.startsWith('0x');
  }

  async createEscrow(seller: string, resourceId: string, amount: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
    }

    // Convert resourceId string to bytes32
    const resourceIdHex = `0x${resourceId.padEnd(64, '0')}` as `0x${string}`;

    const calldata = encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: 'createEscrow',
      args: [seller as `0x${string}`, resourceIdHex as `0x${string}`],
    });

    // Convert amount to wei value for the contract call
    const valueWei = parseEther(amount).toString();

    return await cawService.contractCall(
      this.contractAddress as `0x${string}`,
      calldata,
      valueWei,
      'SETH'
    );
  }

  async confirmDelivery(escrowId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
    }

    const calldata = encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: 'confirmDelivery',
      args: [BigInt(escrowId)],
    });

    return await cawService.contractCall(
      this.contractAddress as `0x${string}`,
      calldata,
      '0',
      'SETH'
    );
  }

  async releasePayment(escrowId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
    }

    const calldata = encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: 'releasePayment',
      args: [BigInt(escrowId)],
    });

    return await cawService.contractCall(
      this.contractAddress as `0x${string}`,
      calldata,
      '0',
      'SETH'
    );
  }

  async refundBuyer(escrowId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
    }

    const calldata = encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: 'refundBuyer',
      args: [BigInt(escrowId)],
    });

    return await cawService.contractCall(
      this.contractAddress as `0x${string}`,
      calldata,
      '0',
      'SETH'
    );
  }

  async openDispute(escrowId: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('ESCROW_CONTRACT_ADDRESS not configured');
    }

    const calldata = encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: 'openDispute',
      args: [BigInt(escrowId)],
    });

    return await cawService.contractCall(
      this.contractAddress as `0x${string}`,
      calldata,
      '0',
      'SETH'
    );
  }

  // For now, escrow status tracking is done via MongoDB since
  // reading from contract requires a read-call setup.
  // The CAW contract-call returns a transaction result that can be tracked.
}

export const escrowService = new EscrowService();
