import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 characters.');
  }
  return value;
}

export function getCookie(request: any, name: string): string | null {
  const cookies = String(request.headers.cookie || '').split(';');
  const cookie = cookies.map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function isAuthenticated(request: any) {
  const token = getCookie(request, 'codersera_session');
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  const validSignature = signature.length === expected.length
    && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!validSignature) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return typeof parsed.exp === 'number' && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sessionCookie(token: string) {
  return `codersera_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export const expiredSessionCookie = 'codersera_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
