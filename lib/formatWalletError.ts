// Wallet/RPC fetch failures sometimes bubble up raw server text (e.g. a
// missing env var on the deployment) straight into the UI. This maps the
// handful of known "the server isn't set up right" cases to something a
// visitor can actually read, without hiding real user-facing errors like an
// invalid address.
export function formatWalletError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('not configured') || lower.includes('is not configured')) {
    return 'Wallet lookup is temporarily unavailable. Please try again in a bit.';
  }
  return raw;
}
