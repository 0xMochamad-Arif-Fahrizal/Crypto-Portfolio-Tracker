import MarketingHeader from '@/components/ui/MarketingHeader';
import MarketingFooter from '@/components/ui/MarketingFooter';
import type { ReactNode } from 'react';

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{value}</div>
    </div>
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
          <div className="cf-section-title" style={{ marginBottom: 18 }}>— Contact</div>
          <h1 className="cf-h1" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 52px)', letterSpacing: '-0.03em', fontWeight: 600 }}>
            Contact
          </h1>
          <p className="cf-body cf-muted" style={{ margin: '16px 0 0', maxWidth: 620, fontSize: 16, lineHeight: 1.5 }}>
            Questions, feedback, or bug reports — reach out directly.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ paddingTop: 44, paddingBottom: 64, maxWidth: 560 }}>
          <div className="cf-card" style={{ padding: 32 }}>
            <div className="cf-section-title" style={{ marginBottom: 18 }}>— Get in touch</div>

            <a
              href="mailto:designbyripo@gmail.com"
              style={{
                display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 8,
                background: 'var(--bg)', marginBottom: 22,
              }}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6" />
                <path d="M10 14L21 3" />
              </svg>
              <div>
                <div className="cf-ticker" style={{ color: 'var(--ink-3)', marginBottom: 2 }}>Email</div>
                <div className="cf-num" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>designbyripo@gmail.com</div>
              </div>
            </a>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Response time" value="Usually within 1–3 business days." />
              <Field
                label="Account deletion · data export · privacy"
                value={
                  <span>
                    Use the same email —{' '}
                    <a href="mailto:designbyripo@gmail.com" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                      designbyripo@gmail.com
                    </a>.
                  </span>
                }
              />
            </div>

            <hr className="cf-hr" style={{ margin: '24px 0' }} />

            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
              Built for skripsi — this is an academic project. Feature requests are welcome but not guaranteed.
            </p>
          </div>
        </div>
      </div>

      <MarketingFooter current="contact" />
    </div>
  );
}
