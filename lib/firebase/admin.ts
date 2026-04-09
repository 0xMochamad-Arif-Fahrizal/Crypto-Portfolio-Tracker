import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  // TODO: Add FIREBASE_ADMIN_SDK environment variable
  // This should contain the service account JSON credentials
  // For now, this is scaffolded and will be configured later
  
  // Uncomment and configure when FIREBASE_ADMIN_SDK env variable is ready:
  // const serviceAccount = JSON.parse(
  //   process.env.FIREBASE_ADMIN_SDK || '{}'
  // );
  // adminApp = initializeApp({
  //   credential: cert(serviceAccount),
  // });
  
  adminApp = initializeApp();
} else {
  adminApp = getApps()[0];
}

// Export Firestore instance for server-side use
export const adminDb = getFirestore(adminApp);
