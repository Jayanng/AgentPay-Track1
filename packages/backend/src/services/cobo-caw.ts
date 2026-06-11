/**
 * Cobo Agentic Wallet (CAW) Service
 * Wraps the @cobo/agentic-wallet SDK for wallet operations, transactions, and pacts.
 *
 * KEY INSIGHT from Cobo docs:
 * - Every transfer MUST run inside a pact (pass pact_id in transfer request)
 * - CAW API expects amounts as decimal strings (e.g. "0.003"), NOT wei
 * - src_addr is required even though SDK types say optional
 * - Pact submission returns an api_key scoped to the pact's permissions
 */

import { Configuration, PactsApi, TransactionsApi, WalletsApi } from '@cobo/agentic-wallet';
import { BalanceApi, TransactionRecordsApi } from '@cobo/agentic-wallet';

const CAW_API_KEY = process.env.CAW_API_KEY!;
const CAW_API_URL = process.env.CAW_API_URL || 'https://api.agenticwallet.cobo.com';
const CAW_WALLET_UUID = process.env.CAW_WALLET_UUID!;
const CAW_ETH_ADDRESS = process.env.CAW_ETH_ADDRESS || '';

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

// Direct fetch helper for API calls that need fields not in SDK types (like pact_id)
async function cawFetch(method: string, path: string, body?: any): Promise<any> {
  const url = `${CAW_API_URL}${path}`;
  const opts: RequestInit = {
    method,
    headers: {
      'X-API-Key': CAW_API_KEY,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const response = await fetch(url, opts);
  const data = await response.json();
  if (!response.ok) {
    const err: any = new Error(`CAW API ${response.status}: ${JSON.stringify(data).slice(0, 200)}`);
    err.status = response.status;
    err.cawResponse = data;
    throw err;
  }
  return data;
}

export interface TransferResult {
  status: string;
  transaction_hash?: string;
  pending_operation_id?: string;
  id?: string;
  raw?: any;
}

export interface PactInfo {
  id: string;
  status: string;
  intent?: string;
  api_key?: string;
  name?: string;
  raw?: any;
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

  console.error('[CAW] parseCawError: status=', response?.status, 'data=', JSON.stringify(data).slice(0, 500));

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
    (parsed as any).cawResponse = data;
    throw parsed;
  }

  const passthrough = new Error(error?.message || 'CAW API error');
  (passthrough as any).status = response?.status || error?.status || error?.statusCode;
  (passthrough as any).code = transportCode;
  (passthrough as any).cause = error?.cause;
  (passthrough as any).cawResponse = data;
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
      console.log('[CAW] Fetching balance for wallet:', this.walletUuid);
      const response = await balanceApi.listBalances(
        this.walletUuid,
        undefined,
        undefined,
        'SETH',
        false,
        20
      );
      const data = response.data as any;
      console.log('[CAW] Balance API raw response:', JSON.stringify(data, null, 2)?.slice(0, 800));

      let rows: any[] = [];
      if (Array.isArray(data?.result)) rows = data.result;
      else if (Array.isArray(data?.result?.items)) rows = data.result.items;
      else if (Array.isArray(data?.result?.list)) rows = data.result.list;
      else if (Array.isArray(data?.items)) rows = data.items;
      else if (Array.isArray(data?.list)) rows = data.list;
      else if (Array.isArray(data?.data?.items)) rows = data.data.items;
      else if (Array.isArray(data?.data?.list)) rows = data.data.list;
      else if (Array.isArray(data)) rows = data;

      const ethBalance = rows.find((b: any) =>
        b?.token_id === 'SETH' ||
        b?.chain_id === 'SETH' ||
        b?.token_id === 'ETH' ||
        b?.symbol === 'SETH' ||
        b?.symbol === 'ETH' ||
        b?.asset_id === 'SETH'
      );

      if (ethBalance) {
        console.log('[CAW] Found balance entry:', JSON.stringify(ethBalance));
        const amount = ethBalance?.amount ?? ethBalance?.total ?? ethBalance?.available ?? ethBalance?.balance ?? '0';
        if (typeof amount === 'string' && !amount.includes('.') && amount.length > 15) {
          try {
            const weiVal = BigInt(amount);
            const ethVal = Number(weiVal) / 1e18;
            return ethVal.toFixed(6);
          } catch {
            return String(amount);
          }
        }
        return String(amount);
      }

      if (data?.result?.amount !== undefined) return String(data.result.amount);
      if (data?.result?.total !== undefined) return String(data.result.total);
      if (data?.amount !== undefined) return String(data.amount);
      if (data?.total !== undefined) return String(data.total);

      console.log('[CAW] No SETH balance found in response, rows count:', rows.length);
      return '0';
    } catch (error: any) {
      console.error('[CAW] Balance fetch error:', error.message);
      parseCawError(error);
      return '0';
    }
  }

  async getWalletInfo(): Promise<any> {
    try {
      const response = await walletsApi.getWallet(this.walletUuid);
      return response.data;
    } catch (error: any) {
      console.error('[CAW] Wallet info error:', error.message);
      parseCawError(error);
      return null;
    }
  }

  // ==================== Transactions ====================

  /**
   * Transfer tokens using the CAW API.
   * CRITICAL: Per Cobo docs, every transfer must run inside a pact.
   * The SDK's TransferCreate type doesn't include pact_id, but the API accepts it.
   * We use direct axios calls to pass pact_id when available.
   */
  async transferTokens(
    dstAddr: string,
    amount: string,
    tokenId = 'SETH',
    chainId = 'SETH',
    requestId?: string,
    pactId?: string
  ): Promise<TransferResult> {
    try {
      const transferBody: any = {
        src_addr: CAW_ETH_ADDRESS,
        dst_addr: dstAddr,
        amount,
        token_id: tokenId,
        chain_id: chainId,
        request_id: requestId || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };

      // CRITICAL: Add pact_id if provided — transfers MUST run inside a pact
      if (pactId) {
        transferBody.pact_id = pactId;
      }

      console.log(`[CAW] transferTokens: amount=${amount}, to=${dstAddr}, pact_id=${pactId || 'none'}`);
      console.log('[CAW] Transfer request body:', JSON.stringify(transferBody, null, 2));

      // Use direct fetch to ensure pact_id is sent (SDK may strip unknown fields)
      const data = await cawFetch('POST', `/wallets/${this.walletUuid}/transactions/transfer`, transferBody);

      console.log('[CAW] Transfer response:', JSON.stringify(data, null, 2)?.slice(0, 800));

      const result = data?.result ?? data;
      return {
        status: result.status_display || result.status || 'COMPLETED',
        transaction_hash: result.transaction_hash,
        pending_operation_id: result.pending_operation_id,
        id: result.id,
        raw: data,
      };
    } catch (error: any) {
      const errResponse = error?.response?.data || error?.response?.body || {};
      console.error('[CAW] Transfer error:', error.message, 'API response:', JSON.stringify(errResponse).slice(0, 500));
      parseCawError(error);
      return { status: 'error' };
    }
  }

  async contractCall(
    contractAddr: string,
    calldata: string,
    value = '0',
    chainId = 'SETH',
    requestId?: string,
    pactId?: string
  ): Promise<any> {
    try {
      const body: any = {
        chain_id: chainId,
        contract_addr: contractAddr,
        calldata,
        value,
        request_id: requestId || `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      if (pactId) body.pact_id = pactId;

      const data = await cawFetch('POST', `/wallets/${this.walletUuid}/transactions/contract-call`, body);
      return data;
    } catch (error: any) {
      parseCawError(error);
      return null;
    }
  }

  async getTransaction(txId: string): Promise<any> {
    try {
      const response = await txRecordsApi.getUserTransactionByUuid(txId);
      return response.data;
    } catch (error: any) {
      parseCawError(error);
      return null;
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
      // Handle same response format as balance (result is direct array)
      if (Array.isArray(data?.result)) return data.result;
      return data?.result?.items ?? data?.result?.list ?? data?.items ?? data?.list ?? [];
    } catch (error: any) {
      parseCawError(error);
      return [];
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
      return null;
    }
  }

  // ==================== Pacts ====================

  async submitPact(intent: string, spec: any): Promise<PactInfo> {
    try {
      const requestBody: any = {
        wallet_id: this.walletUuid,
        intent,
        spec,
      };
      console.log('[CAW] Submitting pact:', JSON.stringify(requestBody, null, 2).slice(0, 800));

      // Use direct fetch to see the full raw response
      const data = await cawFetch('POST', '/pacts', requestBody);

      const result = data?.result ?? data?.data ?? data;
      console.log('[CAW] Pact FULL response:', JSON.stringify(data, null, 2)?.slice(0, 1500));

      return {
        id: result.id || result.pact_id,
        status: result.status,
        intent,
        api_key: result.api_key,
        name: result.name,
        raw: data,
      };
    } catch (error: any) {
      const errData = error?.response?.data || error?.response?.body || {};
      console.error('[CAW] Pact submission error:', error.message, JSON.stringify(errData).slice(0, 500));
      parseCawError(error);
      return { id: '', status: 'error' };
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
        raw: data,
      };
    } catch (error: any) {
      parseCawError(error);
      return { id: '', status: 'error' };
    }
  }

  async listPacts(): Promise<PactInfo[]> {
    try {
      // Use direct fetch for more control over query params and response
      const data = await cawFetch('GET', `/pacts?wallet_id=${this.walletUuid}&page_size=100`);
      console.log('[CAW] listPacts raw response:', JSON.stringify(data, null, 2)?.slice(0, 1500));

      let list: any[] = [];
      if (Array.isArray(data?.result)) list = data.result;
      else if (Array.isArray(data?.result?.items)) list = data.result.items;
      else if (Array.isArray(data?.result?.list)) list = data.result.list;
      else if (Array.isArray(data?.items)) list = data.items;
      else if (Array.isArray(data?.list)) list = data.list;
      else if (Array.isArray(data)) list = data;

      return list.map((p: any) => ({
        id: p.id || p.pact_id,
        status: p.status,
        intent: p.intent,
        api_key: p.api_key,
        name: p.name,
      }));
    } catch (error: any) {
      console.error('[CAW] listPacts error:', error.message);
      parseCawError(error);
      return [];
    }
  }

  async revokePact(pactId: string): Promise<any> {
    try {
      const data = await cawFetch('POST', `/pacts/${pactId}/revoke`);
      return data;
    } catch (error: any) {
      parseCawError(error);
      return null;
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

  /**
   * Find an active pact that covers transfers for the given chain/token.
   * Returns the pact ID or undefined.
   */
  async findTransferPact(chainId = 'SETH', tokenId = 'SETH'): Promise<string | undefined> {
    try {
      const pacts = await this.listPacts();
      for (const pact of pacts) {
        if (pact.status === 'ACTIVE' || pact.status === 'active') {
          // Check if this pact's raw data includes a transfer policy for the chain
          const raw = (pact as any).raw;
          const policies = raw?.result?.spec?.policies ?? raw?.spec?.policies ?? [];
          const hasTransferPolicy = policies.some((p: any) =>
            p.type === 'transfer' &&
            p.rules?.when?.chain_in?.includes(chainId)
          );
          if (hasTransferPolicy) return pact.id;
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }
}

export const cawService = new CoboCAWService();
