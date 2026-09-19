import { jsonBody, methodNotAllowed } from '../_http.js';

interface OtpRecord {
  code: string;
  email: string;
  purpose: 'registration' | 'login';
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) otpStore.delete(key);
  }
}, 5 * 60 * 1000);

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const { email, code } = jsonBody(request);
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
  response.status(200).json({ success: true, verified: true });
}