import { config } from 'dotenv';
import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

config({ path: '.env.local' });
config();

const app = express();
const port = Number(process.env.AUTH_PORT || 3001);
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminPassword || adminPassword.length < 12) {
  throw new Error('ADMIN_PASSWORD must be set in .env.local and contain at least 12 characters.');
}

const passwordSalt = randomBytes(16);
const passwordHash = scryptSync(adminPassword, passwordSalt, 64);
const sessions = new Map<string, number>();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

app.use(express.json({ limit: '10kb' }));

function getSessionToken(request: express.Request): string | null {
  const cookieHeader = request.headers.cookie || '';
  const sessionCookie = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('codersera_session='));
  return sessionCookie ? decodeURIComponent(sessionCookie.slice('codersera_session='.length)) : null;
}

function isAuthenticated(request: express.Request): boolean {
  const token = getSessionToken(request);
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return true;
}

function setSessionCookie(response: express.Response, token: string) {
  response.setHeader(
    'Set-Cookie',
    `codersera_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
  );
}

app.get('/api/auth/session', (request, response) => {
  response.json({ authenticated: isAuthenticated(request) });
});

app.post('/api/auth/login', (request, response) => {
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  const candidateHash = scryptSync(password, passwordSalt, 64);
  const valid = candidateHash.length === passwordHash.length && timingSafeEqual(candidateHash, passwordHash);

  if (!valid) {
    response.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const token = randomBytes(32).toString('base64url');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  setSessionCookie(response, token);
  response.json({ authenticated: true });
});

app.post('/api/auth/logout', (request, response) => {
  const token = getSessionToken(request);
  if (token) sessions.delete(token);
  response.setHeader('Set-Cookie', 'codersera_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  response.status(204).end();
});

app.get('/api/admin/health', (request, response) => {
  if (!isAuthenticated(request)) {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }
  response.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Local auth server listening on http://localhost:${port}`);
});
