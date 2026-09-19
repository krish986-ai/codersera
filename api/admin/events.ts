import { firestore } from '../_firebaseAdmin.js';
import { requireAdmin } from '../_requireAdmin.js';
import { jsonBody, methodNotAllowed } from '../_http.js';
export default async function handler(request: any, response: any) {
  if (!requireAdmin(request, response)) return;
  const db = firestore();
  try {
    if (request.method === 'GET') return response.status(200).json((await db.collection('events').get()).docs.map(d => d.data()));
    const body = jsonBody(request);
    if (request.method === 'POST') { const event = body.event; if (!event?.id) return response.status(400).json({ error: 'Invalid event.' }); await db.collection('events').doc(event.id).set(event); return response.status(200).json(event); }
    const id = String(body.id || request.query?.id || '');
    if (!id) return response.status(400).json({ error: 'Event id required.' });
    if (request.method === 'DELETE') { await db.collection('events').doc(id).delete(); return response.status(204).end(); }
    if (request.method === 'PATCH') { await db.collection('events').doc(id).update(body.updates || {}); return response.status(200).json({ success: true }); }
    return methodNotAllowed(response, ['GET', 'POST', 'PATCH', 'DELETE']);
  } catch { response.status(503).json({ error: 'Event operation failed.' }); }
}
