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
    if (request.method === 'DELETE') {
      await db.runTransaction(async (tx) => {
        const ticketRef = db.collection('tickets').doc(id);
        const ticketSnap = await tx.get(ticketRef);
        if (!ticketSnap.exists) throw new Error('NOT_FOUND');
        const ticket = ticketSnap.data() as any;
        const eventRef = db.collection('events').doc(String(ticket.eventId));
        const eventSnap = await tx.get(eventRef);
        tx.delete(ticketRef);
        if (eventSnap.exists) {
          const event = eventSnap.data() as any;
          tx.update(eventRef, {
            availableSeats: Math.min(Number(event.totalSeats) || 0, Number(event.availableSeats || 0) + 1),
            generatedPasses: Math.max(0, Number(event.generatedPasses || 0) - 1),
          });
        }
      });
      return response.status(204).end();
    }
    if (request.method === 'PATCH') {
      const updates = body.updates || {};
      await db.runTransaction(async (tx) => {
        const ref = db.collection('tickets').doc(id);
        const currentSnap = await tx.get(ref);
        if (!currentSnap.exists) throw new Error('NOT_FOUND');
        const current = currentSnap.data() as any;
        const email = updates.email === undefined ? current.email : String(updates.email).trim().toLowerCase();
        const rollNumber = updates.rollNumber === undefined ? current.rollNumber : String(updates.rollNumber).trim().toUpperCase();
        if (!/^\S+@\S+\.\S+$/.test(email) || !rollNumber) throw new Error('INVALID');
        if (email !== current.email || rollNumber !== current.rollNumber) {
          const matches = await tx.get(db.collection('tickets').where('eventId', '==', current.eventId));
          if (matches.docs.some(doc => doc.id !== id && (String(doc.data().email).toLowerCase() === email || String(doc.data().rollNumber).toUpperCase() === rollNumber))) throw new Error('DUPLICATE');
        }
        const permitted = ['fullName', 'email', 'rollNumber', 'collegeName', 'branch', 'year', 'phoneNumber', 'githubUrl', 'linkedinUrl', 'photoBase64', 'isPhotoCleanedUp'];
        const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => permitted.includes(key)));
        tx.update(ref, { ...safeUpdates, email, rollNumber, qrPayload: `${current.id}|${email}|${rollNumber}|${current.eventId}` });
      });
      return response.status(200).json({ success: true });
    }
    return methodNotAllowed(response, ['GET', 'PATCH', 'DELETE']);
  } catch (error: any) {
    const message = error?.message === 'NOT_FOUND' ? 'Ticket not found.' : error?.message === 'DUPLICATE' ? 'An attendee with this email or ID already has a ticket for this event.' : error?.message === 'INVALID' ? 'Enter a valid email and attendee ID.' : 'Ticket operation failed.';
    response.status(error?.message === 'NOT_FOUND' ? 404 : error?.message === 'DUPLICATE' || error?.message === 'INVALID' ? 409 : 503).json({ error: message });
  }
}
