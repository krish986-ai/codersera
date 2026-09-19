import { scryptSync, timingSafeEqual } from 'node:crypto';
import { createSession, sessionCookie } from '../_auth.js';

export default function handler(request: any, response: any) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;
  if (!adminPassword || !authSecret || authSecret.length < 32) {
    response.status(503).json({ error: 'Admin authentication is not configured.' });
    return;
  }

  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  const expected = scryptSync(adminPassword, authSecret, 64);
  const candidate = scryptSync(password, authSecret, 64);
  const valid = timingSafeEqual(candidate, expected);

  if (!valid) {
    response.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  response.setHeader('Set-Cookie', sessionCookie(createSession()));
  response.status(200).json({ authenticated: true });
}
