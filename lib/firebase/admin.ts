import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// adminDb is null when no service-account credentials are configured.
// Every caller already guards with `if (adminDb)` before use.
export let adminDb: Firestore | null = null;

try {
  let adminApp: App;

  if (getApps().length === 0) {
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId   = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (clientEmail && privateKey) {
      adminApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    } else {
      // No service-account env vars — skip Admin SDK entirely.
      // Callers' `if (adminDb)` guard will bypass Firestore reads.
      throw new Error('FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY not set');
    }
  } else {
    adminApp = getApps()[0];
  }

  adminDb = getFirestore(adminApp);
} catch (e) {
  // Non-fatal — Firestore server-side reads are optional (price cache, etc.)
  console.warn('[Firebase Admin] Disabled:', e instanceof Error ? e.message : e);
}
