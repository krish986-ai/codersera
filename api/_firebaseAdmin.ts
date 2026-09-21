import { createPrivateKey } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

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
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is required');
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is required');
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (!clientEmail) {
    throw new Error('FIREBASE_CLIENT_EMAIL environment variable is required');
  }
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

