import MarketingHeader from '@/components/ui/MarketingHeader';
import MarketingFooter from '@/components/ui/MarketingFooter';
import type { ReactNode } from 'react';

const TOC_SECTIONS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'manual-portfolio', label: 'Manual Portfolio' },
  { id: 'wallet', label: 'Wallet Integration' },
  { id: 'fifo', label: 'FIFO Engine' },
  { id: 'price-data', label: 'Price Data' },
  { id: 'limitations', label: 'Limitations' },
];

function Section({ id, title, children, divider = true }: { id: string; title: string; children: ReactNode; divider?: boolean }) {
  return (
    <section id={id} style={{ paddingTop: 44, paddingBottom: 44, borderTop: divider ? '1px solid var(--border)' : 'none', scrollMarginTop: 88 }}>
      <div className="cf-section-title" style={{ marginBottom: 20 }}>— {title}</div>
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

export default function DocsPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <MarketingHeader />

      {/* PageHero */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, transparent 35%, var(--bg) 80%)' }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '72px 24px 56px' }}>
          <div className="cf-section-title" style={{ marginBottom: 18 }}>— Documentation</div>
          <h1 className="cf-h1" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-0.03em', fontWeight: 600 }}>
            Documentation
          </h1>
          <p className="cf-body cf-muted" style={{ margin: '16px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.5 }}>
            Everything you need to track a portfolio across exchanges and on-chain wallets — manual entry, read-only wallets, and the FIFO cost-basis engine.
          </p>
        </div>
      </section>

      {/* DocBody with sidebar */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 56, alignItems: 'start' }}>
          {/* TOC Sidebar */}
          <aside style={{ position: 'sticky', top: 88, alignSelf: 'start', paddingTop: 44 }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div className="cf-section-title" style={{ marginBottom: 14, color: 'var(--ink-3)' }}>On this page</div>
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
              <Lead>Three steps to a complete picture of your holdings — no wallet connection required.</Lead>
              <Steps items={[
                <span key={0}><strong style={{ color: 'var(--ink)' }}>Create an account.</strong> Sign up with an email address. Authentication is handled by Firebase Auth — no password is ever stored in plain text.</span>,
                <span key={1}><strong style={{ color: 'var(--ink)' }}>Add manual assets.</strong> Log the coins you hold on exchanges by hand: symbol, amount, and average buy price. These power your cost basis and P&L.</span>,
                <span key={2}><strong style={{ color: 'var(--ink)' }}>Paste a wallet address.</strong> Drop a public Ethereum or Solana address on the Wallet page. Balances are fetched live — you never connect a wallet or sign anything.</span>,
              ]} />
              <P>Once both sources are in place, the <Code>Integrated</Code> view merges them into a single total with one combined P&L figure.</P>
            </Section>

            <Section id="manual-portfolio" title="Manual Portfolio">
              <P>The manual portfolio is for assets held off-chain — on a centralized exchange, a hardware wallet you don&apos;t want to expose, or anywhere CryptoFolio can&apos;t read directly.</P>
              <SubHead>Adding an asset</SubHead>
              <P>Open <Code>Portfolio</Code> and choose <Code>+ Add Asset</Code>. Enter the coin&apos;s identifier, the amount you hold, and your average buy price in USD. The total invested is computed for you and used as the cost basis.</P>
              <SubHead>Editing &amp; deleting</SubHead>
              <Bullets items={[
                'Each row in the portfolio table has a remove action — deleting an asset removes it from every view immediately.',
                'To adjust holdings or cost basis, delete the row and re-add it with the corrected figures.',
                'Manual assets are stored per-user in Firestore and never leave your account.',
              ]} />
              <SubHead>Supported symbols</SubHead>
              <P>Any coin listed on CoinGecko is supported. Use the CoinGecko identifier (for example <Code>bitcoin</Code>, <Code>ethereum</Code>, <Code>solana</Code>) so live prices resolve correctly. Tickers like <Code>BTC</Code> are shown in the UI but the identifier is what links to the price feed.</P>
            </Section>

            <Section id="wallet" title="Wallet Integration">
              <Lead>Read-only. Ethereum mainnet and Solana mainnet. Nothing to sign.</Lead>
              <P>CryptoFolio reads on-chain balances from a public address you paste — there is no wallet connection, no transaction signing, and no access to private keys at any point.</P>
              <Bullets items={[
                <span key={0}><strong style={{ color: 'var(--ink)' }}>Ethereum mainnet</strong> — ETH and USDT balances, plus full transaction history for FIFO cost-basis analysis.</span>,
                <span key={1}><strong style={{ color: 'var(--ink)' }}>Solana mainnet</strong> — SOL balance only (see Limitations).</span>,
                'Addresses are validated before saving: ETH must be 0x followed by 40 hex characters; SOL must be base58, 32–44 characters.',
                'Saved addresses feed the Dashboard and Integrated views automatically and refresh on their own.',
              ]} />
              <P>You can keep multiple addresses in the <Code>Address Book</Code> and mark one ETH and one SOL address as active at a time.</P>
            </Section>

            <Section id="fifo" title="FIFO Engine">
              <Lead>First In, First Out — your earliest purchases are sold first when computing cost basis.</Lead>
              <P>For an Ethereum wallet, CryptoFolio replays every transaction in chronological order. Incoming transfers open <em>lots</em> at the historical price on the day they arrived; outgoing transfers consume the oldest open lots first. Whatever lots remain open determine your current cost basis.</P>
              <SubHead>How historical prices are fetched</SubHead>
              <P>Each incoming transaction is priced using the asset&apos;s market price at the transaction timestamp, pulled from the price providers below. Outgoing transactions reduce quantity but do not need a price — only the open lots that survive contribute to cost basis.</P>
              <SubHead>&quot;Harga Missing&quot; — what it means</SubHead>
              <P>If a historical price can&apos;t be retrieved for an incoming transaction — usually because the third-party API has no data for that exact day — the transaction is flagged <Code>Harga Missing</Code> (price missing). Its lot is held open but priced at zero, which understates your cost basis.</P>
              <P>To resolve it, open the transaction in the Integrated view and enter the price manually. Your override is applied to that lot&apos;s remaining quantity and persists locally, so refreshing the page keeps your correction.</P>
            </Section>

            <Section id="price-data" title="Price Data">
              <P>Live and historical prices come from third-party providers, queried in order of preference.</P>
              <Bullets items={[
                <span key={0}><strong style={{ color: 'var(--ink)' }}>CoinGecko</strong> — primary source for live prices, market cap, and 24-hour volume.</span>,
                <span key={1}><strong style={{ color: 'var(--ink)' }}>CryptoCompare</strong> — fallback when CoinGecko is unavailable or rate-limited.</span>,
                'Prices refresh automatically every 60 seconds across the Dashboard, Portfolio, and Integrated views.',
                'All figures are denominated in USD.',
              ]} />
            </Section>

            <Section id="limitations" title="Limitations">
              <P>CryptoFolio is a monitoring tool with a deliberately narrow scope. Known constraints:</P>
              <Bullets items={[
                'On-chain cost-basis analysis (FIFO) is available for the Ethereum wallet only.',
                'The Solana wallet shows balance only — no transaction history and no FIFO cost basis.',
                'Historical prices depend on third-party APIs and may be missing for some dates (see "Harga Missing").',
                'All values are displayed in USD only — no alternate fiat currencies.',
                'Each wallet fetch is capped at roughly 100 transactions; very active wallets may show a truncation warning.',
              ]} />
            </Section>
          </div>
        </div>
      </div>

      <MarketingFooter current="docs" />
    </div>
  );
}
