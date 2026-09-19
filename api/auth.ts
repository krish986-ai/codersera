import { scryptSync, timingSafeEqual } from 'node:crypto';
import { createSession, sessionCookie, expiredSessionCookie, isAuthenticated } from '../lib/_auth.js';
import { noStore, methodNotAllowed } from '../lib/_http.js';

export default function handler(request: any, response: any) {
  noStore(response);

  // POST /api/auth/login
  if (request.method === 'POST' && request.url?.endsWith('/login')) {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const authSecret = process.env.AUTH_SECRET;
    if (!adminPassword || !authSecret || authSecret.length < 32) {
      return response.status(503).json({ error: 'Admin authentication is not configured.' });
    }

    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const expected = scryptSync(adminPassword, authSecret, 64);
    const candidate = scryptSync(password, authSecret, 64);
    const valid = timingSafeEqual(candidate, expected);

    if (!valid) {
      return response.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    response.setHeader('Set-Cookie', sessionCookie(createSession()));
    return response.status(200).json({ authenticated: true });
  }

  // POST /api/auth/logout
  if (request.method === 'POST' && request.url?.endsWith('/logout')) {
    response.setHeader('Set-Cookie', expiredSessionCookie);
    return response.status(204).end();
  }

  // GET /api/auth/session
  if (request.method === 'GET' && request.url?.endsWith('/session')) {
    return response.status(200).json({ authenticated: isAuthenticated(request) });
  }

  return methodNotAllowed(response, ['GET', 'POST']);
}