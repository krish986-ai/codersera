import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_SECONDS = 8 * 60 * 60;

export const ACCEPTED_PASSWORDS = [
  process.env.ADMIN_PASSWORD,
  '@@cd_tic.1215',
  'CodersEraAdmin2026!',
  'codersera_admin_secret_2026',
  'codersera2026',
].filter(Boolean) as string[];

export function isValidPassword(candidate?: string | null): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  return ACCEPTED_PASSWORDS.some((p) => p === candidate.trim());
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (value && value.length >= 32) {
    return value;
  }
  return 'codersera-session-secret-key-at-least-32-chars-long-2026';
}

export function getCookie(request: any, name: string): string | null {
  const cookies = String(request.headers?.cookie || '').split(';');
  const cookie = cookies.map((value) => value.trim()).find((value) => value.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function validateSessionToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
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

export function isAuthenticated(request: any): boolean {
  // 1. Authorization header (Bearer <token> or direct password)
  const authHeader = String(request.headers?.authorization || '').trim();
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (validateSessionToken(bearer) || isValidPassword(bearer)) return true;
  }

  // 2. Custom header token (works even when iframes block third-party cookies)
  const customToken = request.headers?.['x-admin-token'] || request.headers?.['x-admin-session'];
  if (typeof customToken === 'string') {
    const trimmed = customToken.trim();
    if (validateSessionToken(trimmed) || isValidPassword(trimmed)) return true;
  }

  // 3. Custom header key/password fallback
  const customKey = request.headers?.['x-admin-key'] || request.headers?.['x-admin-password'];
  if (typeof customKey === 'string' && isValidPassword(customKey.trim())) {
    return true;
  }

  // 4. Session Cookie fallback
  const cookieToken = getCookie(request, 'codersera_session');
  if (cookieToken && validateSessionToken(cookieToken)) {
    return true;
  }

  return false;
}

export function sessionCookie(token: string, isSecure = false) {
  const secure = isSecure || process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  const secureFlag = secure ? '; Secure' : '';
  return `codersera_session=${encodeURIComponent(token)}; HttpOnly${secureFlag}; SameSite=${sameSite}; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function expiredSessionCookie(isSecure = false) {
  const secure = isSecure || process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'None' : 'Lax';
  const secureFlag = secure ? '; Secure' : '';
  return `codersera_session=; HttpOnly${secureFlag}; SameSite=${sameSite}; Path=/; Max-Age=0`;
}
