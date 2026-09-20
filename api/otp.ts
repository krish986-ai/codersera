import { jsonBody, methodNotAllowed } from '../lib/_http.js';
import { firestore } from '../lib/_firebaseAdmin.js';
import nodemailer from 'nodemailer';

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

export default async function handler(request: any, response: any) {
  try {
    const url = request.url || '';
    const path = new URL(url, `https://${request.headers.host}`).pathname;
    const isSend = path.endsWith('/otp/send') || path === '/api/otp/send';
    const isVerify = path.endsWith('/otp/verify') || path === '/api/otp/verify';
    const db = firestore();

    if (!isSend && !isVerify) {
      console.log('OTP handler: path not matched', path);
      return methodNotAllowed(response, ['POST']);
    }

    if (request.method !== 'POST') {
      return methodNotAllowed(response, ['POST']);
    }

    const body = jsonBody(request);
    console.log('OTP handler: request body', body);

    if (isSend) {
      const { email, purpose = 'registration' } = body;
      if (!email || typeof email !== 'string') {
        return response.status(400).json({ error: 'Email is required.' });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const code = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      await db.collection('otps').doc(normalizedEmail).set({ code, email: normalizedEmail, purpose, expiresAt, attempts: 0 });
      try {
        await sendOtpEmail(normalizedEmail, code, purpose === 'registration' ? 'registration' : 'login');
        return response.status(200).json({ success: true, message: 'OTP sent to your email.' });
      } catch (error) {
        console.error('Failed to send OTP email:', error);
        await db.collection('otps').doc(normalizedEmail).delete();
        return response.status(500).json({ error: 'Failed to send OTP. Check SMTP configuration.' });
      }
    }

    if (isVerify) {
      const { email, code } = body;
      if (!email || !code) {
        return response.status(400).json({ error: 'Email and code are required.' });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const doc = await db.collection('otps').doc(normalizedEmail).get();
      if (!doc.exists) {
        return response.status(400).json({ error: 'No OTP found for this email. Request a new one.' });
      }
      const record = doc.data()!;
      if (Date.now() > record.expiresAt) {
        await db.collection('otps').doc(normalizedEmail).delete();
        return response.status(400).json({ error: 'OTP has expired. Request a new one.' });
      }
      if (record.attempts >= 5) {
        await db.collection('otps').doc(normalizedEmail).delete();
        return response.status(400).json({ error: 'Too many attempts. Request a new OTP.' });
      }
      record.attempts++;
      if (record.code !== code) {
        await db.collection('otps').doc(normalizedEmail).update({ attempts: record.attempts });
        return response.status(400).json({ error: 'Invalid code. Please try again.' });
      }
      await db.collection('otps').doc(normalizedEmail).delete();
      return response.status(200).json({ success: true, verified: true });
    }

    return methodNotAllowed(response, ['POST']);
  } catch (error) {
    console.error('OTP handler error:', error);
    return response.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
}