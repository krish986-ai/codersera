import { firestore } from '../_firebaseAdmin.js';
import { requireAdmin } from '../_requireAdmin.js';
export default async function handler(request: any, response: any) {
  if (!requireAdmin(request, response)) return;
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed.' });
  const eventId = String(request.body?.eventId || request.query?.eventId || '');
  const snap = await firestore().collection('tickets').get();
  const affected = snap.docs.filter(d => (!eventId || d.data().eventId === eventId) && d.data().photoBase64);
  await Promise.all(affected.map(d => d.ref.update({ photoBase64: null, isPhotoCleanedUp: true })));
  response.status(200).json({ count: affected.length });
}
