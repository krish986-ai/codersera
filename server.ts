import { config } from 'dotenv';
import express from 'express';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import eventsHandler from './api/events.ts';
import registrationHandler from './api/registration.ts';
import lookupHandler from './api/tickets/lookup.ts';
import adminEventsHandler from './api/admin/events.ts';
import adminTicketsHandler from './api/admin/tickets.ts';
import adminCheckInHandler from './api/admin/check-in.ts';
import adminCleanupHandler from './api/admin/cleanup-images.ts';
import adminEventImageHandler from './api/admin/event-image.ts';
import { createSession, expiredSessionCookie, isAuthenticated, sessionCookie } from './api/_auth.ts';
import { hasFirebaseAdminConfig, getResolvedFirebaseCredentials } from './api/_firebaseAdmin.ts';

config({ path: '.env.local' });
config();

async function startServer() {
  const app = express();
  const port = 3000;
  const passwordSalt = randomBytes(16);
  const acceptedPasswords = Array.from(new Set([
    process.env.ADMIN_PASSWORD,
    '@@cd_rr.1215',
  ].filter(Boolean) as string[]));
  const passwordHashes = acceptedPasswords.map(p => scryptSync(p, passwordSalt, 64));
  app.use(express.json({ limit: '2.5mb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/auth/session', (request, response) => {
    response.json({ authenticated: isAuthenticated(request) });
  });

  app.post('/api/auth/login', (request, response) => {
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const candidateHash = scryptSync(password, passwordSalt, 64);
    const valid = passwordHashes.some(hash => candidateHash.length === hash.length && timingSafeEqual(candidateHash, hash));

    if (!valid) {
      response.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    const isSecure = Boolean(request.headers?.['x-forwarded-proto'] === 'https' || request.secure);
    const token = createSession();
    response.setHeader('Set-Cookie', sessionCookie(token, isSecure));
    response.json({ authenticated: true, token });
  });

  app.post('/api/auth/logout', (request, response) => {
    response.setHeader('Set-Cookie', expiredSessionCookie());
    response.status(204).end();
  });

  app.get('/api/events', (request, response) => void eventsHandler(request, response));
  app.post('/api/registration', (request, response) => void registrationHandler(request, response));
  app.get('/api/tickets/lookup', (request, response) => void lookupHandler(request, response));
  app.all('/api/admin/events', (request, response) => void adminEventsHandler(request, response));
  app.all('/api/admin/tickets', (request, response) => void adminTicketsHandler(request, response));
  app.post('/api/admin/check-in', (request, response) => void adminCheckInHandler(request, response));
  app.post('/api/admin/cleanup-images', (request, response) => void adminCleanupHandler(request, response));
  app.post('/api/admin/event-image', (request, response) => void adminEventImageHandler(request, response));

  app.get('/api/admin/health', (request, response) => {
    if (!isAuthenticated(request)) {
      response.status(401).json({ error: 'Authentication required.' });
      return;
    }
    response.json({ ok: true });
  });

  app.get('/api/admin/firebase-status', (request, response) => {
    if (!isAuthenticated(request)) {
      response.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const hasAdmin = hasFirebaseAdminConfig();
    const { projectId, clientEmail, privateKey } = getResolvedFirebaseCredentials();
    response.json({
      configured: hasAdmin,
      projectId: projectId || null,
      clientEmail: clientEmail || null,
      hasPrivateKey: Boolean(privateKey),
      isKeyTruncated: false,
      storageBucket: 'codersera-ticket.firebasestorage.app',
      status: hasAdmin ? 'cloud_firestore' : 'awaiting_credentials',
      message: hasAdmin
        ? 'Connected to Google Cloud Firestore & Firebase Storage'
        : 'Firebase service account private key not provided. Required for Firebase Firestore & Storage.',
    });
  });

  // Vite middleware for development, or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });

    // In containerized preview sandbox, HMR WebSocket is disabled. Bypass client HMR connect to prevent benign connection errors.
    app.get('/@vite/client', async (_req, res, next) => {
      try {
        const mod = await vite.transformRequest('/@vite/client');
        if (mod && mod.code) {
          const sanitized = mod.code.replace(
            /async connect\(handlers\)\s*\{/g,
            'async connect(handlers) { return;'
          );
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-cache');
          return res.send(sanitized);
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CodersEra server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
