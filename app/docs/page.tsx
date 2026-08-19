import MarketingHeader from '@/components/ui/MarketingHeader';
import MarketingFooter from '@/components/ui/MarketingFooter';
import type { ReactNode } from 'react';

const TOC_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'build', label: 'How This Was Built' },
  { id: 'manual-portfolio', label: 'Manual Portfolio' },
  { id: 'wallet', label: 'Wallet Integration' },
  { id: 'fifo', label: 'FIFO Engine' },
  { id: 'price-data', label: 'Price Data' },
  { id: 'design-decisions', label: 'Design Decisions' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'academic-context', label: 'Academic Context' },
];

const GITHUB_URL = 'https://github.com/0xMochamad-Arif-Fahrizal/Crypto-Portfolio-Tracker';

function Section({ id, title, children, divider = true }: { id: string; title: string; children: ReactNode; divider?: boolean }) {
  return (
    <section id={id} style={{ paddingTop: 44, paddingBottom: 44, borderTop: divider ? '1px solid var(--border)' : 'none', scrollMarginTop: 88 }}>
      <div className="cf-section-title" style={{ marginBottom: 20 }}>{title}</div>
      <div style={{ maxWidth: 720 }}>{children}</div>
    </section>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, lineHeight: 1.6, color: 'var(--ink)', margin: '0 0 20px', letterSpacing: '-0.01em' }}>{children}</p>;
}

function P({ children }: { children: ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)', margin: '0 0 16px' }}>{children}</p>;
}

function SubHead({ children }: { children: ReactNode }) {
  return <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '24px 0 10px', letterSpacing: '-0.01em' }}>{children}</h3>;
}

function Code({ children }: { children: ReactNode }) {
  return <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px', color: 'var(--ink)' }}>{children}</code>;
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>
          <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: '50%', background: 'var(--ink-3)', marginTop: 9 }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', gap: 14 }}>
          <span className="cf-num" style={{ flexShrink: 0, fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.08em', marginTop: 2, minWidth: 22 }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)' }}>{it}</span>
        </li>
      ))}
    </ol>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="cf-card" style={{ padding: '16px 18px' }}>
      <div className="cf-num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{value}</div>
      <div className="cf-ticker" style={{ color: 'var(--ink-3)' }}>{label}</div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <MarketingHeader />

      {/* PageHero */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, transparent 35%, var(--bg) 80%)' }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '72px 24px 56px' }}>
          <div className="cf-section-title" style={{ marginBottom: 18 }}>Documentation</div>
          <h1 className="cf-h1" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-0.03em', fontWeight: 600 }}>
            Documentation
          </h1>
          <p className="cf-body cf-muted" style={{ margin: '16px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.5 }}>
            Everything you need to track a portfolio across exchanges and on-chain wallets: manual entry, read-only wallets, the FIFO cost-basis engine, and how the whole system was actually built.
          </p>
        </div>
      </section>

      {/* DocBody with sidebar */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px' }}>
        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-8 md:gap-14" style={{ alignItems: 'start' }}>
          {/* TOC Sidebar — horizontal chip row on mobile, sticky vertical list on desktop */}
          <aside className="static md:sticky md:top-[88px] md:self-start pt-0 md:pt-11">
            <nav className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 md:flex-col md:items-stretch md:gap-0.5">
              <div className="cf-section-title w-full md:w-auto mb-0 md:mb-3.5" style={{ color: 'var(--ink-3)' }}>On this page</div>
              {TOC_SECTIONS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, lineHeight: 1.4, padding: '6px 0', color: 'var(--ink-2)', textDecoration: 'none' }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div>
            <Section id="getting-started" title="Getting Started" divider={false}>
              <Lead>Three steps to a complete picture of your holdings, no wallet connection required.</Lead>
              <Steps items={[
                <span key={0}><strong style={{ color: 'var(--ink)' }}>Create an account.</strong> Sign up with an email address. Authentication is handled by Firebase Auth. No password is ever stored in plain text.</span>,
                <span key={1}><strong style={{ color: 'var(--ink)' }}>Add manual assets.</strong> Log the coins you hold on exchanges by hand: symbol, amount, and average buy price. These power your cost basis and P&L.</span>,
                <span key={2}><strong style={{ color: 'var(--ink)' }}>Paste a wallet address.</strong> Drop a public Ethereum or Solana address on the Wallet page. Balances are fetched live. You never connect a wallet or sign anything.</span>,
              ]} />
              <P>Once both sources are in place, the <Code>Integrated</Code> view merges them into a single total with one combined P&L figure.</P>
            </Section>

            <Section id="build" title="How This Was Built">
              <Lead>CryptoFolio started as an undergraduate thesis (skripsi) asking a narrow question: can FIFO cost basis be reconstructed from public blockchain data alone, without relying on an exchange&apos;s exported trade history?</Lead>
              <P>Most portfolio trackers solve fragmentation by asking you to type every trade in by hand, or by connecting directly to an exchange account. Neither works once assets move off-exchange into a self-custody wallet: the exchange no longer knows what you did with the coins, and there&apos;s no CSV export for on-chain activity. CryptoFolio&apos;s approach is to combine manual entry for off-chain holdings with direct, read-only reconstruction of cost basis from a wallet&apos;s own transaction history.</P>

              <SubHead>Stack</SubHead>
              <Bullets items={[
                <span key={0}><strong style={{ color: 'var(--ink)' }}>Frontend</strong>: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Recharts for charts.</span>,
                <span key={1}><strong style={{ color: 'var(--ink)' }}>Accounts &amp; storage</strong>: Firebase Authentication and Cloud Firestore, with per-user data isolation.</span>,
                <span key={2}><strong style={{ color: 'var(--ink)' }}>On-chain reads</strong>: Alchemy for Ethereum mainnet RPC, Helius for Solana mainnet RPC, Etherscan API v2 for Ethereum transaction history.</span>,
                <span key={3}><strong style={{ color: 'var(--ink)' }}>Prices</strong>: CoinGecko as primary source, with Binance and CryptoCompare as fallbacks (see Price Data below).</span>,
                <span key={4}><strong style={{ color: 'var(--ink)' }}>Hosting</strong>: deployed on Vercel.</span>,
              ]} />

              <SubHead>Validating the FIFO engine against a real wallet</SubHead>
              <P>To check whether the lot-matching logic actually reconstructs cost basis correctly, and not just plausibly, the engine was run against a real, public Ethereum wallet and the result was compared against ground truth read directly from the chain.</P>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ margin: '4px 0 16px' }}>
                <StatCard value="0x742d…f0bEb" label="Test wallet (public address)" />
                <StatCard value="Δ ≈ 1.46 × 10⁻⁹ ETH" label="Reconstructed vs. on-chain balance" />
              </div>
              <P>The engine replayed every incoming and outgoing transaction for that address, priced each incoming transfer at its historical rate, and summed whatever lots remained open. That reconstructed balance was then compared against the wallet&apos;s actual balance read live from the chain. The gap between the two, about 1.46 billionths of one ETH, sits well inside floating-point rounding error, not a sign of missing transactions. This same reconciliation check (see <Code>fifoBalance vs. onChainBalance</Code> under FIFO Engine below) runs for every wallet you analyze, not just this one test case, so a large mismatch on your own wallet is a signal something upstream (usually an unindexed internal transfer) was missed.</P>

              <SubHead>Repository</SubHead>
              <P>
                The full source is public on GitHub:{' '}
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                  {GITHUB_URL.replace('https://', '')}
                </a>.
              </P>
            </Section>

            <Section id="manual-portfolio" title="Manual Portfolio">
              <P>The manual portfolio is for assets held off-chain: on a centralized exchange, a hardware wallet you don&apos;t want to expose, or anywhere CryptoFolio can&apos;t read directly.</P>
              <SubHead>Adding an asset</SubHead>
              <P>Open <Code>Portfolio</Code> and choose <Code>+ Add Asset</Code>. Enter the coin&apos;s identifier, the amount you hold, and your average buy price in USD. The total invested is computed for you and used as the cost basis.</P>
              <SubHead>Editing &amp; deleting</SubHead>
              <Bullets items={[
                'Each row in the portfolio table has a remove action: deleting an asset removes it from every view immediately.',
                'To adjust holdings or cost basis, delete the row and re-add it with the corrected figures.',
                'Manual assets are stored per-user in Firestore and never leave your account.',
              ]} />
              <SubHead>Supported symbols</SubHead>
              <P>Any coin listed on CoinGecko is supported. Use the CoinGecko identifier (for example <Code>bitcoin</Code>, <Code>ethereum</Code>, <Code>solana</Code>) so live prices resolve correctly. Tickers like <Code>BTC</Code> are shown in the UI but the identifier is what links to the price feed.</P>
            </Section>

            <Section id="wallet" title="Wallet Integration">
              <Lead>Read-only. Ethereum mainnet and Solana mainnet. Nothing to sign.</Lead>
              <P>CryptoFolio reads on-chain balances from a public address you paste. There is no wallet connection, no transaction signing, and no access to private keys at any point.</P>
              <Bullets items={[
                <span key={0}><strong style={{ color: 'var(--ink)' }}>Ethereum mainnet</strong>: ETH and USDT balances, plus full transaction history for FIFO cost-basis analysis.</span>,
                <span key={1}><strong style={{ color: 'var(--ink)' }}>Solana mainnet</strong>: SOL balance only (see Limitations).</span>,
                'Addresses are validated before saving: ETH must be 0x followed by 40 hex characters; SOL must be base58, 32–44 characters.',
                'Saved addresses feed the Dashboard and Integrated views automatically and refresh on their own.',
              ]} />
              <P>You can keep multiple addresses in the <Code>Address Book</Code> and mark one ETH and one SOL address as active at a time.</P>
            </Section>

            <Section id="fifo" title="FIFO Engine">
              <Lead>First In, First Out: your earliest purchases are sold first when computing cost basis.</Lead>
              <P>For an Ethereum wallet, CryptoFolio replays every transaction in chronological order. Incoming transfers open <em>lots</em> at the historical price on the day they arrived; outgoing transfers consume the oldest open lots first. Gas paid on outgoing transactions is drained from the same queue, using the same oldest-first logic, since it&apos;s ETH leaving the wallet just like a transfer. Whatever lots remain open determine your current cost basis.</P>

              <SubHead>How historical prices are fetched</SubHead>
              <P>Each incoming transaction is priced at the asset&apos;s market rate on its exact timestamp. Resolving that price checks, in order: an in-memory cache for the current session, an on-disk cache that survives restarts, a small table of dates already verified in earlier runs, then a live fallback chain of Binance&apos;s historical klines, CoinGecko&apos;s per-day history endpoint, and finally CryptoCompare. Outgoing transactions reduce quantity but don&apos;t need a price of their own.</P>

              <SubHead>Balance reconciliation</SubHead>
              <P>After processing every transaction, the engine sums the ETH left in open lots and compares that figure against the wallet&apos;s real balance read live from the chain. A mismatch under roughly 10⁻⁶ ETH indicates an accurate reconstruction; a mismatch above 10⁻³ ETH usually means a transaction type Etherscan didn&apos;t surface in the standard list (an internal transfer, for instance) is missing from the replay. See How This Was Built above for a worked example on a real wallet.</P>

              <SubHead>&quot;Harga Missing&quot;: what it means</SubHead>
              <P>If a historical price can&apos;t be retrieved for an incoming transaction even after the full fallback chain runs out, the transaction is flagged <Code>Harga Missing</Code> (price missing). Its lot is held open but priced at zero, which understates your cost basis.</P>
              <P>To resolve it, open the transaction in the Integrated view and enter the price manually. Your override is saved to your browser&apos;s local storage against your account, applied to that lot&apos;s remaining quantity, and persists across page refreshes on that device.</P>
            </Section>

            <Section id="price-data" title="Price Data">
              <Lead>Prices move through a layered fallback chain, so one provider having a bad day never means a blank number.</Lead>
              <Bullets items={[
                <span key={0}><strong style={{ color: 'var(--ink)' }}>CoinGecko (primary)</strong>: live price, market cap, and 24-hour volume for the whole watchlist in one batch call, throttled to one real request per 30 seconds per coin set.</span>,
                <span key={1}><strong style={{ color: 'var(--ink)' }}>Fallback, per coin, if CoinGecko is unavailable</strong>: stablecoins resolve to a flat $1.00; everything else tries Binance&apos;s public spot price, then CryptoCompare, then the last known price still held in memory.</span>,
                'The Dashboard, Portfolio, and Integrated views all refresh automatically on a 60-second interval.',
                'All figures are denominated in USD.',
              ]} />
            </Section>

            <Section id="design-decisions" title="Design Decisions">
              <P>A few choices that shaped the system, and why they were made this way.</P>

              <SubHead>Why polling, not WebSockets</SubHead>
              <P>CoinGecko&apos;s free tier only allows a handful of calls per minute, which makes a persistent streaming connection impractical without a paid plan. Polling every 60 seconds is simpler to reason about, doesn&apos;t need reconnection handling, and a portfolio&apos;s total value doesn&apos;t meaningfully change faster than that for the kind of monitoring this tool is built for.</P>

              <SubHead>Why read-only</SubHead>
              <P>CryptoFolio never asks for a private key or seed phrase, and never signs a transaction. That removes an entire category of attack surface (key theft, malicious approval requests) and means you never have to trust the app with anything beyond a public address. It is a viewer, not a transaction executor.</P>

              <SubHead>Why FIFO</SubHead>
              <P>FIFO was chosen over alternatives like LIFO or average cost because many tax jurisdictions default to it for capital gains, it&apos;s deterministic (the same transaction history always produces the same result), and the lot-by-lot matching can be traced and audited step by step, which mattered for a thesis that needed to demonstrate its own correctness.</P>
            </Section>

            <Section id="limitations" title="Limitations">
              <P>CryptoFolio is a monitoring tool with a deliberately narrow scope. Known constraints:</P>
              <Bullets items={[
                'On-chain cost-basis analysis (FIFO) is available for the Ethereum wallet only, and only for ETH and USDT: other ERC-20 tokens aren’t yet supported.',
                'The Solana wallet shows balance only: no transaction history and no FIFO cost basis.',
                'Only incoming and outgoing transfers are read: DEX trades, staking, and other smart-contract interactions aren’t parsed.',
                'Internal transfers, mining or block rewards, and cross-chain bridge transfers aren’t automatically reconciled and may need a manual price override.',
                'Historical prices depend on third-party APIs and may still be missing for some dates (see "Harga Missing"). On wallets with thousands of transactions, the price-lookup chain can be exhausted for the large majority of dates, leaving most lots at zero cost basis until corrected manually.',
                'All values are displayed in USD only: no alternate fiat currencies.',
                'There is no hard cap on transaction count: full history is fetched and processed for every wallet.',
                'A first-time FIFO analysis on a small wallet typically takes 30 to 60 seconds; wallets with thousands of transactions can take a few minutes while historical prices resolve.',
              ]} />
            </Section>

            <Section id="academic-context" title="Academic Context">
              <Lead>This is a research project, not a commercial product.</Lead>
              <P>CryptoFolio supports undergraduate research into automated cost-basis reconstruction from public blockchain data, exploring whether FIFO-based reporting is feasible without relying on centralized exchange records. The codebase is built to be reproducible (documented setup and dependencies), extensible (new chains or assets can be added without restructuring the core), and educational (the FIFO logic is written to be readable, not just correct).</P>
              <P>The project is MIT licensed and the source is public on GitHub. It is academic software, not a production financial tool: no warranty is provided regarding tax accuracy, and figures shown should be independently verified before being used for any filing or financial decision.</P>
            </Section>
          </div>
        </div>
      </div>

      <MarketingFooter current="docs" />
    </div>
  );
}
