import { firestore } from '../_firebaseAdmin.js';
import { requireAdmin } from '../_requireAdmin.js';
import { jsonBody, methodNotAllowed } from '../_http.js';
export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  if (!requireAdmin(request, response)) return;
  const { ticketId, qrPayload } = jsonBody(request);
  if (!ticketId) return response.status(400).json({ error: 'Ticket id required.' });
  try {
    const ticket = await firestore().runTransaction(async (tx) => {
      const ref = firestore().collection('tickets').doc(String(ticketId));
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const data = snap.data() as any;
      if (qrPayload && qrPayload !== data.qrPayload) throw new Error('INVALID_QR');
      const updated = { ...data, checkedIn: !data.checkedIn, checkedInAt: !data.checkedIn ? new Date().toISOString() : null };
      tx.set(ref, updated); return updated;
    });
    response.status(200).json({ success: true, ticket });
  } catch (error: any) {
    response.status(error.message === 'INVALID_QR' ? 400 : error.message === 'NOT_FOUND' ? 404 : 503).json({ error: error.message === 'INVALID_QR' ? 'Invalid QR payload.' : 'Check-in failed.' });
  }
}
