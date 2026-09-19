import { config } from 'dotenv';
import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import eventsHandler from './api/events.ts';
import registrationHandler from './api/registration.ts';
import lookupHandler from './api/tickets/lookup.ts';
import adminEventsHandler from './api/admin/events.ts';
import adminTicketsHandler from './api/admin/tickets.ts';
import adminCheckInHandler from './api/admin/check-in.ts';
import adminCleanupHandler from './api/admin/cleanup-images.ts';
import { createSession, expiredSessionCookie, isAuthenticated, sessionCookie } from './api/_auth.ts';

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
app.use(express.json({ limit: '2mb' }));

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

  response.setHeader('Set-Cookie', sessionCookie(createSession()));
  response.json({ authenticated: true });
});

app.post('/api/auth/logout', (request, response) => {
  response.setHeader('Set-Cookie', expiredSessionCookie);
  response.status(204).end();
});

app.get('/api/events', (request, response) => void eventsHandler(request, response));
app.post('/api/registration', (request, response) => void registrationHandler(request, response));
app.get('/api/tickets/lookup', (request, response) => void lookupHandler(request, response));
app.all('/api/admin/events', (request, response) => void adminEventsHandler(request, response));
app.all('/api/admin/tickets', (request, response) => void adminTicketsHandler(request, response));
app.post('/api/admin/check-in', (request, response) => void adminCheckInHandler(request, response));
app.post('/api/admin/cleanup-images', (request, response) => void adminCleanupHandler(request, response));

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
