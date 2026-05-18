'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { clearWalletAddress, getWalletAddresses, saveWalletAddresses } from '@/lib/firestore/wallets';
import { type WalletBookEntry, addWalletBookEntry, deduplicateWalletBook, deleteWalletBookEntry, getWalletBook, renameWalletBookEntry, setActiveWallet } from '@/lib/firestore/walletBook';
import AppHeader from '@/components/ui/AppHeader';
import CoinMark from '@/components/ui/CoinMark';

const isValidEth = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a);
const isValidSol = (a: string) => !a.startsWith('0x') && a.length >= 32 && a.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(a);

function detectChain(a: string): 'ETH' | 'SOL' | null {
  if (isValidEth(a)) return 'ETH';
  if (isValidSol(a)) return 'SOL';
  return null;
}

const truncate = (a: string) => a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;

interface EthBalance { eth: string; usdt: string; ethValueUSD: number; usdtValueUSD: number; }
interface SolBalance { sol: number; solPriceUsd: number; }

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [savedEth, setSavedEth] = useState<string | null>(null);
  const [savedSol, setSavedSol] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [ethEditing, setEthEditing] = useState(false);
  const [solEditing, setSolEditing] = useState(false);
  const [ethInput, setEthInput] = useState('');
  const [solInput, setSolInput] = useState('');

  const [ethBalance, setEthBalance] = useState<EthBalance | null>(null);
  const [solBalance, setSolBalance] = useState<SolBalance | null>(null);
  const [ethLoading, setEthLoading] = useState(false);
  const [solLoading, setSolLoading] = useState(false);
  const [ethBalErr, setEthBalErr] = useState<string | null>(null);
  const [solBalErr, setSolBalErr] = useState<string | null>(null);

  const [ethSaving, setEthSaving] = useState(false);
  const [solSaving, setSolSaving] = useState(false);
  const [ethClearing, setEthClearing] = useState(false);
  const [solClearing, setSolClearing] = useState(false);
  const [ethErr, setEthErr] = useState<string | null>(null);
  const [solErr, setSolErr] = useState<string | null>(null);

  const [walletBook, setWalletBook] = useState<WalletBookEntry[]>([]);
  const [addName, setAddName] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addErr, setAddErr] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameErr, setRenameErr] = useState<string | null>(null);

  const [settingActiveId, setSettingActiveId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bookErr, setBookErr] = useState<string | null>(null);

  const detectedChain = useMemo(() => detectChain(addAddress.trim()), [addAddress]);

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.uid || !db) return;
    const ref = doc(db, 'users', user.uid, 'settings', 'wallets');
    return onSnapshot(ref, (snap) => {
      const data = snap.data();
      setSavedEth(data?.ethAddress ?? null);
      setSavedSol(data?.solanaAddress ?? null);
    }, (err) => console.warn('[settings/wallets] snapshot error:', err));
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        await deduplicateWalletBook(user.uid);
        if (cancelled) return;
        const [addresses, book] = await Promise.all([getWalletAddresses(user.uid), getWalletBook(user.uid)]);
        if (cancelled) return;
        if (book.length === 0 && (addresses.ethAddress || addresses.solanaAddress)) {
          const migrations: Promise<string>[] = [];
          if (addresses.ethAddress) migrations.push(addWalletBookEntry(user.uid, { name: 'My ETH Wallet', address: addresses.ethAddress, chain: 'ETH', isActive: true }));
          if (addresses.solanaAddress) migrations.push(addWalletBookEntry(user.uid, { name: 'My Solana Wallet', address: addresses.solanaAddress, chain: 'SOL', isActive: true }));
          await Promise.all(migrations);
          if (cancelled) return;
          const migrated = await getWalletBook(user.uid);
          if (!cancelled) setWalletBook(migrated);
        } else {
          if (!cancelled) setWalletBook(book);
        }
      } catch (err) { console.warn('Could not load wallet book:', err); }
      finally { if (!cancelled) setPageLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  async function fetchEthBalance(address: string) {
    setEthBalErr(null); setEthBalance(null); setEthLoading(true);
    try {
      const r = await fetch(`/api/wallet?address=${address}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Gagal mengambil saldo.');
      setEthBalance({ eth: String(d.ethBalance ?? d.eth ?? '0'), usdt: String(d.usdtBalance ?? d.usdt ?? '0'), ethValueUSD: Number(d.ethValueUSD ?? 0), usdtValueUSD: Number(d.usdtValueUSD ?? 0) });
    } catch (err) { setEthBalErr(err instanceof Error ? err.message : 'Gagal mengambil saldo Ethereum.'); }
    finally { setEthLoading(false); }
  }

  async function fetchSolBalance(address: string) {
    setSolBalErr(null); setSolBalance(null); setSolLoading(true);
    try {
      const [balResp, priceResp] = await Promise.all([fetch(`/api/solana/balance?address=${address}`), fetch('/api/prices?ids=solana')]);
      const balData = await balResp.json();
      if (!balResp.ok) throw new Error(balData?.error || 'Gagal mengambil saldo Solana.');
      let solPriceUsd = 0;
      if (priceResp.ok) {
        const priceData = await priceResp.json();
        if (Array.isArray(priceData)) {
          const entry = priceData.find((c: { id?: string }) => c.id === 'solana');
          solPriceUsd = (entry as { current_price?: number } | undefined)?.current_price ?? 0;
        }
      }
      setSolBalance({ sol: Number(balData.sol ?? 0), solPriceUsd });
    } catch (err) { setSolBalErr(err instanceof Error ? err.message : 'Gagal mengambil saldo Solana.'); }
    finally { setSolLoading(false); }
  }

  async function saveEth() {
    if (!user) return;
    const addr = ethInput.trim();
    setEthErr(null);
    if (!addr) { setEthErr('Alamat tidak boleh kosong.'); return; }
    if (!isValidEth(addr)) { setEthErr('Alamat Ethereum tidak valid (harus 0x + 40 karakter hex).'); return; }
    setEthSaving(true);
    try { await saveWalletAddresses(user.uid, { ethAddress: addr }); setSavedEth(addr); setEthEditing(false); setEthInput(''); fetchEthBalance(addr); }
    catch (err) { setEthErr(err instanceof Error ? err.message : 'Gagal menyimpan.'); }
    finally { setEthSaving(false); }
  }

  async function saveSol() {
    if (!user) return;
    const addr = solInput.trim();
    setSolErr(null);
    if (!addr) { setSolErr('Alamat tidak boleh kosong.'); return; }
    if (!isValidSol(addr)) { setSolErr('Alamat Solana tidak valid (base58, 32–44 karakter).'); return; }
    setSolSaving(true);
    try { await saveWalletAddresses(user.uid, { solanaAddress: addr }); setSavedSol(addr); setSolEditing(false); setSolInput(''); fetchSolBalance(addr); }
    catch (err) { setSolErr(err instanceof Error ? err.message : 'Gagal menyimpan.'); }
    finally { setSolSaving(false); }
  }

  async function clearEth() {
    if (!user) return;
    setEthClearing(true); setEthErr(null);
    try { await clearWalletAddress(user.uid, 'eth'); setSavedEth(null); setEthBalance(null); setEthBalErr(null); }
    catch (err) { setEthErr(err instanceof Error ? err.message : 'Gagal menghapus.'); }
    finally { setEthClearing(false); }
  }

  async function clearSol() {
    if (!user) return;
    setSolClearing(true); setSolErr(null);
    try { await clearWalletAddress(user.uid, 'solana'); setSavedSol(null); setSolBalance(null); setSolBalErr(null); }
    catch (err) { setSolErr(err instanceof Error ? err.message : 'Gagal menghapus.'); }
    finally { setSolClearing(false); }
  }

  async function handleSetActive(entry: WalletBookEntry) {
    if (!user) return;
    setSettingActiveId(entry.id); setBookErr(null);
    try {
      await setActiveWallet(user.uid, entry.id, entry.chain, entry.address, walletBook);
      if (entry.chain === 'ETH') { setSavedEth(entry.address); setEthBalance(null); setEthBalErr(null); }
      else { setSavedSol(entry.address); setSolBalance(null); setSolBalErr(null); }
      const updated = await getWalletBook(user.uid);
      setWalletBook(updated);
    } catch (err) { setBookErr(err instanceof Error ? err.message : 'Gagal mengatur wallet aktif.'); }
    finally { setSettingActiveId(null); }
  }

  async function handleRename(id: string) {
    if (!user) return;
    const trimmed = editName.trim();
    if (!trimmed) { setRenameErr('Nama tidak boleh kosong.'); return; }
    if (trimmed.length > 30) { setRenameErr('Nama maks 30 karakter.'); return; }
    setRenameSaving(true); setRenameErr(null);
    try {
      await renameWalletBookEntry(user.uid, id, trimmed);
      setWalletBook((prev) => prev.map((e) => (e.id === id ? { ...e, name: trimmed } : e)));
      setEditingId(null); setEditName('');
    } catch (err) { setRenameErr(err instanceof Error ? err.message : 'Gagal menyimpan nama.'); }
    finally { setRenameSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    const entry = walletBook.find((e) => e.id === id);
    if (!entry) return;
    if (isEntryActive(entry)) { setBookErr('Set wallet lain sebagai aktif sebelum menghapus ini.'); return; }
    setDeletingId(id); setBookErr(null);
    try { await deleteWalletBookEntry(user.uid, id); setWalletBook((prev) => prev.filter((e) => e.id !== id)); }
    catch (err) { setBookErr(err instanceof Error ? err.message : 'Gagal menghapus wallet.'); }
    finally { setDeletingId(null); }
  }

  async function handleAddToBook() {
    if (!user) return;
    const name = addName.trim(); const address = addAddress.trim();
    setAddErr(null);
    if (!name) { setAddErr('Nama tidak boleh kosong.'); return; }
    if (name.length > 30) { setAddErr('Nama maks 30 karakter.'); return; }
    if (!address) { setAddErr('Alamat tidak boleh kosong.'); return; }
    const chain = detectChain(address);
    if (!chain) { setAddErr('Alamat tidak valid. ETH: 0x + 40 hex. SOL: base58, 32–44 karakter.'); return; }
    const isDuplicate = walletBook.some((e) => chain === 'ETH' ? e.address.toLowerCase() === address.toLowerCase() : e.address === address);
    if (isDuplicate) { setAddErr('Alamat ini sudah ada di address book.'); return; }
    setAddSaving(true);
    try { await addWalletBookEntry(user.uid, { name, address, chain }); const updated = await getWalletBook(user.uid); setWalletBook(updated); setAddName(''); setAddAddress(''); }
    catch (err) { setAddErr(err instanceof Error ? err.message : 'Gagal menyimpan wallet.'); }
    finally { setAddSaving(false); }
  }

  function isEntryActive(entry: WalletBookEntry): boolean {
    return entry.chain === 'ETH'
      ? entry.address.toLowerCase() === (savedEth ?? '').toLowerCase()
      : entry.address === savedSol;
  }

  const handleLogout = useCallback(async () => {
    try { if (auth) { await signOut(auth); router.push('/login'); } } catch {}
  }, [router]);

  if (authLoading || pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <AppHeader email={user?.email} onLogout={handleLogout} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 700ms linear infinite', margin: '0 auto 12px' }} />
            <span className="cf-ticker" style={{ color: 'var(--ink-3)' }}>Loading…</span>
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (!user) return null;

  function ActiveWalletCard({ chain, saved, editing, input, onSetInput, balance, balErr, balLoading, saving, clearing, err, onEdit, onSave, onClear, onCheckBalance, onCancel }: {
    chain: 'ETH' | 'SOL'; saved: string | null; editing: boolean; input: string; onSetInput: (v: string) => void;
    balance: EthBalance | SolBalance | null; balErr: string | null; balLoading: boolean;
    saving: boolean; clearing: boolean; err: string | null;
    onEdit: () => void; onSave: () => void; onClear: () => void; onCheckBalance: () => void; onCancel: () => void;
  }) {
    const isEth = chain === 'ETH';
    return (
      <div className="cf-card cf-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CoinMark symbol={chain} size={32} />
            <div>
              <div className="cf-h3" style={{ fontWeight: 600 }}>{isEth ? 'Ethereum' : 'Solana'}</div>
              <div className="cf-ticker">{isEth ? 'ETH + USDT · Mainnet' : 'SOL · Mainnet'}</div>
            </div>
          </div>
          <span className="cf-tag">{isEth ? 'EVM' : 'SOL'}</span>
        </div>

        {saved && !editing ? (
          <div style={{ padding: '12px 14px', background: 'var(--surface-inset)', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="cf-ticker">Active Address</span>
              <span className="cf-pill cf-pill-positive">✓ Active</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--positive)', wordBreak: 'break-all' }}>{saved}</div>
          </div>
        ) : !saved && !editing ? (
          <div style={{ padding: 14, background: 'var(--surface-inset)', border: '1px dashed var(--border)', borderRadius: 8, marginBottom: 14 }}>
            <span className="cf-ticker cf-muted">Belum ada alamat {chain} tersimpan.</span>
          </div>
        ) : null}

        {editing && (
          <div style={{ marginBottom: 14 }}>
            <label className="cf-label">{saved ? 'Ganti dengan alamat baru' : `Masukkan alamat ${chain}`}</label>
            <input className="cf-input" type="text" value={input} onChange={(e) => onSetInput(e.target.value)}
              placeholder={isEth ? '0x…' : 'alamat base58 Solana…'}
              spellCheck={false} autoCapitalize="off" autoCorrect="off" autoFocus style={{ marginBottom: 8 }} />
            {err && <div style={{ color: 'var(--negative)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 8 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="cf-btn cf-btn-primary" onClick={onSave} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="cf-btn cf-btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
          </div>
        )}

        {!editing && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button className="cf-btn cf-btn-secondary" onClick={onEdit} style={{ flex: 1 }}>
              {saved ? '✏ Edit address' : '+ Set address'}
            </button>
            {saved && (
              <button className="cf-btn cf-btn-danger" onClick={onClear} disabled={clearing}>
                {clearing ? '…' : '✕ Clear'}
              </button>
            )}
          </div>
        )}
        {!editing && err && <div style={{ color: 'var(--negative)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 8 }}>{err}</div>}

        {saved && !editing && (
          <button className="cf-btn cf-btn-ghost" onClick={onCheckBalance} disabled={balLoading} style={{ width: '100%' }}>
            {balLoading ? 'Checking…' : 'Check Balance'}
          </button>
        )}

        {balErr && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--negative-bg)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--negative)' }}>{balErr}</div>
        )}

        {balance && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            {isEth ? (
              <>
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div className="cf-ticker" style={{ marginBottom: 6 }}>ETH</div>
                  <div className="cf-num" style={{ fontSize: 16, fontWeight: 500 }}>{parseFloat((balance as EthBalance).eth).toFixed(4)} Ξ</div>
                  <div className="cf-num cf-muted" style={{ fontSize: 11, marginTop: 4 }}>${(balance as EthBalance).ethValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div className="cf-ticker" style={{ marginBottom: 6 }}>USDT</div>
                  <div className="cf-num" style={{ fontSize: 16, fontWeight: 500 }}>${parseFloat((balance as EthBalance).usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="cf-num cf-muted" style={{ fontSize: 11, marginTop: 4 }}>≈ stablecoin</div>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div className="cf-ticker" style={{ marginBottom: 6 }}>SOL</div>
                  <div className="cf-num" style={{ fontSize: 16, fontWeight: 500 }}>{(balance as SolBalance).sol.toFixed(4)} ◎</div>
                </div>
                <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div className="cf-ticker" style={{ marginBottom: 6 }}>SOL Value (USD)</div>
                  <div className="cf-num" style={{ fontSize: 16, fontWeight: 500 }}>${((balance as SolBalance).sol * (balance as SolBalance).solPriceUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader email={user.email} onLogout={handleLogout} />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div className="cf-section-title" style={{ marginBottom: 10 }}>— Wallet Settings</div>
          <h1 className="cf-h2" style={{ margin: 0 }}>Wallets</h1>
          <p className="cf-body cf-muted" style={{ margin: '6px 0 0' }}>
            Kelola alamat wallet yang digunakan di Dashboard dan Integrated.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {/* Section 1: Active wallets */}
          <section>
            <div className="cf-section-title" style={{ marginBottom: 14 }}>— Active Wallets</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <ActiveWalletCard
                chain="ETH" saved={savedEth} editing={ethEditing} input={ethInput} onSetInput={setEthInput}
                balance={ethBalance} balErr={ethBalErr} balLoading={ethLoading}
                saving={ethSaving} clearing={ethClearing} err={ethErr}
                onEdit={() => { setEthEditing(true); setEthInput(savedEth ?? ''); setEthErr(null); }}
                onSave={saveEth} onClear={clearEth}
                onCheckBalance={() => savedEth && fetchEthBalance(savedEth)}
                onCancel={() => { setEthEditing(false); setEthInput(''); setEthErr(null); }}
              />
              <ActiveWalletCard
                chain="SOL" saved={savedSol} editing={solEditing} input={solInput} onSetInput={setSolInput}
                balance={solBalance} balErr={solBalErr} balLoading={solLoading}
                saving={solSaving} clearing={solClearing} err={solErr}
                onEdit={() => { setSolEditing(true); setSolInput(savedSol ?? ''); setSolErr(null); }}
                onSave={saveSol} onClear={clearSol}
                onCheckBalance={() => savedSol && fetchSolBalance(savedSol)}
                onCancel={() => { setSolEditing(false); setSolInput(''); setSolErr(null); }}
              />
            </div>
          </section>

          {/* Section 2: Address book */}
          <section>
            <div className="cf-section-title" style={{ marginBottom: 14 }}>— Address Book</div>

            {bookErr && (
              <div style={{ marginBottom: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--negative-bg)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--negative)' }}>
                {bookErr}
                <button onClick={() => setBookErr(null)} style={{ opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--negative)' }}>✕</button>
              </div>
            )}

            <div className="cf-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              {walletBook.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                  <span className="cf-ticker cf-muted">Belum ada wallet di address book. Tambahkan di bawah.</span>
                </div>
              ) : (
                walletBook.map((entry, i) => (
                  <div
                    key={entry.id}
                    style={{ padding: '16px 24px', borderBottom: i === walletBook.length - 1 ? 'none' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', animation: `cf-fade-up 240ms ${i * 30}ms both` }}
                  >
                    {editingId === entry.id ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label className="cf-label">Ganti nama</label>
                        <input className="cf-input" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={30} autoFocus />
                        {renameErr && <div style={{ color: 'var(--negative)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{renameErr}</div>}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="cf-btn cf-btn-primary" onClick={() => handleRename(entry.id)} disabled={renameSaving} style={{ height: 30 }}>{renameSaving ? 'Saving…' : 'Save'}</button>
                          <button className="cf-btn cf-btn-secondary" onClick={() => { setEditingId(null); setEditName(''); setRenameErr(null); }} style={{ height: 30 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 320px' }}>
                          <CoinMark symbol={entry.chain} size={28} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500 }}>{entry.name}</span>
                              <span className="cf-tag">{entry.chain}</span>
                              {isEntryActive(entry) && <span className="cf-pill cf-pill-positive">✓ Aktif</span>}
                            </div>
                            <div className="cf-num cf-muted" style={{ fontSize: 12 }}>{truncate(entry.address)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {!isEntryActive(entry) && (
                            <button className="cf-btn cf-btn-secondary" onClick={() => handleSetActive(entry)} disabled={settingActiveId === entry.id} style={{ height: 30 }}>
                              {settingActiveId === entry.id ? '…' : 'Set Active'}
                            </button>
                          )}
                          <button className="cf-btn cf-btn-ghost" style={{ height: 30, padding: '0 10px' }} onClick={() => { setEditingId(entry.id); setEditName(entry.name); setRenameErr(null); }}>✏</button>
                          <button className="cf-btn cf-btn-danger" style={{ height: 30, padding: '0 10px' }} onClick={() => handleDelete(entry.id)} disabled={isEntryActive(entry) || deletingId === entry.id}>
                            {deletingId === entry.id ? '…' : '✕'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add new wallet form */}
            <div className="cf-card" style={{ background: 'var(--surface-inset)' }}>
              <div className="cf-section-title" style={{ marginBottom: 14 }}>Tambah Wallet Baru</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="cf-label">Nama</label>
                  <input className="cf-input" type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="My Main ETH" maxLength={30} />
                </div>
                <div>
                  <label className="cf-label">
                    Address
                    {detectedChain && <span style={{ marginLeft: 8, color: 'var(--ink)', fontWeight: 400 }}>— {detectedChain} terdeteksi ✓</span>}
                  </label>
                  <input className="cf-input" type="text" value={addAddress} onChange={(e) => setAddAddress(e.target.value)} placeholder="0x… atau base58 Solana…" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
              </div>
              {addErr && <div style={{ marginBottom: 12, color: 'var(--negative)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{addErr}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="cf-btn cf-btn-primary" onClick={handleAddToBook} disabled={addSaving || !addName.trim() || !detectedChain}>
                  {addSaving ? 'Menyimpan…' : '+ Save to Address Book'}
                </button>
              </div>
            </div>
          </section>

          {/* Info note */}
          <div className="cf-card" style={{ background: 'var(--surface-inset)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <div>
                <div className="cf-body" style={{ fontWeight: 500, marginBottom: 4 }}>How addresses are used</div>
                <div className="cf-body cf-muted">
                  Alamat yang disimpan di sini digunakan di Dashboard dan Integrated untuk mengambil saldo on-chain secara otomatis.
                  Tidak perlu connect wallet — cukup tempel alamat publik Ethereum dan/atau Solana.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
