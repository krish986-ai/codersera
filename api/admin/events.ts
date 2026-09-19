import { firestore } from '../_firebaseAdmin.js';
import { requireAdmin } from '../_requireAdmin.js';
import { jsonBody, methodNotAllowed } from '../_http.js';
export default async function handler(request: any, response: any) {
  if (!requireAdmin(request, response)) return;
  const db = firestore();
  try {
    if (request.method === 'GET') return response.status(200).json((await db.collection('events').get()).docs.map(d => d.data()));
    const body = jsonBody(request);
    if (request.method === 'POST') {
      const event = body.event;
      if (!event?.id) return response.status(400).json({ error: 'Invalid event.' });
      const normalized = {
        ...event,
        generatedPasses: Number(event.generatedPasses ?? 0),
        availableSeats: Math.max(0, Number(event.totalSeats) - Number(event.generatedPasses ?? 0)),
        isFeatured: Boolean(event.isFeatured),
      };
      const batch = db.batch();
      if (normalized.isFeatured) {
        (await db.collection('events').get()).docs.forEach(doc => batch.update(doc.ref, { isFeatured: false }));
      }
      batch.set(db.collection('events').doc(event.id), normalized);
      await batch.commit();
      return response.status(200).json(normalized);
    }
    const id = String(body.id || request.query?.id || '');
    if (!id) return response.status(400).json({ error: 'Event id required.' });
    if (request.method === 'DELETE') { await db.collection('events').doc(id).delete(); return response.status(204).end(); }
    if (request.method === 'PATCH') {
      const ref = db.collection('events').doc(id);
      const current = (await ref.get()).data() as any;
      if (!current) return response.status(404).json({ error: 'Event not found.' });
      const updates = { ...(body.updates || {}) };
      const generatedPasses = Number(current.generatedPasses ?? (Number(current.totalSeats) - Number(current.availableSeats)));
      delete updates.availableSeats;
      delete updates.generatedPasses;
      const normalized = {
        ...updates,
        ...(updates.totalSeats !== undefined ? { availableSeats: Math.max(0, Number(updates.totalSeats) - generatedPasses) } : {}),
      };
      const batch = db.batch();
      if (normalized.isFeatured) {
        (await db.collection('events').get()).docs.forEach(doc => {
          if (doc.id !== id) batch.update(doc.ref, { isFeatured: false });
        });
      }
      batch.update(ref, normalized);
      await batch.commit();
      return response.status(200).json({ success: true });
    }
    return methodNotAllowed(response, ['GET', 'POST', 'PATCH', 'DELETE']);
  } catch { response.status(503).json({ error: 'Event operation failed.' }); }
}
