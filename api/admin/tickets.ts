import { firestore } from '../_firebaseAdmin.js';
import { requireAdmin } from '../_requireAdmin.js';
import { jsonBody, methodNotAllowed } from '../_http.js';
export default async function handler(request: any, response: any) {
  if (!requireAdmin(request, response)) return;
  const db = firestore();
  try {
    if (request.method === 'GET') return response.status(200).json((await db.collection('tickets').get()).docs.map(d => d.data()));
    const body = jsonBody(request); const id = String(body.id || request.query?.id || '');
    if (!id) return response.status(400).json({ error: 'Ticket id required.' });
    if (request.method === 'DELETE') { await db.collection('tickets').doc(id).delete(); return response.status(204).end(); }
    if (request.method === 'PATCH') { await db.collection('tickets').doc(id).update(body.updates || {}); return response.status(200).json({ success: true }); }
    return methodNotAllowed(response, ['GET', 'PATCH', 'DELETE']);
  } catch { response.status(503).json({ error: 'Ticket operation failed.' }); }
}
