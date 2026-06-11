/**
 * Cobo Agentic Wallet (CAW) Service
 * Wraps the @cobo/agentic-wallet SDK for wallet operations, transactions, and pacts.
 */

import { Configuration, PactsApi, TransactionsApi, WalletsApi } from '@cobo/agentic-wallet';
import { BalanceApi, TransactionRecordsApi } from '@cobo/agentic-wallet';

const CAW_API_KEY = process.env.CAW_API_KEY!;
const CAW_API_URL = process.env.CAW_API_URL || 'https://api.agenticwallet.cobo.com';
const CAW_WALLET_UUID = process.env.CAW_WALLET_UUID!;

if (!CAW_API_KEY) {
  console.warn('[CAW] CAW_API_KEY not set — CAW service will be unavailable');
}
if (!CAW_WALLET_UUID) {
  console.warn('[CAW] CAW_WALLET_UUID not set — CAW service will be unavailable');
}

const config = new Configuration({
  apiKey: CAW_API_KEY,
  basePath: CAW_API_URL,
});

const pactsApi: any = new PactsApi(config);
const txApi: any = new TransactionsApi(config);
const walletsApi: any = new WalletsApi(config);
const balanceApi: any = new BalanceApi(config);
const txRecordsApi: any = new TransactionRecordsApi(config);

export interface TransferResult {
  status: string;
  transaction_hash?: string;
  pending_operation_id?: string;
}

export interface PactInfo {
  id: string;
  status: string;
  intent?: string;
  api_key?: string;
  name?: string;
}

export interface CawError {
  success: false;
  error: {
    code: string;
    reason: string;
    details: Record<string, any>;
  };
  suggestion: string;
}

export class CawPolicyError extends Error {
  code: string;
  reason: string;
  details: Record<string, any>;
  suggestion: string;
  status: number;

  constructor(cawError: CawError) {
    super(cawError.error.reason || cawError.error.code);
    this.code = cawError.error.code;
    this.reason = cawError.error.reason;
    this.details = cawError.error.details;
    this.suggestion = cawError.suggestion;
    this.status = 403;
    this.name = 'CawPolicyError';
  }
}

export function parseCawError(error: any): never {
  if (error instanceof CawPolicyError) throw error;

  const response = error?.response || error;
  const data = response?.data || response?.body || {};
  const transportCode = error?.code || error?.cause?.code;

  if (response?.status === 403 && data?.error?.code) {
    throw new CawPolicyError(data as CawError);
  }

  if (data?.error?.code) {
    const parsed = new Error(data?.error?.reason || data?.error?.code || error?.message || 'CAW API error');
    (parsed as any).status = response?.status;
    (parsed as any).code = data?.error?.code;
    (parsed as any).reason = data?.error?.reason;
    (parsed as any).details = data?.error?.details || {};
    (parsed as any).suggestion = data?.suggestion;
    throw parsed;
  }

  const passthrough = new Error(error?.message || 'CAW API error');
  (passthrough as any).status = response?.status || error?.status || error?.statusCode;
  (passthrough as any).code = transportCode;
  (passthrough as any).cause = error?.cause;
  throw passthrough;
}

export class CoboCAWService {
  private walletUuid: string;

  constructor() {
    this.walletUuid = CAW_WALLET_UUID;
  }

  // ==================== Wallet ====================

  async getBalance(): Promise<string> {
    try {
      const response = await balanceApi.listBalances(
        this.walletUuid,
        undefined,
        undefined,
        'SETH',
        false,
        20
      );
      const data = response.data as any;
      const rows = data?.result?.items ?? data?.result?.list ?? data?.items ?? data?.list ?? [];
      const ethBalance = rows.find((b: any) => b?.token_id === 'SETH' || b?.chain_id === 'SETH');
      return ethBalance?.amount ?? ethBalance?.total ?? '0';
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async getWalletInfo(): Promise<any> {
    try {
      const response = await walletsApi.getWallet(this.walletUuid);
      return response.data;
    } catch (error: any) {
      parseCawError(error);
    }
  }

  // ==================== Transactions ====================

  async transferTokens(
    dstAddr: string,
    amount: string,
    tokenId = 'SETH',
    chainId = 'SETH',
    requestId?: string
  ): Promise<TransferResult> {
    try {
      const response = await txApi.transferTokens(this.walletUuid, {
        dst_addr: dstAddr,
        amount,
        token_id: tokenId,
        chain_id: chainId,
        request_id: requestId || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        description: 'Payment for resource',
      });

      const data = response.data as any;
      if (data?.result) {
        return {
          status: data.result.status || 'COMPLETED',
          transaction_hash: data.result.transaction_hash,
          pending_operation_id: data.result.pending_operation_id,
        };
      }
      throw new Error('Unexpected transfer response');
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async contractCall(
    contractAddr: string,
    calldata: string,
    value = '0',
    chainId = 'SETH',
    requestId?: string
  ): Promise<any> {
    try {
      const response = await txApi.contractCall(this.walletUuid, {
        chain_id: chainId,
        contract_addr: contractAddr,
        calldata,
        value,
        request_id: requestId || `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      return response.data;
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async getTransaction(txId: string): Promise<any> {
    try {
      const response = await txRecordsApi.getUserTransactionByUuid(txId);
      return response.data;
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async listTransactions(limit = 20): Promise<any[]> {
    try {
      const response = await txRecordsApi.listUserTransactions(
        this.walletUuid,
        undefined,
        undefined,
        undefined,
        limit
      );
      const data = response.data as any;
      return data?.result?.items ?? data?.result?.list ?? data?.items ?? data?.list ?? [];
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async estimateTransferFee(dstAddr: string, amount: string): Promise<any> {
    try {
      const response = await txApi.estimateTransferFee(this.walletUuid, {
        dst_addr: dstAddr,
        amount,
        token_id: 'SETH',
        chain_id: 'SETH',
      });
      return response.data;
    } catch (error: any) {
      parseCawError(error);
    }
  }

  // ==================== Pacts ====================

  async submitPact(intent: string, spec: any): Promise<PactInfo> {
    try {
      const response = await pactsApi.submitPact({
        wallet_id: this.walletUuid,
        intent,
        spec,
      });
      const data = response.data as any;
      const result = data?.result ?? data?.data ?? data;
      return {
        id: result.id || result.pact_id,
        status: result.status,
        intent,
        api_key: result.api_key,
      };
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async getPact(pactId: string): Promise<PactInfo> {
    try {
      const response = await pactsApi.getPact(pactId);
      const data = response.data as any;
      const result = data?.result ?? data;
      return {
        id: result.id || result.pact_id,
        status: result.status,
        intent: result.intent,
        api_key: result.api_key,
        name: result.name,
      };
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async listPacts(): Promise<PactInfo[]> {
    try {
      const response = await pactsApi.listPacts(undefined, this.walletUuid, undefined, undefined, undefined, 100);
      const data = response.data as any;
      const list = data?.result?.items ?? data?.result?.list ?? data?.items ?? data?.list ?? [];
      return list.map((p: any) => ({
        id: p.id || p.pact_id,
        status: p.status,
        intent: p.intent,
        api_key: p.api_key,
        name: p.name,
      }));
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async revokePact(pactId: string): Promise<any> {
    try {
      const response = await pactsApi.revokePact(pactId);
      return response.data;
    } catch (error: any) {
      parseCawError(error);
    }
  }

  async waitForPactActivation(pactId: string, timeoutMs = 300000): Promise<string> {
    const pollInterval = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const pact = await this.getPact(pactId);
        if (pact.status === 'ACTIVE' || pact.status === 'active') {
          return pact.api_key || '';
        }
        if (pact.status === 'REVOKED' || pact.status === 'EXPIRED') {
          throw new Error(`Pact ${pactId} is ${pact.status}`);
        }
      } catch (error: any) {
        if (error.message.includes('is REVOKED') || error.message.includes('is EXPIRED')) {
          throw error;
        }
        console.warn('[CAW] Poll error (will retry):', error.message);
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Pact ${pactId} did not activate within ${timeoutMs}ms`);
  }
}

export const cawService = new CoboCAWService();
