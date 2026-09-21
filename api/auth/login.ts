import { scryptSync, timingSafeEqual } from 'node:crypto';
import { createSession, sessionCookie } from '../_auth.js';
import { noStore } from '../_http.js';

export default function handler(request: any, response: any) {
  noStore(response);
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || authSecret.length < 32) {
    throw new Error('AUTH_SECRET environment variable is required (must be 32+ characters)');
  }
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required');
  }
  const acceptedPasswords = [configuredPassword];

  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  const candidate = scryptSync(password, authSecret, 64);

  const valid = acceptedPasswords.some((pass) => {
    const expected = scryptSync(pass, authSecret, 64);
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });

  if (!valid) {
    response.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }

  const isSecure = Boolean(request.headers?.['x-forwarded-proto'] === 'https' || request.secure);
  response.setHeader('Set-Cookie', sessionCookie(createSession(), isSecure));
  response.status(200).json({ authenticated: true });
}
