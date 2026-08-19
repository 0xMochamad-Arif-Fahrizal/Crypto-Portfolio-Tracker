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

const MailLink = () => (
  <a href="mailto:designbyripo@gmail.com" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'var(--font-mono)', fontSize: '0.95em' }}>
    designbyripo@gmail.com
  </a>
);

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <MarketingHeader />

      {/* PageHero */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, transparent 35%, var(--bg) 80%)' }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '72px 24px 56px' }}>
          <div className="cf-section-title" style={{ marginBottom: 18 }}>Terms of Service</div>
          <h1 className="cf-h1" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-0.03em', fontWeight: 600 }}>
            Terms of Service
          </h1>
          <p className="cf-body cf-muted" style={{ margin: '16px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.5 }}>
            The ground rules for using CryptoFolio. Read-only monitoring, not a broker, not financial advice.
          </p>
          <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginTop: 22 }}>Effective June 2026</div>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px' }}>
        <Section id="service" title="Service Description" divider={false}>
          <Lead>CryptoFolio is a read-only portfolio monitoring tool, built as an undergraduate thesis project.</Lead>
          <P>It does not execute trades, hold funds, or provide financial advice. Every figure shown is informational: a reflection of data you entered or public on-chain data we read on your behalf. It is not affiliated with any exchange, wallet provider, or blockchain foundation.</P>
        </Section>

        <Section id="eligibility" title="Eligibility">
          <P>You must be at least <strong style={{ color: 'var(--ink)' }}>18 years old</strong> to use CryptoFolio.</P>
        </Section>

        <Section id="account" title="Your Account">
          <P>You are responsible for keeping your login credentials confidential and for all activity that happens under your account. Let us know at <MailLink /> if you believe your account has been accessed without your permission.</P>
        </Section>

        <Section id="acceptable-use" title="Acceptable Use">
          <P>When using the service, you agree not to:</P>
          <Bullets items={[
            'Scrape or harvest data from the service',
            'Abuse the service through automated requests or load',
            "Attempt to access other users' accounts or data",
            'Use the service to violate any applicable law or the terms of the third-party APIs it relies on',
          ]} />
        </Section>

        <Section id="no-custody" title="Not a Broker, Wallet, or Custodian">
          <P>CryptoFolio never asks for a private key, seed phrase, or transaction signature, and it never has the ability to move, hold, or trade any asset on your behalf. Wallet addresses are read in a strictly read-only capacity for display purposes only.</P>
        </Section>

        <Section id="accuracy" title="Data Accuracy">
          <P>Prices and blockchain data are sourced from third-party APIs (see Docs → Price Data). CryptoFolio does not guarantee the accuracy, completeness, or real-time precision of any figure shown. Nothing in the app constitutes financial advice.</P>
        </Section>

        <Section id="fifo" title="FIFO Calculations">
          <P>FIFO cost-basis figures are provided for informational purposes only. They are <strong style={{ color: 'var(--ink)' }}>not suitable for official tax reporting</strong> without independent verification. FIFO is one of several accepted cost-basis methods; it may not match the method your tax authority requires or the method you use elsewhere.</P>
          <P>In Indonesia, crypto taxation is governed by <Code>PMK No. 68/PMK.03/2022</Code>. Consult a qualified tax professional before relying on any figure for filing.</P>
        </Section>

        <Section id="ip" title="Intellectual Property">
          <P>The CryptoFolio source code is published on GitHub under the MIT License and may be used, copied, and modified under the terms of that license. Your own account data (portfolio entries, saved addresses) remains yours; we claim no ownership over it.</P>
        </Section>

        <Section id="liability" title="Limitation of Liability">
          <P>CryptoFolio is provided <strong style={{ color: 'var(--ink)' }}>&quot;as is&quot;</strong>, without warranty of any kind, express or implied, including warranties of accuracy, merchantability, or fitness for a particular purpose. We are not liable for investment or financial decisions made based on data shown in the app, nor for any loss arising from third-party API downtime, inaccuracy, or discontinuation.</P>
        </Section>

        <Section id="termination" title="Termination">
          <P>We reserve the right to suspend or terminate accounts that violate these terms. You may stop using the service, or request account deletion, at any time (see Privacy Policy → Data Deletion).</P>
        </Section>

        <Section id="changes" title="Changes to These Terms">
          <P>As this is a student thesis project maintained by a single developer, these terms may change as the system evolves. Continued use after a change constitutes acceptance of the updated terms.</P>
        </Section>

        <Section id="governing-law" title="Governing Law">
          <P>These terms are informed by the laws of the Republic of Indonesia, where this project originates as an academic work, without regard to conflict-of-law principles.</P>
        </Section>

        <Section id="contact" title="Contact">
          <P>Questions about these terms? Reach out at <MailLink />.</P>
        </Section>
      </div>

      <MarketingFooter current="terms" />
    </div>
  );
}
