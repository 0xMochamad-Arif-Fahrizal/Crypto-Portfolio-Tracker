/**
 * FIFO Audit Log — terminal + file output
 * Called once per /api/wallet/analyze request.
 *
 * Output:
 *   - console.log  (visible in Next.js dev server terminal)
 *   - /logs/fifo-audit-{timestamp}.txt  (plain-text copy, no ANSI)
 */

import fs from 'fs';
import path from 'path';

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  grey:   '\x1b[90m',
} as const;

const STRIP_ANSI = /\x1b\[[0-9;]*m/g;

// ── Data types ────────────────────────────────────────────────────────────────
export interface AuditInRow {
  lotNo: number;
  txHash: string;
  dateStr: string;
  ethAmount: number;
  pricePerEth: number;   // effective price used for cost basis
  priceSource: string;   // 'binance' | 'coingecko' | 'cryptocompare' | 'hardcoded' | 'manual' | 'missing'
  costBasisUSD: number;
}

export interface AuditOutRow {
  txHash: string;
  dateStr: string;
  ethAmount: number;
  type: 'OUT' | 'GAS';
  lotsConsumed: string;  // e.g. "#1(0.5 ETH) #2(0.1 ETH)"
}

export interface AuditReconciliation {
  /** 'FIFO-UNTRACKED-OUT': FIFO balance too HIGH vs on-chain (untracked
   *  outflow) — consumes the shortfall oldest-lot-first, preserving per-lot
   *  price traceability.
   *  'UNDER-COUNTED-INFLOW-DETECTED': the opposite case — FIFO balance too
   *  LOW vs on-chain (untracked inflow). Detected and reported only; no lot
   *  is fabricated since the missing value's price/origin are unknown.
   *  'WAC' is the legacy blended-price method, kept only so old audit data
   *  can still be rendered. */
  method: 'FIFO-UNTRACKED-OUT' | 'UNDER-COUNTED-INFLOW-DETECTED' | 'WAC' | 'none';
  fifoBeforeReconcile: number;
  onChainBalance: number;
  wac: number;           // informational: cost basis / balance before reconciliation
  scaleFactor: number;
  adjustedCostBasis: number;
}

export interface AuditSummary {
  address: string;
  generatedAt: string;
  totalGasEth: number;
  totalEthIn: number;
  totalEthOut: number;
  totalCostBasisUSD: number;    // cost basis of remaining ETH
  currentEthBalance: number;    // on-chain
  currentEthPriceUSD: number;   // live price used for valuation
  currentValueUSD: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  zeroPriceCount: number;
  unmatchedOutEth: number;
  reconciliation?: AuditReconciliation;
  inRows: AuditInRow[];
  outRows: AuditOutRow[];
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function pad(s: string | number, w: number, right = false): string {
  const str = String(s);
  if (str.length >= w) return str.slice(0, w);
  const pad = ' '.repeat(w - str.length);
  return right ? pad + str : str + pad;
}

function rpad(s: string | number, w: number): string { return pad(s, w, true); }
function lpad(s: string | number, w: number): string { return pad(s, w, false); }

function hrule(widths: number[], corner = '+', line = '-'): string {
  return corner + widths.map(w => line.repeat(w + 2)).join(corner) + corner;
}

function row(cells: string[], widths: number[]): string {
  return '| ' + cells.map((c, i) => lpad(c, widths[i])).join(' | ') + ' |';
}

// ── Build the full report as an array of lines ────────────────────────────────
function buildLines(s: AuditSummary, ansi: boolean): string[] {
  const g = (str: string) => ansi ? C.green  + str + C.reset : str;
  const r = (str: string) => ansi ? C.red    + str + C.reset : str;
  const y = (str: string) => ansi ? C.yellow + str + C.reset : str;
  const c = (str: string) => ansi ? C.cyan   + str + C.reset : str;
  const b = (str: string) => ansi ? C.bold   + str + C.reset : str;
  const gr = (str: string) => ansi ? C.grey   + str + C.reset : str;

  const lines: string[] = [];
  const push = (...args: string[]) => lines.push(...args);

  // ── Header ────────────────────────────────────────────────────────────────
  push('');
  push(b('╔══════════════════════════════════════════════════════════════════╗'));
  push(b('║            FIFO COST BASIS AUDIT REPORT                         ║'));
  push(b('╚══════════════════════════════════════════════════════════════════╝'));
  push(`  Wallet : ${c(s.address)}`);
  push(`  Date   : ${s.generatedAt}`);
  push('');

  // ── Incoming table ────────────────────────────────────────────────────────
  push(b('┌─ INCOMING ETH LOTS ─────────────────────────────────────────────'));
  const inW = [4, 12, 13, 11, 11, 14, 13];
  const inHdr = ['Lot#', 'Tx Hash', 'Date', 'ETH Amt', 'Price', 'Source', 'Cost (USD)'];
  push(hrule(inW));
  push(row(inHdr, inW));
  push(hrule(inW, '+', '='));

  for (const r_ of s.inRows) {
    const hash = r_.txHash.slice(0, 8) + '…' + r_.txHash.slice(-4);
    const isMissing = r_.priceSource === 'missing';
    const priceStr = isMissing ? '????' : `$${r_.pricePerEth.toFixed(0)}`;
    const costStr  = isMissing ? '????' : `$${r_.costBasisUSD.toFixed(2)}`;
    const cells = [
      String(r_.lotNo),
      hash,
      r_.dateStr,
      r_.ethAmount.toFixed(4),
      priceStr,
      r_.priceSource,
      costStr,
    ];
    const coloured = isMissing
      ? y(row(cells, inW))
      : row(cells, inW);
    push(coloured);
  }
  push(hrule(inW));

  const totalInCost = s.inRows.reduce((acc, r_) => acc + r_.costBasisUSD, 0);
  push(
    row([
      'TOTAL',
      '',
      '',
      s.totalEthIn.toFixed(4),
      '',
      '',
      `$${totalInCost.toFixed(2)}`,
    ], inW)
  );
  push(hrule(inW));
  push('');

  // ── Outgoing table ────────────────────────────────────────────────────────
  push(b('┌─ OUTGOING / GAS ────────────────────────────────────────────────'));
  const outW = [12, 13, 9, 5, 30];
  const outHdr = ['Tx Hash', 'Date', 'ETH Amt', 'Type', 'Lots Consumed'];
  push(hrule(outW));
  push(row(outHdr, outW));
  push(hrule(outW, '+', '='));

  for (const r_ of s.outRows) {
    const hash = r_.txHash.slice(0, 10) + '…' + r_.txHash.slice(-6);
    const cells = [
      hash,
      r_.dateStr,
      r_.ethAmount.toFixed(6),
      r_.type,
      r_.lotsConsumed || '—',
    ];
    push(r_.type === 'GAS' ? gr(row(cells, outW)) : row(cells, outW));
  }
  push(hrule(outW));
  push(
    row([
      'TOTAL OUT',
      '',
      s.totalEthOut.toFixed(6),
      '',
      `GAS: ${s.totalGasEth.toFixed(6)} ETH`,
    ], outW)
  );
  push(hrule(outW));
  push('');

  // ── FIFO Reconciliation ───────────────────────────────────────────────────
  push(b('┌─ FIFO RECONCILIATION ───────────────────────────────────────────'));
  if (s.reconciliation && s.reconciliation.method === 'FIFO-UNTRACKED-OUT') {
    const rec = s.reconciliation;
    push(`  Method      : ${y('FIFO consumption of untracked outflow (oldest lot first)')}`);
    push(`  FIFO total  : ${rec.fifoBeforeReconcile.toFixed(6)} ETH`);
    push(`  On-chain    : ${rec.onChainBalance.toFixed(6)} ETH`);
    push(`  Consumed    : ${y((rec.fifoBeforeReconcile - rec.onChainBalance).toFixed(6))} ETH (untracked bridge/internal txs, removed oldest-lot-first)`);
    push(`  Adj cost    : $${rec.adjustedCostBasis.toFixed(2)}`);
    push(`  ${gr('Surviving lots keep their original per-unit price — traceable to source tx.')}`);
  } else if (s.reconciliation && s.reconciliation.method === 'UNDER-COUNTED-INFLOW-DETECTED') {
    const rec = s.reconciliation;
    push(`  Method      : ${r('Under-counted inflow DETECTED — not auto-corrected')}`);
    push(`  FIFO total  : ${rec.fifoBeforeReconcile.toFixed(6)} ETH`);
    push(`  On-chain    : ${rec.onChainBalance.toFixed(6)} ETH`);
    push(`  Missing     : ${r((rec.onChainBalance - rec.fifoBeforeReconcile).toFixed(6))} ETH received via a channel not captured by Etherscan's txlist/txlistinternal`);
    push(`  ${gr('No lot fabricated — origin and price of the missing ETH are unknown. Cost basis below is understated by this amount.')}`);
  } else if (s.reconciliation && s.reconciliation.method === 'WAC') {
    // Legacy path — kept only so previously-generated audit data still renders.
    const rec = s.reconciliation;
    push(`  Method      : ${y('Weighted Average Cost (WAC) — legacy')}`);
    push(`  FIFO total  : ${rec.fifoBeforeReconcile.toFixed(6)} ETH`);
    push(`  On-chain    : ${rec.onChainBalance.toFixed(6)} ETH`);
    push(`  Mismatch    : ${y((rec.fifoBeforeReconcile - rec.onChainBalance).toFixed(6))} ETH (untracked bridge/internal txs)`);
    push(`  WAC         : $${rec.wac.toFixed(2)} / ETH`);
    push(`  Scale factor: ${rec.scaleFactor.toFixed(6)}`);
    push(`  Adj cost    : $${rec.adjustedCostBasis.toFixed(2)}`);
  } else {
    push(g('  FIFO balance matches on-chain — no reconciliation needed.'));
  }
  push('');

  // ── Final P&L ─────────────────────────────────────────────────────────────
  push(b('┌─ FINAL P&L SUMMARY ─────────────────────────────────────────────'));
  const pnlSign = s.unrealizedPnL >= 0 ? '+' : '';
  const pnlStr  = `${pnlSign}$${s.unrealizedPnL.toFixed(2)} (${pnlSign}${s.unrealizedPnLPct.toFixed(1)}%)`;
  push(`  ETH balance    : ${s.currentEthBalance.toFixed(6)} ETH`);
  push(`  Current price  : $${s.currentEthPriceUSD.toFixed(2)}`);
  push(`  Current value  : $${s.currentValueUSD.toFixed(2)}`);
  push(`  Cost basis     : $${s.totalCostBasisUSD.toFixed(2)}`);
  push(`  Unrealized P&L : ${s.unrealizedPnL >= 0 ? g(pnlStr) : r(pnlStr)}`);
  push('');

  // ── Warnings ──────────────────────────────────────────────────────────────
  const warnings: string[] = [];
  if (s.zeroPriceCount > 0)
    warnings.push(`${s.zeroPriceCount} transaction(s) with MISSING historical price — cost basis understated`);
  if (s.unmatchedOutEth > 0.0001)
    warnings.push(`${s.unmatchedOutEth.toFixed(6)} ETH sold with no tracked cost basis — data incomplete`);
  if (s.reconciliation?.method === 'FIFO-UNTRACKED-OUT' || s.reconciliation?.method === 'WAC')
    warnings.push(`Untracked-outflow reconciliation applied (${s.reconciliation.method}) — ${(s.reconciliation.fifoBeforeReconcile - s.reconciliation.onChainBalance).toFixed(6)} ETH untracked`);
  if (s.reconciliation?.method === 'UNDER-COUNTED-INFLOW-DETECTED')
    warnings.push(`Under-counted inflow detected — ${(s.reconciliation.onChainBalance - s.reconciliation.fifoBeforeReconcile).toFixed(6)} ETH received via an untracked channel, NOT auto-corrected`);

  if (warnings.length > 0) {
    push(b('┌─ DATA QUALITY WARNINGS ─────────────────────────────────────────'));
    for (const w of warnings) push(`  ${y('⚠')}  ${w}`);
    push('');
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  push(gr('══════════════════════════════════════════════════════════════════'));
  push(gr('  End of FIFO Audit Report'));
  push(gr('══════════════════════════════════════════════════════════════════'));
  push('');

  return lines;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Print the audit to the Next.js server terminal with ANSI colour. */
export function printFifoAudit(summary: AuditSummary): void {
  const lines = buildLines(summary, true);
  console.log(lines.join('\n'));
}

/** Write a plain-text (no ANSI) copy to /logs/fifo-audit-{ts}.txt. */
export async function writeAuditFile(summary: AuditSummary): Promise<string | null> {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(logsDir, `fifo-audit-${ts}.txt`);

    const lines = buildLines(summary, false);
    const plain = lines.map(l => l.replace(STRIP_ANSI, '')).join('\n');

    fs.writeFileSync(filePath, plain, 'utf8');
    console.log(`[Audit] Saved → ${filePath}`);
    return filePath;
  } catch (e) {
    console.warn('[Audit] Could not write file:', e);
    return null;
  }
}
