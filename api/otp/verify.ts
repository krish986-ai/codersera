import { jsonBody, methodNotAllowed } from '../_http.js';
import { firestore } from '../_firebaseAdmin.js';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const { email, code } = jsonBody(request);
  if (!email || !code) {
    return response.status(400).json({ error: 'Email and code are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const db = firestore();
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
  response.status(200).json({ success: true, verified: true });
}