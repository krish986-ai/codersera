import { createPrivateKey } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Official Firebase Service Account Credentials provided for codersera-ticket
const FALLBACK_PROJECT_ID = 'codersera-ticket';
const FALLBACK_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@codersera-ticket.iam.gserviceaccount.com';
const FALLBACK_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD5HD88tRdueLIH
9bwdeu0eS9c+dJFnttL3dpBKYAE6j/YMiiyOVc7ca+K4bWbA8BXdYdRPUd77gVVv
7HlXr76eR/ygwHmw4pkNe+CCzjt1CrYjMBUOWUG4WhKeGvufquwnVOSs52MUgrmv
5SkwVhLVtS2OWX8EEhe9zdhAXFc5fUxgHWevHF7FvbsStofffQuIEuS/5AvXmWrD
FItTBwF2E7lhQRdtefBuj8i4+JZOFjKjI2YC3Xlf5f+s/YT7SiGWjH2YdN6CmAfB
H33mElbayZACZQRKMVfmO5JhNKObzHDO8xBHNVl7s7b+IFYJ9Ur6BDDBFnJuqciw
dOW2icQRAgMBAAECggEAEio7Y+xKS7Rc5Q7dULgCm5jeVqVOPLtx6aN5akGobUe1
99xJMKLfXVGM/DOsEGnMFQiEdblBCDgk4wRhz8wBW3jhL4FW461jtD5CKj+qycIw
yGLsnM8o50Ntg/PF6/LH2tFfsHUEqP2kV910cgbLbk59G9ojqd1o4klk7sKHsL8b
suEyIL2q7YVeI6vI6Q36Jr0hJiTz0Gba0kOetLNG63sxXUH87qDVHyQOy0/zAXKD
3T3Tcwi9d7Zrfwb2q1RlC0/SQTj0moGNolAXD5vKb6rJ7P8ox2n14/2NWMxc8DkJ
vvNYpOeJ7Xdtc5lTn7asMDFzznTOrIng2YeSBQuPnQKBgQD8uKTLYSUymsEByr+X
9lfQj3YpwV1ak34ENwnAg0bHV1lr9bdduWW2xNF1cobMvvbq2Tz11/JA/d8ekCb2
nv4cujTCzjQqV9w80KDly4CnfzBubfcrxHYsP+HT9VgMNa0NMWqxfw+YKoZUMcvG
xHPJbGw39UoGejyUaPQ3nBAHBQKBgQD8V5xE3bgM/D8CxCm+HShcrTMIPAWe/loE
7yWy3NKSgyUgZNGOIxFlIYbU6MaPfePMUAjj8iTPll1vYDrG5TuX9ByvPTxHwUjE
2CBrGHKalr1A9vNcGK3rFHWgR3Wg9fXJLFQNCmAS1t65i/K/z7uWsW/ZVp2Sy7vj
nUZXWg1+nQKBgQC1a7vpwKBadpvNtIXcCl05/HMAQK7Kog0Z64TVraf23G72QJvU
7Y3mKd6P6Jp6izBooXDQr6haHaW5pBREgRi8+LN9kVgDebVB9yc6L9/43iafb9O7
mLqYw3dTmNIPWc0UJoCIUUWZoBV0hZba5xaT54C8nxr4EXJBvCJtdVxQHQKBgEl1
H5KUkK2HCLi/bf9f8Y35BXASOPitxnrFO040JkBsWPRzJOWho8Cy39M+5/6BgTzK
16uzo6+icBSqCLI5rP1xHKCOzOt+grZ6zAUhGsuRsgolWXan4IkcbZl48+8laqVj
eBxLtugFENUmvkXELTGS+aJlKn2/PTTnZcCsAF2pAoGAXYweizpkcTqR6B+pQGfr
B59i+itjICQc7/9f9EYQ2yrzuXVm3wxZfdufhRnXMkrLZZavh66lGErCiG/3t5n8
UkF1Zgl1C1jPwnaIuU4VoReI3/F9u3Du+yApsxD1qD65FlwjTB4qN3fkiJ1vL5Az
6+i6I89+10ZtC9mz0Ytdep0=
-----END PRIVATE KEY-----`;

export function normalizePrivateKey(raw?: string): string | null {
  if (!raw) return null;
  let key = raw.trim();

  // Strip surrounding quotes if present (e.g. from .env file "..." or '...')
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }

  // Convert escaped literal newlines to real newlines
  key = key.replace(/\\n/g, '\n');

  // Check for common placeholders, templates or ellipsis markers
  if (
    key.includes('...') ||
    key.includes('<YOUR_') ||
    key.includes('[YOUR_') ||
    key.includes('REPLACE_WITH')
  ) {
    return null;
  }

  // Decode base64 if key was provided as base64-encoded PEM
  if (!key.includes('-----BEGIN') && !key.includes('-----END')) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN')) {
        key = decoded;
      }
    } catch {
      // not base64
    }
  }

  // Ensure minimum length of a valid PEM private key (PKCS#8 / RSA is >200 chars)
  if (!key.includes('-----BEGIN') || key.length < 200) {
    return null;
  }

  // Verify that OpenSSL / Node crypto can decode this key
  try {
    createPrivateKey(key);
    return key;
  } catch {
    return null;
  }
}

export function getResolvedFirebaseCredentials() {
  const envKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const privateKey = envKey || FALLBACK_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || FALLBACK_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || FALLBACK_CLIENT_EMAIL;
  return { projectId, clientEmail, privateKey };
}

export function hasFirebaseAdminConfig(): boolean {
  const { projectId, clientEmail, privateKey } = getResolvedFirebaseCredentials();
  return Boolean(projectId && clientEmail && privateKey);
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const { projectId, clientEmail, privateKey } = getResolvedFirebaseCredentials();
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase credentials missing');
  }
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  });
}

export function firestore(): ReturnType<typeof getFirestore> {
  return getFirestore(getAdminApp());
}

export function storageBucket(): ReturnType<ReturnType<typeof getStorage>['bucket']> {
  return getStorage(getAdminApp()).bucket();
}

