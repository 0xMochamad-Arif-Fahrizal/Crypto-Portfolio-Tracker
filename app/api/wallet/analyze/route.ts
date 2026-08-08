import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  printFifoAudit,
  writeAuditFile,
  type AuditInRow,
  type AuditOutRow,
  type AuditReconciliation,
  type AuditSummary,
} from './audit';

// ── Etherscan pagination ──────────────────────────────────────────────────
// Etherscan's account endpoints are requested at up to 10,000 records per
// call via `offset`, but the API does NOT reliably honor that — verified
// live against a real high-volume wallet (Ethereum Foundation "EF1"):
// requesting offset=10000 silently returned only 1000 records, while
// requesting offset=500 was honored exactly. A "partial page" (fewer
// records than requested) is therefore NOT a trustworthy end-of-history
// signal and must never be used to stop pagination — only a genuinely EMPTY
// page (or zero new records after dedup) reliably means "no more data". We
// paginate by advancing `startblock` past the last page's max block number
// and re-fetching until that empty-page signal is observed.
//
// SAFETY_MAX_PAGES bounds worst-case pagination for pathological addresses
// (e.g. a DEX router with tens of millions of transactions) so a single
// request can't loop indefinitely. If this cap is hit, the result is marked
// `isTruncated: true` and the exact number of records fetched is reported —
// never silently dropped, and never applied asymmetrically between incoming
// and outgoing transactions (both come from the same paginated fetch). Set
// generously (200 pages) since the real per-call size is smaller than the
// requested offset — a real 21,094-record wallet (Binance Hot Wallet 20)
// needed 23 pages to fetch in full.
const ETHERSCAN_PAGE_SIZE = 10000;
const SAFETY_MAX_PAGES = 200;
const DEBUG_ENDPOINT = 'http://127.0.0.1:7373/ingest/82684194-a1d7-4727-9637-324b6d91e3e7';
const DEBUG_SESSION_ID = '727dcd';

// Etherscan returns status:"0" for BOTH a genuine "no more transactions"
// terminal state AND real errors (rate limits, invalid params, transient
// failures) — the two are only distinguishable via `message`. Treating any
// non-"1" status as "empty" (as this used to do) silently truncates history
// on transient errors with no indication anything went wrong — caught live:
// one capture returned 2 transactions instead of the correct 12 with zero
// warning; a retry moments later returned the correct 12. A non-"1" status
// is now only ever treated as "done" when the message exactly matches a
// known empty-result message; anything else is retried with backoff, and if
// retries are exhausted, reported via `fetchError` — never silently dropped.
const ETHERSCAN_EMPTY_RESULT_MESSAGES = new Set(['no transactions found']);
const MAX_FETCH_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  traceId?: string;
  isError?: string;
  type?: string;
  input?: string;
}

interface TransactionDetail {
  txHash: string;
  timestamp: number;
  dateStr: string;        // "14 Apr 2025" — human readable
  direction: 'in' | 'out';
  asset: 'ETH' | 'USDT';
  amount: number;
  priceAtTime: number;    // historical price used for cost basis
  valueUSD: number;       // amount * priceAtTime
  isExcluded: boolean;    // true if in excludedHashes
}

interface HistoricalPrice {
  timestamp: number;
  price: number;
}

interface CostBasisResult {
  eth: {
    totalInvested: number;
    averageCostBasis: number;
    currentBalance: number;
    transactions: number;
    isTruncated: boolean;
    transactionDetails: TransactionDetail[];
    fifoBalance?: number;
    balanceMismatch?: number;
    /** Surviving FIFO lots after all OUTs, gas drain, and reconciliation.
     *  Client uses this (not transactionDetails) to compute cost basis so
     *  price overrides only apply to unsold quantities. */
    openLots?: Array<{ txHash: string; amount: number; pricePerEth: number; requiresManualPrice?: boolean }>;
    /** Internal audit payload — consumed by GET handler, NOT forwarded to client. */
    _audit?: {
      inRows: AuditInRow[];
      outRows: AuditOutRow[];
      reconciliation?: AuditReconciliation;
      totalGasEth: number;
      unmatchedOutEth: number;
      totalEthIn: number;
      totalEthOut: number;
      zeroPriceCount: number;
    };
  };
  usdt: {
    totalInvested: number;
    averageCostBasis: number;
    currentBalance: number;
    transactions: number;
    isTruncated: boolean;
    transactionDetails: TransactionDetail[];
    fifoBalance?: number;
    balanceMismatch?: number;
  };
}

function debugLog(
  runId: string,
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

interface PaginatedFetchResult {
  transactions: EtherscanTransaction[];
  /** true only if SAFETY_MAX_PAGES was hit — real pagination otherwise runs
   *  to the true end of history (a partial page from Etherscan). */
  truncated: boolean;
  pagesFetched: number;
  /** Non-null only if a genuine Etherscan API error (not a legitimate empty
   *  result) survived MAX_FETCH_RETRIES retries. When set, `transactions`
   *  reflects whatever was fetched before the error and MUST NOT be treated
   *  as the wallet's complete history — the caller is responsible for
   *  surfacing this rather than silently proceeding as if it were complete. */
  fetchError: string | null;
}

/**
 * Fetch a wallet's FULL transaction history for one Etherscan account action
 * (txlist / txlistinternal / tokentx), paginating past the ~10,000-record
 * per-call limit by advancing `startblock` to the last page's max block and
 * re-fetching. Explicitly reports truncation (with exact fetched count) if
 * SAFETY_MAX_PAGES is hit — never silently drops data.
 */
async function fetchAllEtherscanTx(
  action: 'txlist' | 'txlistinternal' | 'tokentx',
  address: string,
  apiKey: string,
  extraParams: string = ''
): Promise<PaginatedFetchResult> {
  const all: EtherscanTransaction[] = [];
  const seen = new Set<string>();
  let cursorStartBlock = 0;
  let pagesFetched = 0;
  let truncated = false;
  let fetchError: string | null = null;
  let retriesOnCurrentPage = 0;

  while (pagesFetched < SAFETY_MAX_PAGES) {
    const cacheBust = Date.now();
    const url =
      `https://api.etherscan.io/v2/api?chainid=1&module=account&action=${action}` +
      `&address=${address}${extraParams}` +
      `&startblock=${cursorStartBlock}&endblock=99999999` +
      `&page=1&offset=${ETHERSCAN_PAGE_SIZE}&sort=asc&apikey=${apiKey}&_=${cacheBust}`;

    const res = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${action} history from Etherscan (HTTP ${res.status})`);
    }
    const data = await res.json();
    pagesFetched += 1;

    if (data.status !== '1') {
      const msg = typeof data.message === 'string' ? data.message.trim() : '';
      const isGenuineEmpty = ETHERSCAN_EMPTY_RESULT_MESSAGES.has(msg.toLowerCase());
      // Etherscan sometimes puts the actual detail in `result` (a string,
      // not the usual array) while `message` is just a generic "NOTOK" —
      // e.g. an invalid API key returns message:"NOTOK",
      // result:"Invalid API Key (#err2)". Prefer the more specific string
      // when present so a surfaced error is actually actionable.
      const detail = typeof data.result === 'string' && data.result.trim() ? data.result.trim() : msg;

      if (isGenuineEmpty) {
        break; // normal terminal state
      }

      // A non-"1" status whose message we don't recognize as a legitimate
      // empty result. This includes rate limits, invalid params, transient
      // failures, and any message we haven't seen before — treat all of
      // these as errors, not as "the wallet has fewer transactions than it
      // does". Retry with exponential backoff before giving up.
      if (retriesOnCurrentPage < MAX_FETCH_RETRIES) {
        retriesOnCurrentPage += 1;
        pagesFetched -= 1; // failed attempt, don't count it against the caller-visible page count
        console.warn(
          `Etherscan ${action} error on attempt ${retriesOnCurrentPage}/${MAX_FETCH_RETRIES} ` +
          `(startblock=${cursorStartBlock}): "${detail || 'unknown error'}" — retrying...`
        );
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (retriesOnCurrentPage - 1));
        continue;
      }

      // Retries exhausted. Do NOT silently return partial data as if it
      // were complete — record the error so the caller can surface it.
      fetchError = detail || 'Unknown Etherscan API error';
      console.error(
        `Etherscan ${action}: giving up after ${MAX_FETCH_RETRIES} retries ` +
        `(startblock=${cursorStartBlock}): "${fetchError}"`
      );
      break;
    }
    retriesOnCurrentPage = 0; // reset once a page succeeds

    const page: EtherscanTransaction[] = data.result || [];
    if (page.length === 0) break;

    let newInPage = 0;
    let maxBlockInPage = cursorStartBlock;
    for (const tx of page) {
      const key = `${tx.hash}-${tx.from}-${tx.to}-${tx.value}-${tx.timeStamp}-${tx.traceId || ''}`;
      const blockNum = parseInt(tx.blockNumber, 10);
      if (blockNum > maxBlockInPage) maxBlockInPage = blockNum;
      if (!seen.has(key)) {
        seen.add(key);
        all.push(tx);
        newInPage += 1;
      }
    }

    // NOTE: deliberately no "page.length < ETHERSCAN_PAGE_SIZE means done"
    // check here — empirically disproven (see comment above). We always
    // advance and re-query after a non-empty page; only a genuinely empty
    // page or a stuck cursor (checked below) ends the loop.

    if (newInPage === 0) {
      // Every record in this page was already seen — we re-fetched the
      // boundary block (as designed) and found nothing beyond it. This is
      // the expected, normal way pagination now ends (see note above about
      // why a partial page can't be trusted as the end signal): NOT a
      // truncation, just confirmation we've reached the true end of history.
      break;
    }

    if (maxBlockInPage === cursorStartBlock) {
      // New records exist, but all of them share the exact same block as
      // the cursor — more records live in a single block than fit in one
      // page, so we can't safely advance without risking skipped
      // transactions. Genuinely truncated (a real, rare pathological case);
      // report explicitly rather than loop forever or silently drop data.
      truncated = true;
      break;
    }

    cursorStartBlock = maxBlockInPage; // re-fetch the boundary block too; `seen` dedupes the overlap
  }

  if (pagesFetched >= SAFETY_MAX_PAGES) {
    truncated = true;
  }

  return { transactions: all, truncated, pagesFetched, fetchError };
}

/**
 * Analyze wallet transaction history to calculate cost basis
 * Uses Etherscan API to fetch transactions and CoinGecko for historical prices
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const excludedParam = searchParams.get('excluded') || '';
    const ethBalanceParam = searchParams.get('ethBalance') || '';
    const usdtBalanceParam = searchParams.get('usdtBalance') || '';
    const ethPriceParam = searchParams.get('ethPrice') || '';
    const runId = searchParams.get('debugRunId') || 'initial';

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
    if (!ETHERSCAN_API_KEY) {
      return NextResponse.json(
        { error: 'Etherscan API key not configured' },
        { status: 500 }
      );
    }

    // Parse excluded transaction hashes
    const excludedHashes = excludedParam 
      ? excludedParam.split(',').map(h => h.trim().toLowerCase())
      : [];
    debugLog(runId, 'H1', 'app/api/wallet/analyze/route.ts:GET:excludedParse', 'Parsed excluded hashes', {
      address: address?.toLowerCase(),
      excludedCount: excludedHashes.length,
      excludedHashesSample: excludedHashes.slice(0, 5),
    });

    console.log('Starting transaction analysis for:', address);
    if (excludedHashes.length > 0) {
      console.log(`Excluding ${excludedHashes.length} transactions from analysis`);
    }

    // USDT (ERC-20) contract — also used as the extra query param for the
    // paginated tokentx fetch below.
    const USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

    // Fetch FULL transaction history for all three sources, paginated to
    // completion (or the explicit safety cap — see fetchAllEtherscanTx).
    const [ethResult, ethInternalResult, usdtResult] = await Promise.all([
      fetchAllEtherscanTx('txlist', address, ETHERSCAN_API_KEY),
      fetchAllEtherscanTx('txlistinternal', address, ETHERSCAN_API_KEY),
      fetchAllEtherscanTx('tokentx', address, ETHERSCAN_API_KEY, `&contractaddress=${USDT_CONTRACT}`),
    ]);

    const ethTransactions: EtherscanTransaction[] = ethResult.transactions;
    const ethInternalTransactions: EtherscanTransaction[] = ethInternalResult.transactions;
    const usdtTransactions: EtherscanTransaction[] = usdtResult.transactions;

    // Truncation is decided at the fetch layer, symmetrically for the whole
    // transaction set (not applied to incoming only) — this is what fixes
    // the previous asymmetric-USDT-truncation bug: whatever was fetched here
    // is used in full for both incoming and outgoing in both calculators.
    const ethTruncated = ethResult.truncated || ethInternalResult.truncated;
    const usdtTruncated = usdtResult.truncated;

    // A non-null fetchError means a real Etherscan API error survived all
    // retries during pagination for that source — the transactions fetched
    // for it are an unknown-completeness partial history, NOT a legitimate
    // "wallet has fewer transactions" result. Collected per-source so the
    // response can name exactly which fetch(es) were affected.
    const fetchErrors: { source: string; message: string }[] = [];
    if (ethResult.fetchError) fetchErrors.push({ source: 'txlist (ETH)', message: ethResult.fetchError });
    if (ethInternalResult.fetchError) fetchErrors.push({ source: 'txlistinternal (ETH internal)', message: ethInternalResult.fetchError });
    if (usdtResult.fetchError) fetchErrors.push({ source: 'tokentx (USDT)', message: usdtResult.fetchError });

    const fetchStats = {
      ethTxFetched: ethTransactions.length,
      ethInternalTxFetched: ethInternalTransactions.length,
      usdtTxFetched: usdtTransactions.length,
      ethPagesFetched: ethResult.pagesFetched,
      ethInternalPagesFetched: ethInternalResult.pagesFetched,
      usdtPagesFetched: usdtResult.pagesFetched,
    };

    console.log(
      `Fetched ${fetchStats.ethTxFetched} ETH tx (${fetchStats.ethPagesFetched} page(s)), ` +
      `${fetchStats.ethInternalTxFetched} internal tx (${fetchStats.ethInternalPagesFetched} page(s)), ` +
      `${fetchStats.usdtTxFetched} USDT tx (${fetchStats.usdtPagesFetched} page(s))` +
      `${ethTruncated || usdtTruncated ? ' — SAFETY CAP HIT, see isTruncated/fetchStats in response' : ''}`
    );

    // Parse on-chain balances for mismatch detection
    const onChainEthBalance = ethBalanceParam ? parseFloat(ethBalanceParam) : undefined;
    const onChainUsdtBalance = usdtBalanceParam ? parseFloat(usdtBalanceParam) : undefined;

    // Combine regular ETH transactions with internal transactions and sort by timestamp
    const allEthTransactions = [...ethTransactions, ...ethInternalTransactions].sort(
      (a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp)
    );
    const normalIncoming = ethTransactions.filter(
      (tx) => tx.to?.toLowerCase() === address.toLowerCase() && tx.value !== '0'
    );
    const internalIncoming = ethInternalTransactions.filter(
      (tx) => tx.to?.toLowerCase() === address.toLowerCase() && tx.value !== '0'
    );
    const duplicateLikeKeys = new Set<string>();
    for (const tx of allEthTransactions) {
      const key = `${tx.hash.toLowerCase()}-${tx.from?.toLowerCase() || ''}-${tx.to?.toLowerCase() || ''}-${tx.value}-${tx.timeStamp}-${tx.traceId || ''}`;
      if (duplicateLikeKeys.has(key)) {
        debugLog(runId, 'I2', 'app/api/wallet/analyze/route.ts:GET:dedupeCheck', 'Potential duplicate ETH record detected', {
          txHash: tx.hash,
          traceId: tx.traceId || null,
          key,
        });
      } else {
        duplicateLikeKeys.add(key);
      }
    }
    debugLog(runId, 'H2', 'app/api/wallet/analyze/route.ts:GET:etherscanFetch', 'Fetched transaction counts', {
      ethTxCount: ethTransactions.length,
      ethInternalTxCount: ethInternalTransactions.length,
      usdtTxCount: usdtTransactions.length,
      combinedEthTxCount: allEthTransactions.length,
    });
    debugLog(runId, 'I1', 'app/api/wallet/analyze/route.ts:GET:sourceCoverage', 'ETH inflow source coverage snapshot', {
      normalIncomingCount: normalIncoming.length,
      internalIncomingCount: internalIncoming.length,
      hasInternalCoverage: internalIncoming.length > 0,
      onChainEthBalance: onChainEthBalance ?? null,
    });

    console.log(`Found ${ethTransactions.length} ETH transactions`);
    console.log(`Found ${ethInternalTransactions.length} ETH internal transactions`);
    console.log(`Found ${usdtTransactions.length} USDT transactions`);

    // Calculate cost basis for ETH (using combined transactions)
    const ethCostBasis = await calculateEthCostBasis(
      allEthTransactions,
      address.toLowerCase(),
      excludedHashes,
      onChainEthBalance,
      runId,
      ethTruncated
    );

    // Calculate cost basis for USDT
    const usdtCostBasis = await calculateUsdtCostBasis(
      usdtTransactions,
      address.toLowerCase(),
      excludedHashes,
      onChainUsdtBalance,
      usdtTruncated
    );

    const result: CostBasisResult = {
      eth: ethCostBasis,
      usdt: usdtCostBasis,
    };

    // ── Live ETH price for the audit P&L summary ──────────────────────────
    // Use the price already fetched by /api/wallet (passed as ?ethPrice=).
    // That route has a 5-tier fallback so this will be non-zero in all
    // normal cases. No extra network request needed.
    const liveEthPrice = ethPriceParam ? parseFloat(ethPriceParam) : 0;

    // ── Print + save audit ─────────────────────────────────────────────────
    if (result.eth._audit) {
      const ad = result.eth._audit;
      const onChainEth = onChainEthBalance ?? result.eth.currentBalance;
      const costBasis = result.eth.totalInvested;
      const currentValue = onChainEth * liveEthPrice;
      const pnl = currentValue - costBasis;
      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      const summary: AuditSummary = {
        address: address,
        generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        totalGasEth: ad.totalGasEth,
        totalEthIn: ad.totalEthIn,
        totalEthOut: ad.totalEthOut,
        totalCostBasisUSD: costBasis,
        currentEthBalance: onChainEth,
        currentEthPriceUSD: liveEthPrice,
        currentValueUSD: currentValue,
        unrealizedPnL: pnl,
        unrealizedPnLPct: pnlPct,
        zeroPriceCount: ad.zeroPriceCount,
        unmatchedOutEth: ad.unmatchedOutEth,
        reconciliation: ad.reconciliation,
        inRows: ad.inRows,
        outRows: ad.outRows,
      };

      printFifoAudit(summary);
      writeAuditFile(summary).catch(() => {}); // fire-and-forget
    }

    console.log('Cost basis analysis complete:', result);

    // Build response with excluded count — strip internal _audit field
    const { _audit: _drop, ...ethPublic } = result.eth as any;
    const response: any = {
      eth: ethPublic,
      usdt: result.usdt,
      excludedCount: excludedHashes.length,
    };

    // Add explicit error flag if any pagination fetch hit a real Etherscan
    // API error (not a legitimate empty result) that survived all retries.
    // This must never be silently absorbed — the transaction counts and
    // resulting cost basis above are based on an incomplete, unknown-size
    // subset of history for the affected source(s).
    if (fetchErrors.length > 0) {
      response.fetchError = {
        severity: 'critical',
        message: 'One or more Etherscan requests failed after retries. Transaction data may be incomplete for reasons unrelated to truncation or balance mismatch.',
        errors: fetchErrors,
      };
    }

    // Add warning if transactions were truncated — explicit, with the exact
    // fetched counts. We never know Etherscan's true total record count up
    // front, so we report what was actually fetched and say so honestly
    // rather than fabricate a total.
    if (result.eth.isTruncated || result.usdt.isTruncated) {
      const parts: string[] = [];
      if (result.eth.isTruncated) {
        parts.push(
          `ETH/internal transaction history hit the ${SAFETY_MAX_PAGES}-page pagination safety cap ` +
          `(fetched ${fetchStats.ethTxFetched} ETH + ${fetchStats.ethInternalTxFetched} internal records across ` +
          `${fetchStats.ethPagesFetched + fetchStats.ethInternalPagesFetched} page(s); true total is unknown and may be higher — ` +
          `Etherscan does not honor the full requested page size, so exact record-count caps can't be promised in advance).`
        );
      }
      if (result.usdt.isTruncated) {
        parts.push(
          `USDT transaction history hit the ${SAFETY_MAX_PAGES}-page pagination safety cap ` +
          `(fetched ${fetchStats.usdtTxFetched} records across ${fetchStats.usdtPagesFetched} page(s); true total is unknown and may be higher).`
        );
      }
      response.warning = parts.join(' ') + ' Cost basis is based on this partial history only.';
      response.fetchStats = fetchStats;
    }

    // Add critical warning if data quality issues detected
    const ethHasIssues = (result.eth.balanceMismatch && result.eth.balanceMismatch > 0.001);
    const usdtHasIssues = (result.usdt.balanceMismatch && result.usdt.balanceMismatch > 0.001);
    
    if (ethHasIssues || usdtHasIssues) {
      const issues = [];
      if (ethHasIssues) {
        issues.push(`ETH balance mismatch: ${result.eth.balanceMismatch?.toFixed(6)} ETH untracked`);
      }
      if (usdtHasIssues) {
        issues.push(`USDT balance mismatch: ${result.usdt.balanceMismatch?.toFixed(6)} USDT untracked`);
      }
      
      response.dataQualityWarning = {
        severity: 'critical',
        message: 'Incomplete transaction data detected. Cost basis calculation is unreliable.',
        issues,
        recommendation: 'Some transactions are missing from Etherscan (likely internal transactions, mining rewards, or bridge transfers). Manual cost basis input may be required.',
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Transaction analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze transactions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate ETH cost basis from transaction history
 * Uses FIFO method: tracks both incoming and outgoing to calculate accurate cost basis
 */
async function calculateEthCostBasis(
  transactions: EtherscanTransaction[],
  walletAddress: string,
  excludedHashes: string[],
  onChainBalance: number | undefined,
  runId: string = 'initial',
  isTruncated: boolean = false
): Promise<CostBasisResult['eth']> {
  // Separate ALL incoming and outgoing transactions (including excluded ones for display)
  const allIncomingTxs = transactions.filter(
    (tx) => tx.to.toLowerCase() === walletAddress && tx.value !== '0'
  );
  
  const allOutgoingTxs = transactions.filter(
    (tx) => tx.from.toLowerCase() === walletAddress && tx.value !== '0'
  );

  // Exclusion is intended for "Mark as Internal" OUT transfers.
  // Never exclude incoming lots by hash, otherwise cross-wallet/internal flows can erase valid cost basis lots.
  const incomingTxs = allIncomingTxs;
  
  const outgoingTxs = allOutgoingTxs.filter(
    (tx) => !excludedHashes.includes(tx.hash.toLowerCase())
  );

  const excludedCount = transactions.filter(tx => 
    excludedHashes.includes(tx.hash.toLowerCase())
  ).length;
  debugLog(runId, 'H4', 'app/api/wallet/analyze/route.ts:calculateEthCostBasis:start', 'ETH FIFO entry counts', {
    walletAddress,
    allIncomingCount: allIncomingTxs.length,
    allOutgoingCount: allOutgoingTxs.length,
    incomingNonExcludedCount: incomingTxs.length,
    outgoingNonExcludedCount: outgoingTxs.length,
    excludedMatchCount: excludedCount,
  });
  const excludedIncomingCount = allIncomingTxs.filter((tx) =>
    excludedHashes.includes(tx.hash.toLowerCase())
  ).length;
  debugLog(runId, 'H1', 'app/api/wallet/analyze/route.ts:calculateEthCostBasis:excludedIncoming', 'Excluded incoming ETH impact', {
    excludedIncomingCount,
    totalIncomingCount: allIncomingTxs.length,
    excludedIncomingHashesSample: allIncomingTxs
      .filter((tx) => excludedHashes.includes(tx.hash.toLowerCase()))
      .slice(0, 5)
      .map((tx) => tx.hash),
  });
  debugLog(runId, 'I3', 'app/api/wallet/analyze/route.ts:calculateEthCostBasis:inflowComposition', 'ETH inflow composition used by FIFO', {
    totalIncomingCount: allIncomingTxs.length,
    totalOutgoingCount: allOutgoingTxs.length,
    internalLikeIncomingCount: allIncomingTxs.filter((tx) => typeof tx.traceId === 'string').length,
    internalLikeOutgoingCount: allOutgoingTxs.filter((tx) => typeof tx.traceId === 'string').length,
  });

  console.log(`Found ${allIncomingTxs.length} total incoming (${incomingTxs.length} non-excluded) and ${allOutgoingTxs.length} total outgoing (${outgoingTxs.length} non-excluded) ETH transactions`);

  // No local truncation here — the full paginated transaction set (or the
  // explicit, reported safety-cap subset from fetchAllEtherscanTx) is used
  // for FIFO in its entirety. `isTruncated` reflects only whether the fetch
  // layer hit its safety cap, passed in from the caller.
  console.log(`Processing ${incomingTxs.length} incoming and ${outgoingTxs.length} outgoing ETH transactions for FIFO`);

  // Track purchases with FIFO queue.
  // txHash is stored so the client can apply per-lot price overrides by matching
  // back to the originating IN transaction.
  interface Purchase {
    lotNo: number;
    txHash: string;
    amount: number;
    pricePerEth: number;
    priceSource: string;
    timestamp: number;
    requiresManualPrice?: boolean;
  }

  // Audit accumulators
  const auditInRows: AuditInRow[] = [];
  const auditOutRows: AuditOutRow[] = [];
  let auditLotCounter = 0;

  const purchases: Purchase[] = [];
  let totalInvestedUSD = 0;
  let totalEthRemaining = 0;
  let zeroPriceCount = 0;
  let unmatchedOutTotal = 0;

  // Build transactionDetails from ALL transactions FIRST (before FIFO processing)
  const transactionDetails: TransactionDetail[] = [];
  
  // Add all incoming transactions to details
  for (const tx of allIncomingTxs) {
    const ethAmount = parseFloat(tx.value) / 1e18;
    const timestamp = parseInt(tx.timeStamp);
    const isExcluded = excludedHashes.includes(tx.hash.toLowerCase());
    const date = new Date(timestamp * 1000);
    
    transactionDetails.push({
      txHash: tx.hash,
      timestamp,
      dateStr: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
      direction: 'in',
      asset: 'ETH',
      amount: ethAmount,
      priceAtTime: 0, // Will be filled during FIFO processing
      valueUSD: 0,    // Will be filled during FIFO processing
      isExcluded,
    });
  }
  
  // Add all outgoing transactions to details
  for (const tx of allOutgoingTxs) {
    const ethAmount = parseFloat(tx.value) / 1e18;
    const timestamp = parseInt(tx.timeStamp);
    const isExcluded = excludedHashes.includes(tx.hash.toLowerCase());
    const date = new Date(timestamp * 1000);
    
    transactionDetails.push({
      txHash: tx.hash,
      timestamp,
      dateStr: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
      direction: 'out',
      asset: 'ETH',
      amount: ethAmount,
      priceAtTime: 0,
      valueUSD: 0,
      isExcluded,
    });
  }
  
  // Sort by timestamp (chronological order)
  transactionDetails.sort((a, b) => a.timestamp - b.timestamp);

  // ── Pre-resolve historical prices once per unique date ────────────────────
  // Previously this awaited getHistoricalEthPrice() once per incoming
  // transaction, sequentially. With the 100-tx cap removed, a real wallet can
  // have hundreds or thousands of incoming lots — sequential per-lot lookups
  // would make such wallets effectively never finish. Resolving once per
  // unique calendar date (many lots often share a date) and running those
  // lookups with bounded concurrency cuts network round trips without
  // changing FIFO semantics: lots are still consumed oldest-first below,
  // this only changes how their price gets looked up beforehand.
  const uniqueDates = new Map<string, number>(); // dateStr -> representative timestamp
  for (const tx of allIncomingTxs) {
    const ts = parseInt(tx.timeStamp);
    const dateStr = new Date(ts * 1000).toISOString().slice(0, 10);
    if (!uniqueDates.has(dateStr)) uniqueDates.set(dateStr, ts);
  }

  const datePriceMap = new Map<string, { price: number; source: string }>();
  const dateEntries = Array.from(uniqueDates.entries());
  const PRICE_LOOKUP_CONCURRENCY = 8;
  for (let i = 0; i < dateEntries.length; i += PRICE_LOOKUP_CONCURRENCY) {
    const batch = dateEntries.slice(i, i + PRICE_LOOKUP_CONCURRENCY);
    const results = await Promise.all(batch.map(([, ts]) => getHistoricalEthPrice(ts)));
    batch.forEach(([dateStr], idx) => datePriceMap.set(dateStr, results[idx]));
  }
  console.log(
    `Resolved historical prices for ${dateEntries.length} unique date(s) across ${allIncomingTxs.length} incoming ETH tx(s)`
  );

  // Process incoming transactions for FIFO calculation
  for (const tx of allIncomingTxs) {
    const ethAmount = parseFloat(tx.value) / 1e18;
    const timestamp = parseInt(tx.timeStamp);
    const isExcluded = excludedHashes.includes(tx.hash.toLowerCase());
    const lookupDateStr = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const { price: ethPrice, source: priceSource } = datePriceMap.get(lookupDateStr)!;

    // Update transaction detail with price info
    const detail = transactionDetails.find(d => d.txHash === tx.hash);
    const date = new Date(timestamp * 1000);
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

    // Failed/reverted transactions still populate `value` with the amount
    // that WOULD have been sent, but the call reverted — no ETH actually
    // moved. Only gas was burned (handled correctly, separately, in the
    // gas-drain loop below, which is not conditioned on success). Treating
    // a failed tx's phantom value as a real inbound lot over-credits balance.
    // Verified against live data: this exact pattern (on the outgoing side)
    // accounted for the entirety of EF1's 69.06 ETH balance-mismatch gap.
    // Still visible in the UI transaction list (marked excluded), not
    // silently dropped — just correctly excluded from cost-basis impact.
    if (tx.isError === '1') {
      if (detail) detail.isExcluded = true;
      console.log(
        `IN  ${tx.hash.substring(0, 10)}...: FAILED transaction (isError=1) — excluded from FIFO, no value actually transferred`
      );
      continue;
    }

    if (ethPrice > 0) {
      // Incoming lots are always eligible for FIFO (see note above — the
      // full incoming set is used, no separate truncated subset anymore).
      {
        auditLotCounter += 1;
        purchases.push({
          lotNo: auditLotCounter,
          txHash: tx.hash,
          amount: ethAmount,
          pricePerEth: ethPrice,
          priceSource,
          timestamp,
        });

        totalInvestedUSD += ethAmount * ethPrice;
        totalEthRemaining += ethAmount;

        auditInRows.push({
          lotNo: auditLotCounter,
          txHash: tx.hash,
          dateStr,
          ethAmount,
          pricePerEth: ethPrice,
          priceSource,
          costBasisUSD: ethAmount * ethPrice,
        });
      }

      if (detail) {
        detail.priceAtTime = ethPrice;
        detail.valueUSD = ethAmount * ethPrice;
      }

      console.log(
        `IN  ${tx.hash.substring(0, 10)}...: +${ethAmount.toFixed(4)} ETH @ $${ethPrice.toFixed(2)} [${priceSource}]`
      );
    } else {
      // Missing price — lot stays in FIFO queue with pricePerEth=0 so the
      // balance never goes negative. Cost basis is $0 until user enters a
      // manual price via the UI "HARGA MISSING" button.
      zeroPriceCount += 1;

      {
        auditLotCounter += 1;
        purchases.push({
          lotNo: auditLotCounter,
          txHash: tx.hash,
          amount: ethAmount,
          pricePerEth: 0,
          priceSource: 'missing',
          timestamp,
          requiresManualPrice: true,
        });

        // Cost basis is $0 for this lot until user supplies manual price.
        // totalInvestedUSD += 0 intentionally.
        totalEthRemaining += ethAmount; // balance must stay correct

        auditInRows.push({
          lotNo: auditLotCounter,
          txHash: tx.hash,
          dateStr,
          ethAmount,
          pricePerEth: 0,
          priceSource: 'missing',
          costBasisUSD: 0,
        });
      }

      if (detail) {
        detail.priceAtTime = 0;
        detail.valueUSD = 0;
      }

      console.warn(
        `⚠️  IN  ${tx.hash.substring(0, 10)}...: +${ethAmount.toFixed(4)} ETH @ MISSING PRICE — kept in FIFO queue, cost=$0`
      );
      console.warn(`   Transaction date: ${new Date(timestamp * 1000).toISOString()}`);
      console.warn(`   UI will prompt manual price entry for this lot`);
    }
  }

  // Process outgoing transactions for FIFO removal
  for (const tx of allOutgoingTxs) {
    const ethAmount = parseFloat(tx.value) / 1e18;
    const timestamp = parseInt(tx.timeStamp);
    const isExcluded = excludedHashes.includes(tx.hash.toLowerCase());
    const date = new Date(timestamp * 1000);
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

    // Same fix as the incoming loop above: a failed/reverted transaction's
    // `value` was never actually sent. Consuming FIFO lots for it would
    // over-subtract balance — this exact bug (8 failed outgoing txs with
    // nonzero value) accounted for EF1's entire 69.06 ETH balance mismatch.
    if (tx.isError === '1') {
      const failDetail = transactionDetails.find(d => d.txHash === tx.hash);
      if (failDetail) failDetail.isExcluded = true;
      console.log(
        `OUT ${tx.hash.substring(0, 10)}...: FAILED transaction (isError=1) — excluded from FIFO, no value actually transferred`
      );
      continue;
    }

    console.log(
      `OUT ${tx.hash.substring(0, 10)}...: -${ethAmount.toFixed(4)} ETH${isExcluded ? ' (EXCLUDED)' : ''}`
    );

    // Only process FIFO removal if NOT excluded
    if (!isExcluded) {
      let remainingToRemove = ethAmount;
      const lotsConsumedParts: string[] = [];

      // Remove from purchases using FIFO
      while (remainingToRemove > 0 && purchases.length > 0) {
        const oldestPurchase = purchases[0];

        if (oldestPurchase.amount <= remainingToRemove) {
          // Remove entire purchase
          const costBasisRemoved = oldestPurchase.amount * oldestPurchase.pricePerEth;
          lotsConsumedParts.push(`#${oldestPurchase.lotNo}(${oldestPurchase.amount.toFixed(4)})`);
          totalInvestedUSD -= costBasisRemoved;
          totalEthRemaining = Number((totalEthRemaining - oldestPurchase.amount).toFixed(8));
          remainingToRemove = Number((remainingToRemove - oldestPurchase.amount).toFixed(8));
          purchases.shift();

          console.log(`  Removed purchase: ${oldestPurchase.amount.toFixed(4)} ETH @ ${oldestPurchase.pricePerEth.toFixed(2)}`);
        } else {
          // Partially remove from purchase
          const costBasisRemoved = remainingToRemove * oldestPurchase.pricePerEth;
          lotsConsumedParts.push(`#${oldestPurchase.lotNo}(${remainingToRemove.toFixed(4)})`);
          totalInvestedUSD -= costBasisRemoved;
          totalEthRemaining = Number((totalEthRemaining - remainingToRemove).toFixed(8));
          oldestPurchase.amount = Number((oldestPurchase.amount - remainingToRemove).toFixed(8));

          console.log(`  Partially removed: ${remainingToRemove.toFixed(4)} ETH @ ${oldestPurchase.pricePerEth.toFixed(2)}`);
          remainingToRemove = 0;
        }
      }

      auditOutRows.push({
        txHash: tx.hash,
        dateStr,
        ethAmount,
        type: 'OUT',
        lotsConsumed: lotsConsumedParts.join(' '),
      });

      // Handle unmatched OUT (when queue exhausted but OUT not fully processed)
      if (remainingToRemove > 0) {
        unmatchedOutTotal += remainingToRemove;
        debugLog(runId, 'I4', 'app/api/wallet/analyze/route.ts:calculateEthCostBasis:unmatchedOut', 'Unmatched ETH outflow encountered', {
          txHash: tx.hash,
          unmatchedAmount: remainingToRemove,
          originalOutAmount: ethAmount,
          purchasesRemaining: purchases.length,
          outTraceId: tx.traceId || null,
        });
        console.error(`❌ FIFO queue exhausted! Unmatched OUT: ${remainingToRemove.toFixed(4)} ETH`);
        console.error(`   Transaction: ${tx.hash}`);
        console.error(`   This ETH has NO TRACKED COST BASIS`);

        // Mark this transaction as having missing data
        const detail = transactionDetails.find(d => d.txHash === tx.hash);
        if (detail) {
          detail.priceAtTime = -1; // Special marker for "missing cost basis"
          detail.valueUSD = -1;
        }
      }
    }
  }

  // ── Bug 2 fix A: Gas-fee drain ────────────────────────────────────────────
  // Every tx the wallet signed (from === walletAddress) costs gas even when
  // the ETH value is 0 (contract calls, ERC-20 approvals, failed txs).
  // Gas is a real ETH deduction but Etherscan's `txlist` value field does NOT
  // include it — so it never appears in allOutgoingTxs and goes untracked.
  //
  // Internal transactions (traceId present) are contract-to-contract; the gas
  // for those was already charged on the initiating normal tx, so we skip them.
  const fifoConsumeEth = (qty: number) => {
    let remaining = Number(qty.toFixed(8));
    while (remaining > 0.000001 && purchases.length > 0) {
      const oldest = purchases[0];
      if (oldest.amount <= remaining) {
        totalInvestedUSD -= oldest.amount * oldest.pricePerEth;
        totalEthRemaining = Number((totalEthRemaining - oldest.amount).toFixed(8));
        remaining = Number((remaining - oldest.amount).toFixed(8));
        purchases.shift();
      } else {
        totalInvestedUSD -= remaining * oldest.pricePerEth;
        totalEthRemaining = Number((totalEthRemaining - remaining).toFixed(8));
        oldest.amount = Number((oldest.amount - remaining).toFixed(8));
        remaining = 0;
      }
    }
  };

  let totalGasEth = 0;
  for (const tx of transactions) {
    if (tx.traceId) continue; // internal tx — gas charged to outer tx already
    if (tx.from?.toLowerCase() !== walletAddress) continue;
    const gasEth = (parseInt(tx.gasUsed || '0') * parseInt(tx.gasPrice || '0')) / 1e18;
    if (gasEth <= 0) continue;
    totalGasEth += gasEth;
    fifoConsumeEth(gasEth);

    const timestamp = parseInt(tx.timeStamp);
    const date = new Date(timestamp * 1000);
    const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    auditOutRows.push({
      txHash: tx.hash,
      dateStr,
      ethAmount: gasEth,
      type: 'GAS',
      lotsConsumed: '',
    });
  }
  if (totalGasEth > 0) {
    console.log(`⛽ Gas fees drained from FIFO: ${totalGasEth.toFixed(6)} ETH`);
  }

  // ── Reconciliation: untracked outflow (bridge/internal tx not captured by
  // Etherscan txlist) ───────────────────────────────────────────────────────
  // Previously this blended every remaining lot into a single weighted-average
  // price (WAC), which silently rewrote the price of every surviving lot and
  // broke traceability from cost basis back to its originating transaction —
  // contradicting the system's core auditability claim. Fixed to consume the
  // shortfall FIFO-style (oldest lot first, same mechanism as gas draining)
  // so untouched lots keep their original per-unit price and source tx.
  let auditReconciliation: AuditReconciliation | undefined;

  if (
    onChainBalance !== undefined &&
    totalEthRemaining > onChainBalance + 0.0001
  ) {
    const shortfall = Number((totalEthRemaining - onChainBalance).toFixed(8));
    const fifoBeforeReconcile = totalEthRemaining;
    const costBasisBeforeReconcile = totalInvestedUSD;

    console.warn(
      `🔧 Untracked-outflow reconciliation: FIFO=${totalEthRemaining.toFixed(6)} ETH → ` +
      `on-chain=${onChainBalance.toFixed(6)} ETH | consuming ${shortfall.toFixed(6)} ETH oldest-lot-first`
    );

    fifoConsumeEth(shortfall);

    auditReconciliation = {
      method: 'FIFO-UNTRACKED-OUT',
      fifoBeforeReconcile,
      onChainBalance,
      wac: fifoBeforeReconcile > 0 ? costBasisBeforeReconcile / fifoBeforeReconcile : 0,
      scaleFactor: fifoBeforeReconcile > 0 ? onChainBalance / fifoBeforeReconcile : 0,
      adjustedCostBasis: totalInvestedUSD,
    };
  } else if (
    onChainBalance !== undefined &&
    totalEthRemaining < onChainBalance - 0.0001
  ) {
    // ── Under-counted inflow (the opposite failure mode) ────────────────────
    // FIFO's tracked balance is LOWER than the real on-chain balance — some
    // ETH arrived through a channel Etherscan's txlist/txlistinternal never
    // captured. Unlike the untracked-outflow case above, there is no lot to
    // consume: the missing value's price and origin are unknown, so
    // fabricating a lot to plug the gap would be worse than reporting it.
    // Previously this case fell through silently — the audit report printed
    // "FIFO balance matches on-chain, no reconciliation needed" even when a
    // large gap existed, because that message only ever checked the
    // over-counting branch above. Record it explicitly instead.
    const shortfall = Number((onChainBalance - totalEthRemaining).toFixed(8));
    console.warn(
      `⚠️  Under-counted-inflow detected: FIFO=${totalEthRemaining.toFixed(6)} ETH → ` +
      `on-chain=${onChainBalance.toFixed(6)} ETH | ${shortfall.toFixed(6)} ETH received via a channel not ` +
      `captured by Etherscan's txlist/txlistinternal — cannot be auto-corrected, no lot fabricated`
    );
    auditReconciliation = {
      method: 'UNDER-COUNTED-INFLOW-DETECTED',
      fifoBeforeReconcile: totalEthRemaining,
      onChainBalance,
      wac: 0,
      scaleFactor: 0,
      adjustedCostBasis: totalInvestedUSD, // unchanged — no correction applied, nothing to adjust
    };
  }

  const averageCostBasis = totalEthRemaining > 0 ? totalInvestedUSD / totalEthRemaining : 0;

  console.log(`Final ETH: ${totalEthRemaining.toFixed(4)} ETH, Cost Basis: ${totalInvestedUSD.toFixed(2)}, Avg: ${averageCostBasis.toFixed(2)}`);
  
  // Validation: Check for data quality issues
  const hasDataQualityIssues = zeroPriceCount > 0 || unmatchedOutTotal > 0;
  
  if (hasDataQualityIssues) {
    console.error(`\n❌ DATA QUALITY ISSUES DETECTED:`);
    if (zeroPriceCount > 0) {
      console.error(`   - ${zeroPriceCount} transactions with missing historical prices`);
    }
    if (unmatchedOutTotal > 0) {
      console.error(`   - ${unmatchedOutTotal.toFixed(4)} ETH sold without tracked cost basis`);
    }
    console.error(`   ⚠️ Cost basis calculation is INCOMPLETE and UNRELIABLE`);
    console.error(`   DO NOT use for tax reporting or financial decisions!`);
  }
  
  debugLog(runId, 'H3', 'app/api/wallet/analyze/route.ts:calculateEthCostBasis:priceCheck', 'Historical price resolution stats', {
    zeroPriceCount,
    totalIncomingCount: allIncomingTxs.length,
  });
  debugLog(runId, 'H5', 'app/api/wallet/analyze/route.ts:calculateEthCostBasis:final', 'ETH FIFO final state', {
    totalInvestedUSD,
    totalEthRemaining,
    averageCostBasis,
    purchasesRemaining: purchases.length,
    unmatchedOutTotal,
    onChainBalance: onChainBalance ?? null,
    hasDataQualityIssues,
  });
  debugLog(runId, 'I5', 'app/api/wallet/analyze/route.ts:calculateEthCostBasis:balanceCoverage', 'ETH inflow coverage vs balance', {
    sumIncomingEth: allIncomingTxs.reduce((sum, tx) => sum + parseFloat(tx.value) / 1e18, 0),
    sumOutgoingEth: allOutgoingTxs.reduce((sum, tx) => sum + parseFloat(tx.value) / 1e18, 0),
    fifoBalance: totalEthRemaining,
    onChainBalance: onChainBalance ?? null,
    unmatchedOutTotal,
  });

  // Check for balance mismatch if on-chain balance provided
  let balanceMismatch = 0;
  if (onChainBalance !== undefined) {
    balanceMismatch = Math.abs(totalEthRemaining - onChainBalance);
    
    if (balanceMismatch > 0.001) {
      console.warn(`⚠️ Balance mismatch detected!`);
      console.warn(`   FIFO balance: ${totalEthRemaining.toFixed(6)} ETH`);
      console.warn(`   On-chain balance: ${onChainBalance.toFixed(6)} ETH`);
      console.warn(`   Difference: ${balanceMismatch.toFixed(6)} ETH`);
      console.warn(`   This indicates untracked transactions (likely internal transactions)`);
    }
  }

  // openLots = surviving FIFO queue after all value OUTs, gas drain, and
  // reconciliation. The client uses this (not transactionDetails) to compute
  // cost basis, so price overrides are correctly limited to unsold lots.
  const openLots = purchases.map((p) => ({
    txHash: p.txHash,
    amount: p.amount,
    pricePerEth: p.pricePerEth,
    ...(p.requiresManualPrice ? { requiresManualPrice: true } : {}),
  }));

  // auditOutRows is already in insertion order (chronological)
  return {
    totalInvested: totalInvestedUSD,
    averageCostBasis,
    currentBalance: totalEthRemaining,
    transactions: allIncomingTxs.length,
    isTruncated,
    transactionDetails,
    fifoBalance: totalEthRemaining,
    balanceMismatch,
    openLots,
    // Audit data — used by GET handler, not sent to client
    _audit: {
      inRows: auditInRows,
      outRows: auditOutRows,
      reconciliation: auditReconciliation,
      totalGasEth,
      unmatchedOutEth: unmatchedOutTotal,
      totalEthIn: allIncomingTxs.reduce((s, tx) => s + parseFloat(tx.value) / 1e18, 0),
      totalEthOut: allOutgoingTxs.reduce((s, tx) => s + parseFloat(tx.value) / 1e18, 0),
      zeroPriceCount,
    },
  };
}

/**
 * Calculate USDT cost basis from transaction history
 * USDT is a stablecoin, so we assume $1 per USDT
 * Uses FIFO method to track remaining balance
 */
async function calculateUsdtCostBasis(
  transactions: EtherscanTransaction[],
  walletAddress: string,
  excludedHashes: string[],
  onChainBalance: number | undefined,
  isTruncated: boolean = false
): Promise<CostBasisResult['usdt']> {
  // Separate ALL incoming and outgoing transactions (including excluded ones for display)
  const allIncomingTxs = transactions.filter(
    (tx) => tx.to.toLowerCase() === walletAddress && tx.value !== '0'
  );
  
  const allOutgoingTxs = transactions.filter(
    (tx) => tx.from.toLowerCase() === walletAddress && tx.value !== '0'
  );

  // Filter out excluded transactions for FIFO calculation only
  const incomingTxs = allIncomingTxs.filter(
    (tx) => !excludedHashes.includes(tx.hash.toLowerCase())
  );
  
  const outgoingTxs = allOutgoingTxs.filter(
    (tx) => !excludedHashes.includes(tx.hash.toLowerCase())
  );

  const excludedCount = transactions.filter(tx => 
    excludedHashes.includes(tx.hash.toLowerCase())
  ).length;

  console.log(`Found ${allIncomingTxs.length} total incoming (${incomingTxs.length} non-excluded) and ${allOutgoingTxs.length} total outgoing (${outgoingTxs.length} non-excluded) USDT transactions`);

  // No local truncation here — incoming and outgoing both use the full
  // paginated set in its entirety (this symmetry is what fixes the previous
  // bug where incoming was capped at 100 but outgoing was not, producing
  // impossible negative balances for high-volume wallets). `isTruncated`
  // reflects only whether the fetch layer hit its safety cap, passed in from
  // the caller — applied identically to both directions.
  console.log(`Processing ${incomingTxs.length} incoming and ${outgoingTxs.length} outgoing USDT transactions`);

  let totalUsdtRemaining = 0;
  const transactionDetails: TransactionDetail[] = [];

  // Process ALL incoming transactions
  for (const tx of incomingTxs) {
    const usdtAmount = parseFloat(tx.value) / 1e6; // USDT has 6 decimals
    totalUsdtRemaining += usdtAmount;
    const timestamp = parseInt(tx.timeStamp);

    // Add transaction detail
    const date = new Date(timestamp * 1000);
    transactionDetails.push({
      txHash: tx.hash,
      timestamp,
      dateStr: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
      direction: 'in',
      asset: 'USDT',
      amount: usdtAmount,
      priceAtTime: 1.0, // USDT is always $1
      valueUSD: usdtAmount,
      isExcluded: false,
    });

    console.log(
      `IN  ${tx.hash.substring(0, 10)}...: +${usdtAmount.toFixed(2)} USDT`
    );
  }

  // Process ALL outgoing transactions
  for (const tx of outgoingTxs) {
    const usdtAmount = parseFloat(tx.value) / 1e6;
    totalUsdtRemaining -= usdtAmount;
    const timestamp = parseInt(tx.timeStamp);

    // Add outgoing transaction detail
    const date = new Date(timestamp * 1000);
    transactionDetails.push({
      txHash: tx.hash,
      timestamp,
      dateStr: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
      direction: 'out',
      asset: 'USDT',
      amount: usdtAmount,
      priceAtTime: 1.0,
      valueUSD: usdtAmount,
      isExcluded: false,
    });

    console.log(
      `OUT ${tx.hash.substring(0, 10)}...: -${usdtAmount.toFixed(2)} USDT`
    );
  }

  // USDT is a stablecoin, so cost basis = remaining amount
  const totalInvestedUSD = totalUsdtRemaining;
  const averageCostBasis = 1.0; // $1 per USDT

  console.log(`Final USDT: ${totalUsdtRemaining.toFixed(2)} USDT, Cost Basis: ${totalInvestedUSD.toFixed(2)}`);

  // Check for balance mismatch if on-chain balance provided
  let balanceMismatch = 0;
  if (onChainBalance !== undefined) {
    balanceMismatch = Math.abs(totalUsdtRemaining - onChainBalance);
    
    if (balanceMismatch > 0.001) {
      console.warn(`⚠️ Balance mismatch detected!`);
      console.warn(`   FIFO balance: ${totalUsdtRemaining.toFixed(6)} USDT`);
      console.warn(`   On-chain balance: ${onChainBalance.toFixed(6)} USDT`);
      console.warn(`   Difference: ${balanceMismatch.toFixed(6)} USDT`);
      console.warn(`   This indicates untracked transactions`);
    }
  }

  return {
    totalInvested: totalInvestedUSD,
    averageCostBasis,
    currentBalance: totalUsdtRemaining,
    transactions: incomingTxs.length,
    isTruncated,
    transactionDetails,
    fifoBalance: totalUsdtRemaining,
    balanceMismatch,
  };
}

// ── Historical ETH price fetcher ─────────────────────────────────────────────
//
// Priority:
//   1. In-memory cache   (hot, same process lifetime)
//   2. File cache        (lib/price-cache.json — survives restarts)
//   3. Hardcoded table   (verified prices for all known transaction dates)
//   4. Binance Klines    (free, no auth, ETHUSDT Aug 2017+)
//   5. CoinGecko history (may 429 on old dates)
//   6. CryptoCompare     (free tier fallback)
//   → If still 0: UI shows "Masukkan harga beli" prompt; user types manually.

// ── File-based persistent price cache ────────────────────────────────────────
const PRICE_CACHE_PATH = path.join(process.cwd(), 'lib/price-cache.json');

function loadPriceCache(): Record<string, Record<string, number>> {
  try {
    if (fs.existsSync(PRICE_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(PRICE_CACHE_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

function savePriceCache(cache: Record<string, Record<string, number>>) {
  try {
    fs.writeFileSync(PRICE_CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch {}
}

// ── Known-date price cache (YYYY-MM-DD → USD) ────────────────────────────────
// Verified closes for dates already seen in earlier runs (originally captured
// from the case-study wallet's audit logs). This is a convenience cache, NOT
// a substitute for the live fallback chain below — a wallet whose transaction
// dates aren't in this table falls through to Binance/CoinGecko/CryptoCompare
// like any other date. Do not treat zeroPriceCount=0 on a wallet as evidence
// the live fallback chain alone is sufficient unless that wallet's dates are
// absent from this table.
const ETH_HARDCODED_PRICES: Record<string, number> = {
  // From audit logs — verified prices
  '2022-11-09': 1104.17,
  '2023-01-28': 1572.46,
  '2025-05-09': 2345.32,
  '2025-12-31': 2967.53,
  // CryptoCompare-verified
  '2024-01-24': 2300,
  '2024-02-01': 2350,
  '2024-02-09': 2500,
  '2024-02-21': 2968,
  '2024-05-04': 3117,
  '2024-06-24': 3350,
  '2024-12-23': 3300,
  '2025-01-04': 3600,
  '2025-08-07': 3911,
  '2025-11-08': 3400,
};

// ── In-memory price cache (keyed by YYYY-MM-DD) ───────────────────────────────
const historicalCache = new Map<string, number>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getHistoricalEthPrice(timestamp: number): Promise<{ price: number; source: string }> {
  const now = Math.floor(Date.now() / 1000);
  if (timestamp > now) timestamp = now;
  if (timestamp < 1438214400) timestamp = 1438214400; // ETH genesis Jul 2015

  const dateStr = new Date(timestamp * 1000).toISOString().slice(0, 10);

  // ── 1. In-memory cache ────────────────────────────────────────────────────
  if (historicalCache.has(dateStr)) {
    return { price: historicalCache.get(dateStr)!, source: 'cache' };
  }

  // ── 2. File-based persistent cache ───────────────────────────────────────
  const fileCache = loadPriceCache();
  if (fileCache['ETH']?.[dateStr]) {
    const price = fileCache['ETH'][dateStr];
    historicalCache.set(dateStr, price);
    console.log(`✓ [FileCache] ETH ${dateStr}: $${price.toFixed(2)}`);
    return { price, source: 'file-cache' };
  }

  // Helper: persist a freshly fetched price to both caches
  const persist = (price: number) => {
    historicalCache.set(dateStr, price);
    if (!fileCache['ETH']) fileCache['ETH'] = {};
    fileCache['ETH'][dateStr] = price;
    savePriceCache(fileCache);
  };

  // ── 3. Hardcoded fallback table ───────────────────────────────────────────
  if (ETH_HARDCODED_PRICES[dateStr] !== undefined) {
    const price = ETH_HARDCODED_PRICES[dateStr];
    persist(price);
    console.log(`✓ [Hardcoded] ETH ${dateStr}: $${price.toFixed(2)}`);
    return { price, source: 'hardcoded' };
  }

  // ── 4. Binance Klines (ETHUSDT daily candle) ─────────────────────────────
  try {
    const startMs = timestamp * 1000;
    const url =
      `https://api.binance.com/api/v3/klines` +
      `?symbol=ETHUSDT&interval=1d&startTime=${startMs}&limit=1`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const rows: [number, string, string, string, string, ...unknown[]][] =
        await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const close = parseFloat(rows[0][4]);
        if (close > 0) {
          persist(close);
          console.log(`✓ [Binance] ETH ${dateStr}: $${close.toFixed(2)}`);
          return { price: close, source: 'binance' };
        }
      }
    } else {
      console.warn(`[Binance] skip ${dateStr}: HTTP ${res.status}`);
    }
  } catch {
    console.warn(`[Binance] skip ${dateStr}: timeout/blocked`);
  }

  // ── 5. CoinGecko /coins/ethereum/history (DD-MM-YYYY) ────────────────────
  await delay(300);
  try {
    const [year, month, day] = dateStr.split('-');
    const url =
      `https://api.coingecko.com/api/v3/coins/ethereum/history` +
      `?date=${day}-${month}-${year}&localization=false`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const price: number | undefined = data?.market_data?.current_price?.usd;
      if (price && price > 0) {
        persist(price);
        console.log(`✓ [CoinGecko] ETH ${dateStr}: $${price.toFixed(2)}`);
        return { price, source: 'coingecko' };
      }
    } else {
      console.warn(`[CoinGecko] ${res.status} for ${dateStr}`);
    }
  } catch (e) {
    console.warn(`[CoinGecko] failed for ${dateStr}:`, e);
  }

  // ── 6. CryptoCompare pricehistorical ─────────────────────────────────────
  await delay(300);
  try {
    const url =
      `https://min-api.cryptocompare.com/data/pricehistorical` +
      `?fsym=ETH&tsyms=USD&ts=${timestamp}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const price: number | undefined = data?.ETH?.USD;
      if (price && price > 0) {
        persist(price);
        console.log(`✓ [CryptoCompare] ETH ${dateStr}: $${price.toFixed(2)}`);
        return { price, source: 'cryptocompare' };
      }
    } else {
      console.warn(`[CryptoCompare] ${res.status} for ${dateStr}`);
    }
  } catch (e) {
    console.warn(`[CryptoCompare] failed for ${dateStr}:`, e);
  }

  // ── Still nothing — signal UI to prompt manual entry ─────────────────────
  console.warn(`❌ No ETH price for ${dateStr} — UI will prompt manual entry`);
  return { price: 0, source: 'missing' };
}
