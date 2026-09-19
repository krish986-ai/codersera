import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink } from 'firebase/auth';
import { StudentTicket } from '../types';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseTestResult {
  success: boolean;
  status: 
    | 'connected' 
    | 'connected_rules_locked' 
    | 'missing_database' 
    | 'invalid_key' 
    | 'project_not_found' 
    | 'network_error'
    | 'error';
  title: string;
  message: string;
  details?: string[];
  suggestedAction?: string;
  suggestedRules?: string;
}

// Configuration is supplied by the build environment. A custom value entered in
// the diagnostics panel is kept only for this page session and never persisted.
let runtimeConfig: FirebaseCustomConfig | null = null;

// Clean and sanitize string (removes surrounding quotes, trailing commas, and whitespace)
export function sanitizeConfigValue(val: string | undefined): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/,$/, '')
    .trim();
}

export function getEnvFirebaseConfig(): FirebaseCustomConfig | null {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || '';
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '';
  if (!apiKey || !projectId) return null;
  return {
    apiKey: sanitizeConfigValue(apiKey),
    authDomain: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) || `${projectId}.firebaseapp.com`,
    projectId: sanitizeConfigValue(projectId),
    storageBucket: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) || `${projectId}.firebasestorage.app`,
    messagingSenderId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) || '1234567890',
    appId: sanitizeConfigValue(import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) || '',
  };
}

export function getStoredFirebaseConfig(): FirebaseCustomConfig | null {
  return runtimeConfig || getEnvFirebaseConfig();
}

export function saveStoredFirebaseConfig(cfg: FirebaseCustomConfig) {
  try {
    const cleanCfg: FirebaseCustomConfig = {
      apiKey: sanitizeConfigValue(cfg.apiKey),
      authDomain: sanitizeConfigValue(cfg.authDomain) || `${sanitizeConfigValue(cfg.projectId)}.firebaseapp.com`,
      projectId: sanitizeConfigValue(cfg.projectId),
      storageBucket: sanitizeConfigValue(cfg.storageBucket) || `${sanitizeConfigValue(cfg.projectId)}.firebasestorage.app`,
      messagingSenderId: sanitizeConfigValue(cfg.messagingSenderId) || '1234567890',
      appId: sanitizeConfigValue(cfg.appId),
    };
    runtimeConfig = cleanCfg;
    // Reset runtime instances so new credentials take effect immediately
    resetFirebaseApp();
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
  }
}

export async function clearStoredFirebaseConfig() {
  try {
    runtimeConfig = null;
    await resetFirebaseApp();
  } catch (e) {
    console.error('Failed to clear Firebase config:', e);
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export async function resetFirebaseApp() {
  try {
    const existingApps = getApps();
    for (const existingApp of existingApps) {
      await deleteApp(existingApp).catch(() => {});
    }
  } catch {
    // Ignore cleanup error
  }
  app = null;
  auth = null;
}

export function getFirebaseInstance(overrideConfig?: FirebaseCustomConfig | null) {
  if (app && auth && !overrideConfig) {
    return { app, auth, isConfigured: true };
  }

  const userCfg = overrideConfig || getStoredFirebaseConfig();
  if (userCfg && userCfg.apiKey && userCfg.projectId) {
    try {
      const existing = getApps();
      if (!existing.length) {
        app = initializeApp({
          apiKey: sanitizeConfigValue(userCfg.apiKey),
          authDomain: sanitizeConfigValue(userCfg.authDomain) || `${userCfg.projectId}.firebaseapp.com`,
          projectId: sanitizeConfigValue(userCfg.projectId),
          storageBucket: sanitizeConfigValue(userCfg.storageBucket) || `${userCfg.projectId}.firebasestorage.app`,
          messagingSenderId: sanitizeConfigValue(userCfg.messagingSenderId) || '1234567890',
          appId: sanitizeConfigValue(userCfg.appId),
        });
      } else {
        app = existing[0];
      }
      auth = getAuth(app);
      return { app, auth, isConfigured: true };
    } catch (e) {
      console.warn('Firebase initialization with stored config failed:', e);
    }
  }

  return { app: null, auth: null, isConfigured: false };
}

export async function sendRegistrationEmailLink(email: string): Promise<boolean> {
  const { auth } = getFirebaseInstance();
  if (!auth) throw new Error('Firebase email verification is not configured.');

  await sendSignInLinkToEmail(auth, email, {
    url: window.location.origin,
    handleCodeInApp: true,
  });
  window.localStorage.setItem('codersera_pending_email', email);
  return true;
}

export async function completeRegistrationEmailLink(email: string): Promise<boolean> {
  const { auth } = getFirebaseInstance();
  if (!auth || !isSignInWithEmailLink(auth, window.location.href)) return false;

  await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem('codersera_pending_email');
  window.history.replaceState({}, document.title, window.location.pathname);
  return true;
}

/**
 * Multi-layer diagnostic connection tester:
 * 1. Sanitizes inputs (strips quotes, whitespace)
 * 2. Directly probes Google Cloud Firestore REST API for instant, accurate root-cause analysis
 * 3. Initializes Firebase Client SDK and tests document handshake with safety timeout
 */
export async function testFirestoreConnection(
  customConfig?: FirebaseCustomConfig
): Promise<FirebaseTestResult> {
  const cfg = customConfig || getStoredFirebaseConfig();

  const apiKey = sanitizeConfigValue(cfg?.apiKey);
  const projectId = sanitizeConfigValue(cfg?.projectId);
  const appId = sanitizeConfigValue(cfg?.appId);

  // Check required fields
  if (!apiKey || !projectId) {
    return {
      success: false,
      status: 'error',
      title: 'Missing Required Credentials',
      message: 'Please enter at least the API Key and Project ID to test connection.',
      details: [
        'API Key: ' + (apiKey ? '✓ Provided' : '✗ Missing'),
        'Project ID: ' + (projectId ? '✓ Provided' : '✗ Missing'),
      ],
      suggestedAction: 'Fill in your Firebase API Key and Project ID in the fields above.',
    };
  }

  // Basic format check
  if (!apiKey.startsWith('AIzaSy')) {
    // Google web API keys virtually always start with AIzaSy
    // Still allowed to proceed with warning if custom, but note it
  }

  // LAYER 1: Direct Google Cloud REST API Probe
  // This provides immediate root-cause feedback without hanging or SDK WebChannel abstraction
  let restStatus: number | null = null;
  let restResponseText = '';

  try {
    const probeUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(probeUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    restStatus = res.status;
    restResponseText = await res.text();
  } catch (err: unknown) {
    const errorStr = String(err);
    if (errorStr.includes('AbortError')) {
      return {
        success: false,
        status: 'network_error',
        title: 'Connection Timed Out',
        message: 'Request to Google Firestore API timed out (took > 6 seconds). Please verify your internet connection.',
        suggestedAction: 'Check your internet connection or any ad-blockers/firewalls blocking firestore.googleapis.com.',
      };
    }
  }

  // Analyze REST API response
  if (restStatus !== null) {
    try {
      const restJson = JSON.parse(restResponseText);
      const errorMessage = restJson?.error?.message || '';
      const errorStatus = restJson?.error?.status || '';

      // Check for Invalid API Key
      if (restStatus === 400 && (errorMessage.includes('API key not valid') || errorStatus === 'INVALID_ARGUMENT')) {
        return {
          success: false,
          status: 'invalid_key',
          title: 'Invalid API Key',
          message: 'Google rejected the API Key. The key does not exist or has restrictions.',
          details: [
            `Error from Google: "${errorMessage}"`,
            'Project ID: ' + projectId,
          ],
          suggestedAction: 'Go to Firebase Console > Project Settings > General > "Web API Key" and copy the exact key without spaces or quotes.',
        };
      }

      // Check for Non-Existent Project
      if (restStatus === 404 && (errorMessage.includes('Project') || errorMessage.includes('not found')) && !errorMessage.includes('Database (default)')) {
        return {
          success: false,
          status: 'project_not_found',
          title: 'Project ID Not Found',
          message: `Google Cloud cannot find project "${projectId}".`,
          details: [
            `Error: ${errorMessage}`,
            'Please verify you typed the exact Project ID, not the project display name.',
          ],
          suggestedAction: 'In Firebase Console, click the Gear icon > Project Settings and look for "Project ID" (e.g. "my-event-app-1234").',
        };
      }

      // Check for Database NOT Created Yet in Firebase Console (Most common mistake!)
      if (restStatus === 404 && (errorMessage.includes('Database (default) not found') || errorMessage.includes('database') || errorStatus === 'NOT_FOUND')) {
        return {
          success: false,
          status: 'missing_database',
          title: 'Firestore Database Not Created Yet',
          message: `Your Firebase project "${projectId}" exists, but Cloud Firestore has NOT been activated yet!`,
          details: [
            '1. Go to Firebase Console (console.firebase.google.com)',
            '2. Open your project: ' + projectId,
            '3. In the left sidebar under "Build", click "Firestore Database"',
            '4. Click the "Create database" button (choose "Test mode" or any region)',
            '5. Click "Next" & "Enable"',
          ],
          suggestedAction: 'Activate Firestore Database in your Firebase Console, then click "Test Connection" again.',
        };
      }

      // Check for Security Rules Permission Denied (403)
      // This means the project exists, database exists, and server is reachable!
      if (restStatus === 403 || errorStatus === 'PERMISSION_DENIED' || errorMessage.includes('Missing or insufficient permissions')) {
        // Save the config because connection to Google is verified!
        if (customConfig) {
          saveStoredFirebaseConfig(customConfig);
        }

        return {
          success: true,
          status: 'connected_rules_locked',
          title: 'Connected to Firestore (Security Rules Locked)',
          message: 'Successfully reached your Cloud Firestore database! However, default Firestore security rules are blocking reads/writes.',
          details: [
            '✓ API Key is valid and authenticated by Google',
            `✓ Project "${projectId}" verified`,
            '✓ Cloud Firestore (default) database is active',
            '⚠️ Rules currently reject unauthenticated read/writes ("PERMISSION_DENIED")',
          ],
          suggestedAction: 'To allow instant ticket synchronization, go to Firebase Console > Firestore Database > Rules tab, and update your rules to allow access.',
          suggestedRules: `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if false;\n    }\n  }\n}`,
        };
      }

      // 200 OK: Full access!
      if (restStatus === 200) {
        if (customConfig) {
          saveStoredFirebaseConfig(customConfig);
        }

        return {
          success: true,
          status: 'connected',
          title: 'Full Firestore Connection Established!',
          message: `Successfully connected to Cloud Firestore database on project "${projectId}". Real-time cloud sync is ready!`,
          details: [
            '✓ API Key verified by Google',
            `✓ Project "${projectId}" verified`,
            '✓ Cloud Firestore database reachable with read/write permissions',
            '✓ Ready to sync registrations and tickets across all devices',
          ],
        };
      }
    } catch {
      // JSON parse fallback, continue to SDK check
    }
  }

  // Data access is deliberately tested through the server boundary, never from the browser.
  try {
    const response = await fetch('/api/events');
    if (response.ok) return { success: true, status: 'connected', title: 'Secure API connection established', message: 'Event data is available through the protected server boundary.' };
    const errMessage = `API returned ${response.status}`;

    if (errMessage.includes('permission-denied') || errMessage.includes('Missing or insufficient permissions')) {
      if (customConfig) {
        saveStoredFirebaseConfig(customConfig);
      }

      return {
        success: true,
        status: 'connected_rules_locked',
        title: 'Connected to Firestore (Rules Locked)',
        message: 'Firestore is private and server-side API access is required.',
        details: [
          '✓ Database connection verified',
          '✓ Client reads and writes are denied by Firestore rules.',
        ],
        suggestedAction: 'Configure the Firebase Admin service-account variables on Vercel.',
        suggestedRules: `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if false;\n    }\n  }\n}`,
      };
    }

    if (errMessage.includes('client is offline')) {
      return {
        success: false,
        status: 'missing_database',
        title: 'Firestore Database Not Active or Offline',
        message: 'Could not connect to Cloud Firestore. In 90% of cases, this means the Firestore Database has not been created in Firebase Console yet.',
        details: [
          'Make sure you have clicked "Create database" under Firestore Database in Firebase Console.',
          'Deploy the repository firestore.rules file (deny by default).',
        ],
        suggestedAction: 'Open console.firebase.google.com, open your project, click "Firestore Database" and click "Create database".',
      };
    }

    return {
      success: false,
      status: 'error',
      title: 'Connection Test Failed',
      message: `Connection attempt returned: ${errMessage}`,
      suggestedAction: 'Check your API Key and Project ID. Ensure Cloud Firestore is enabled in Firebase Console.',
    };
  } catch {
    return { success: false, status: 'network_error', title: 'Secure API unavailable', message: 'The server-side Firebase API could not be reached.', suggestedAction: 'Configure the Firebase Admin service-account variables on Vercel.' };
  }
}

/**
 * Cloud Sync Feature: Upload ticket to Cloud Firestore
 */
export async function syncTicketToCloud(ticket: StudentTicket): Promise<boolean> {
  try { const response = await fetch('/api/registration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }) }); return response.ok; } catch { return false; }
}

/**
 * Cloud Sync Feature: Upload all local tickets to Cloud Firestore
 */
export async function syncAllTicketsToCloud(
  tickets: StudentTicket[]
): Promise<{ success: boolean; count: number; error?: string }> {
  let count = 0;
  for (const ticket of tickets) if (await syncTicketToCloud(ticket)) count++;
  return { success: count === tickets.length, count, error: count === tickets.length ? undefined : 'One or more registrations failed.' };
}

/**
 * Cloud Sync Feature: Fetch tickets from Cloud Firestore
 */
export async function fetchTicketsFromCloud(): Promise<{ success: boolean; tickets: StudentTicket[]; error?: string }> {
  try {
    const response = await fetch('/api/admin/tickets', { credentials: 'include' });
    if (!response.ok) return { success: false, tickets: [], error: 'Administrator authentication required.' };
    return { success: true, tickets: await response.json() as StudentTicket[] };
  } catch (err) { return { success: false, tickets: [], error: err instanceof Error ? err.message : String(err) }; }
}
