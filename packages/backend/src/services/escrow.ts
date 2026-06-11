/**
 * Escrow Service
 * Uses Cobo CAW contract-call API to interact with the deployed AgentPayEscrow contract.
 */

import { encodeFunctionData, keccak256, toBytes, parseEther } from 'viem';
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

const ESCROW_STATUS_NAMES = ['Pending', 'Delivered', 'Released', 'Refunded', 'Disputed'] as const;

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

/**
 * Convert a string resourceId to a proper bytes32 using keccak256.
 * This ensures consistent, correct encoding for the smart contract.
 */
function resourceIdToBytes32(resourceId: string): `0x${string}` {
  // If already a valid bytes32 hex string, use it directly
  if (resourceId.startsWith('0x') && resourceId.length === 66) {
    return resourceId as `0x${string}`;
  }
  // Otherwise hash the string to get a deterministic bytes32
  return keccak256(toBytes(resourceId));
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

    // Convert resourceId string to bytes32 using keccak256
    const resourceIdBytes32 = resourceIdToBytes32(resourceId);

    const calldata = encodeFunctionData({
      abi: ESCROW_ABI,
      functionName: 'createEscrow',
      args: [seller as `0x${string}`, resourceIdBytes32],
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

  /**
   * Get escrow details by calling the view function on the contract.
   * Note: This uses CAW contractCall which may not support read operations.
   * For read operations, consider using a direct RPC provider instead.
   */
  async getEscrow(escrowId: number): Promise<EscrowDetails | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const calldata = encodeFunctionData({
        abi: ESCROW_ABI,
        functionName: 'getEscrow',
        args: [BigInt(escrowId)],
      });

      const result = await cawService.contractCall(
        this.contractAddress as `0x${string}`,
        calldata,
        '0',
        'SETH'
      );

      // Parse the result if available
      if (result?.data) {
        const data = result.data;
        const statusIndex = Number(data.status ?? data[4] ?? 0);
        return {
          escrowId: String(escrowId),
          buyer: data.buyer ?? data[0] ?? '',
          seller: data.seller ?? data[1] ?? '',
          amount: data.amount?.toString() ?? data[2]?.toString() ?? '0',
          resourceId: data.resourceId ?? data[3] ?? '',
          status: ESCROW_STATUS_NAMES[statusIndex] || 'Pending',
          createdAt: Number(data.createdAt ?? data[5] ?? 0),
          deadline: Number(data.deadline ?? data[6] ?? 0),
        };
      }
      return null;
    } catch (error: any) {
      console.warn('[Escrow] getEscrow read call failed:', error.message);
      return null;
    }
  }
}

export const escrowService = new EscrowService();
