import MarketingHeader from '@/components/ui/MarketingHeader';
import MarketingFooter from '@/components/ui/MarketingFooter';
import Icon from '@/components/ui/Icon';
import type { ReactNode } from 'react';

const GITHUB_URL = 'https://github.com/0xMochamad-Arif-Fahrizal/Crypto-Portfolio-Tracker';

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{value}</div>
    </div>
  );
}

function LinkRow({ href, iconPath, label, value, external }: { href: string; iconPath: ReactNode; label: string; value: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
        padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 8,
        background: 'var(--bg)', marginBottom: 12,
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        {iconPath}
      </svg>
      <div style={{ flex: 1 }}>
        <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 2 }}>{label}</div>
        <div className="cf-num" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{value}</div>
      </div>
      {external && <Icon name="external-link" size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />}
    </a>
  );
}

export default function ContactPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <MarketingHeader />

      {/* PageHero */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <div className="cf-dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, transparent 35%, var(--bg) 80%)' }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '72px 24px 56px' }}>
          <div className="cf-section-title" style={{ marginBottom: 18 }}>Contact</div>
          <h1 className="cf-h1" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-0.03em', fontWeight: 600 }}>
            Contact
          </h1>
          <p className="cf-body cf-muted" style={{ margin: '16px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.5 }}>
            Questions, feedback, bug reports, or academic inquiries: reach out directly.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6" style={{ paddingTop: 44, paddingBottom: 64, maxWidth: 900 }}>
          <div className="cf-card" style={{ padding: 32 }}>
            <div className="cf-section-title" style={{ marginBottom: 18 }}>Get in touch</div>

            <LinkRow
              href="mailto:designbyripo@gmail.com"
              label="Email"
              value="designbyripo@gmail.com"
              iconPath={
                <>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <path d="M15 3h6v6" />
                  <path d="M10 14L21 3" />
                </>
              }
            />
            <LinkRow
              href={`${GITHUB_URL}/issues`}
              label="Bug reports & feature requests"
              value="Open a GitHub Issue"
              external
              iconPath={
                <>
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="8" x2="12" y2="12.5" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              }
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 6 }}>
              <Field label="Response time" value="Usually within 1–3 business days." />
              <Field
                label="Account deletion · data export · privacy"
                value={
                  <span>
                    Use the same email:{' '}
                    <a href="mailto:designbyripo@gmail.com" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                      designbyripo@gmail.com
                    </a>.
                  </span>
                }
              />
            </div>

            <hr className="cf-hr" style={{ margin: '24px 0' }} />

            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
              Built for skripsi. This is an academic project. Feature requests are welcome but not guaranteed.
            </p>
          </div>

          <div className="cf-card" style={{ padding: 32 }}>
            <div className="cf-section-title" style={{ marginBottom: 18 }}>About this project</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field
                label="Source code"
                value={
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                    {GITHUB_URL.replace('https://', '')}
                  </a>
                }
              />
              <Field label="License" value="MIT License. See the Docs page for full architecture details and the LICENSE file in the repository for terms." />
              <Field
                label="Citing this work"
                value={
                  <span>
                    Educational and research use is encouraged. If you reference this project in academic work, please cite the repository above and note it as an undergraduate thesis prototype rather than a production system.
                  </span>
                }
              />
              <Field label="Not affiliated" value="CryptoFolio is not affiliated with, endorsed by, or officially connected to any cryptocurrency exchange, wallet provider, or blockchain foundation mentioned in its documentation." />
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter current="contact" />
    </div>
  );
}
