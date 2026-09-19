import { config } from 'dotenv';
import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import eventsHandler from './api/events.ts';
import registrationHandler from './api/registration.ts';
import lookupHandler from './api/tickets/lookup.ts';
import adminHandler from './api/admin.ts';
import authHandler from './api/auth.ts';
import otpHandler from './api/otp.ts';
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
app.all('/api/otp/send', (request, response) => void otpHandler(request, response));
app.all('/api/otp/verify', (request, response) => void otpHandler(request, response));

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) otpStore.delete(key);
  }
}, 5 * 60 * 1000);

// Auth routes
app.all('/api/auth/login', (request, response) => void authHandler(request, response));
app.all('/api/auth/logout', (request, response) => void authHandler(request, response));
app.all('/api/auth/session', (request, response) => void authHandler(request, response));

app.get('/api/events', (request, response) => void eventsHandler(request, response));
app.post('/api/registration', (request, response) => void registrationHandler(request, response));
app.get('/api/tickets/lookup', (request, response) => void lookupHandler(request, response));

// Admin routes
app.all('/api/admin/tickets', (request, response) => void adminHandler(request, response));
app.all('/api/admin/events', (request, response) => void adminHandler(request, response));
app.all('/api/admin/check-in', (request, response) => void adminHandler(request, response));
app.all('/api/admin/cleanup-images', (request, response) => void adminHandler(request, response));
app.all('/api/admin/event-image', (request, response) => void adminHandler(request, response));

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
