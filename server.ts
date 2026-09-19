import { config } from 'dotenv';
import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import eventsHandler from './api/events.ts';
import registrationHandler from './api/registration.ts';
import lookupHandler from './api/tickets/lookup.ts';
import adminEventsHandler from './api/admin/events.ts';
import adminTicketsHandler from './api/admin/tickets.ts';
import adminCheckInHandler from './api/admin/check-in.ts';
import adminCleanupHandler from './api/admin/cleanup-images.ts';
import adminEventImageHandler from './api/admin/event-image.ts';
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
app.use(express.json({ limit: '2.5mb' }));

// OTP storage (in-memory for local dev; use Redis in production)
interface OtpRecord {
  code: string;
  email: string;
  purpose: 'registration' | 'login';
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OtpRecord>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

async function sendOtpEmail(email: string, code: string, purpose: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('SMTP not configured; OTP would be:', code);
    return true;
  }
  await transporter.sendMail({
    from: `"CodersEra Tickets" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your CodersEra ${purpose} code: ${code}`,
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#06b6d4">CodersEra Verification</h2><p>Your ${purpose} code:</p><div style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#06b6d4;background:#0f172a;padding:16px;border-radius:8px;text-align:center;font-family:monospace">${code}</div><p style="color:#64748b;font-size:14px">Expires in 10 minutes. Do not share this code.</p></div>`,
  });
  return true;
}

// OTP Endpoints
app.post('/api/otp/send', async (request, response) => {
  const { email, purpose = 'registration' } = request.body || {};
  if (!email || typeof email !== 'string') {
    return response.status(400).json({ error: 'Email is required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const code = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(normalizedEmail, { code, email: normalizedEmail, purpose, expiresAt, attempts: 0 });
  try {
    await sendOtpEmail(normalizedEmail, code, purpose === 'registration' ? 'registration' : 'login');
    response.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    otpStore.delete(normalizedEmail);
    response.status(500).json({ error: 'Failed to send OTP. Check SMTP configuration.' });
  }
});

app.post('/api/otp/verify', (request, response) => {
  const { email, code } = request.body || {};
  if (!email || !code) {
    return response.status(400).json({ error: 'Email and code are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  if (!record) {
    return response.status(400).json({ error: 'No OTP found for this email. Request a new one.' });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return response.status(400).json({ error: 'OTP has expired. Request a new one.' });
  }
  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return response.status(400).json({ error: 'Too many attempts. Request a new OTP.' });
  }
  record.attempts++;
  if (record.code !== code) {
    return response.status(400).json({ error: 'Invalid code. Please try again.' });
  }
  otpStore.delete(normalizedEmail);
  response.json({ success: true, verified: true });
});

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) otpStore.delete(key);
  }
}, 5 * 60 * 1000);

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
app.post('/api/admin/event-image', (request, response) => void adminEventImageHandler(request, response));

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
