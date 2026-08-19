import MarketingHeader from '@/components/ui/MarketingHeader';
import MarketingFooter from '@/components/ui/MarketingFooter';
import type { ReactNode } from 'react';

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

function Code({ children }: { children: ReactNode }) {
  return <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px', color: 'var(--ink)' }}>{children}</code>;
}

function DefRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 180px', fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', fontWeight: 500 }}>{term}</div>
      <div style={{ flex: '1 1 320px', fontFamily: 'var(--font-sans)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{children}</div>
    </div>
  );
}

const MailLink = () => (
  <a href="mailto:designbyripo@gmail.com" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'var(--font-mono)', fontSize: '0.95em' }}>
    designbyripo@gmail.com
  </a>
);

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <MarketingHeader />

      {/* PageHero */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, transparent 35%, var(--bg) 80%)' }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '72px 24px 56px' }}>
          <div className="cf-section-title" style={{ marginBottom: 18 }}>Privacy Policy</div>
          <h1 className="cf-h1" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-0.03em', fontWeight: 600 }}>
            Privacy Policy
          </h1>
          <p className="cf-body cf-muted" style={{ margin: '16px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.5 }}>
            What CryptoFolio collects, what it deliberately never touches, and how to remove your data.
          </p>
          <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 22 }}>Effective June 2026</div>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px' }}>
        <Section id="collect" title="What We Collect" divider={false}>
          <Lead>The minimum needed to track a portfolio, nothing more.</Lead>
          <Bullets items={[
            <span key={0}><strong style={{ color: 'var(--ink)' }}>Email address</strong>: used for sign-in via Firebase Authentication.</span>,
            <span key={1}><strong style={{ color: 'var(--ink)' }}>Username</strong>: the display name you choose at registration, shown back to you in the app instead of your email.</span>,
            <span key={2}><strong style={{ color: 'var(--ink)' }}>Manually entered portfolio data</strong>: the assets, amounts, and buy prices you log, stored in Firebase Firestore against your account.</span>,
            <span key={3}><strong style={{ color: 'var(--ink)' }}>Public blockchain addresses</strong>: the ETH and Solana addresses you paste, read-only. We never request or receive private keys.</span>,
          ]} />
        </Section>

        <Section id="not-collect" title="What We Do NOT Collect">
          <P>CryptoFolio never collects, requests, or stores any of the following:</P>
          <Bullets items={[
            'Private keys',
            'Seed phrases or recovery mnemonics',
            'Passwords stored in plain text',
            'Payment or card information',
            'Government ID, address, or other identity documents',
          ]} />
        </Section>

        <Section id="storage" title="How Data Is Stored">
          <P>Your data lives in <strong style={{ color: 'var(--ink)' }}>Firebase</strong>, running on Google Cloud infrastructure, and is secured by Firebase Authentication. Access is scoped to your account: portfolio and wallet data are readable only by you. The exact data-center region is determined by the underlying Firebase project configuration.</P>
        </Section>

        <Section id="local-storage" title="Local Storage on Your Device">
          <P>When a historical price can&apos;t be resolved automatically for an on-chain transaction (see <Code>Harga Missing</Code> in the Docs), you can enter it manually. That correction is saved in your browser&apos;s local storage, keyed to your account, on that device only. It is not synced to Firestore or any other server, so it won&apos;t follow you to a different browser or device, and it&apos;s cleared if you clear that browser&apos;s site data.</P>
          <P>Firebase Authentication also uses your browser&apos;s local storage (not cookies) to keep you signed in between visits. CryptoFolio does not use third-party advertising or tracking cookies.</P>
        </Section>

        <Section id="third-party" title="Third-Party Services">
          <P>To show prices and on-chain balances, CryptoFolio calls the services below. These providers may log the public blockchain addresses included in requests, per their own privacy policies.</P>
          <div style={{ marginTop: 8 }}>
            <DefRow term="CoinGecko">Primary source for live and historical price data.</DefRow>
            <DefRow term="Binance">Public spot-price fallback when CoinGecko is unavailable.</DefRow>
            <DefRow term="CryptoCompare">Secondary fallback for live and historical price data.</DefRow>
            <DefRow term="Etherscan">Ethereum transaction history for FIFO analysis.</DefRow>
            <DefRow term="Alchemy">Ethereum balance and chain reads.</DefRow>
            <DefRow term="Helius">Solana balance reads.</DefRow>
          </div>
        </Section>

        <Section id="retention" title="Data Retention">
          <P>Your account data is kept for as long as your account exists. If you stop using CryptoFolio without deleting your account, your data remains in Firestore until you request deletion; it is not automatically purged after a period of inactivity.</P>
        </Section>

        <Section id="deletion" title="Data Deletion">
          <P>You can delete your account and all associated data at any time by emailing <MailLink />. Once processed, your email, portfolio data, and saved addresses are removed from Firestore.</P>
        </Section>

        <Section id="no-selling" title="No Selling of Data">
          <P>We do not sell, trade, or share personal data with third parties for commercial purposes. The only external sharing that happens is the technical API traffic described under Third-Party Services.</P>
        </Section>

        <Section id="changes" title="Changes to This Policy">
          <P>As this is a student thesis project maintained by a single developer, this policy may change as the system evolves. Material changes will be reflected by updating the effective date at the top of this page.</P>
        </Section>

        <Section id="contact" title="Contact">
          <P>Questions about this policy? Reach out at <MailLink />.</P>
        </Section>
      </div>

      <MarketingFooter current="privacy" />
    </div>
  );
}
