import { firestore } from '../_firebaseAdmin.js';
import { requireAdmin } from '../_requireAdmin.js';
import { jsonBody, methodNotAllowed } from '../_http.js';
import { randomUUID } from 'node:crypto';
import { storageBucket } from '../_firebaseAdmin.js';

const MAX_BYTES = 1.5 * 1024 * 1024;

export default async function handler(request: any, response: any) {
  if (!requireAdmin(request, response)) return;
  const db = firestore();
  const url = request.url || '';
  const isTickets = url.includes('/admin/tickets');
  const isEvents = url.includes('/admin/events');
  const isCheckIn = url.includes('/admin/check-in');
  const isCleanup = url.includes('/admin/cleanup-images');
  const isImage = url.includes('/admin/event-image');

  try {
    // TICKETS
    if (isTickets) {
      if (request.method === 'GET') {
        return response.status(200).json((await db.collection('tickets').get()).docs.map(d => d.data()));
      }
      const body = jsonBody(request);
      const id = String(body.id || request.query?.id || '');
      if (!id) return response.status(400).json({ error: 'Ticket id required.' });
      if (request.method === 'DELETE') {
        await db.collection('tickets').doc(id).delete();
        return response.status(204).end();
      }
      if (request.method === 'PATCH') {
        await db.collection('tickets').doc(id).update(body.updates || {});
        return response.status(200).json({ success: true });
      }
      return methodNotAllowed(response, ['GET', 'PATCH', 'DELETE']);
    }

    // EVENTS
    if (isEvents) {
      if (request.method === 'GET') {
        return response.status(200).json((await db.collection('events').get()).docs.map(d => d.data()));
      }
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
      if (request.method === 'DELETE') {
        await db.collection('events').doc(id).delete();
        return response.status(204).end();
      }
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
    }

    // CHECK-IN
    if (isCheckIn) {
      if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
      const { ticketId, qrPayload } = jsonBody(request);
      if (!ticketId) return response.status(400).json({ error: 'Ticket id required.' });
      const ticket = await db.runTransaction(async (tx) => {
        const ref = db.collection('tickets').doc(String(ticketId));
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error('NOT_FOUND');
        const data = snap.data() as any;
        if (qrPayload && qrPayload !== data.qrPayload) throw new Error('INVALID_QR');
        const updated = { ...data, checkedIn: !data.checkedIn, checkedInAt: !data.checkedIn ? new Date().toISOString() : null };
        tx.set(ref, updated);
        return updated;
      });
      return response.status(200).json({ success: true, ticket });
    }

    // CLEANUP IMAGES
    if (isCleanup) {
      if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
      const eventId = String(request.body?.eventId || request.query?.eventId || '');
      const snap = await db.collection('tickets').get();
      const affected = snap.docs.filter(d => (!eventId || d.data().eventId === eventId) && d.data().photoBase64);
      await Promise.all(affected.map(d => d.ref.update({ photoBase64: null, isPhotoCleanedUp: true })));
      return response.status(200).json({ count: affected.length });
    }

    // EVENT IMAGE UPLOAD
    if (isImage) {
      if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
      const { eventId, dataUrl } = jsonBody(request);
      if (typeof eventId !== 'string' || typeof dataUrl !== 'string') {
        return response.status(400).json({ error: 'Event and image are required.' });
      }
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
      if (!match) return response.status(400).json({ error: 'Only JPG, PNG, WEBP, or GIF images are supported.' });
      const buffer = Buffer.from(match[2], 'base64');
      if (!buffer.length || buffer.length > MAX_BYTES) return response.status(413).json({ error: 'Featured images must be 1.5 MB or smaller.' });
      try {
        const extension = match[1].split('/')[1].replace('jpeg', 'jpg');
        const file = storageBucket().file(`events/${eventId}/featured-${randomUUID()}.${extension}`);
        await file.save(buffer, { metadata: { contentType: match[1], cacheControl: 'public,max-age=31536000,immutable' } });
        const [url] = await file.getSignedUrl({ action: 'read', expires: '01-01-2036' });
        return response.status(200).json({ url });
      } catch (error) {
        console.error('Featured event image upload failed', error);
        return response.status(503).json({ error: 'Image upload is temporarily unavailable.' });
      }
    }

    return methodNotAllowed(response, ['GET', 'POST', 'PATCH', 'DELETE']);
  } catch (error) {
    console.error('Admin API error:', error);
    return response.status(503).json({ error: 'Operation failed.' });
  }
}