import { firestore } from '../lib/_firebaseAdmin.js';
import { jsonBody, methodNotAllowed } from '../lib/_http.js';

export default async function handler(request: any, response: any) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST']);
  const ticket = jsonBody(request).ticket;
  if (!ticket || typeof ticket !== 'object' || !ticket.id || !ticket.eventId || !ticket.email || !ticket.rollNumber || !ticket.qrPayload) {
    return response.status(400).json({ error: 'Incomplete registration.' });
  }
  const email = String(ticket.email).trim().toLowerCase();
  const rollNumber = String(ticket.rollNumber).trim().toUpperCase();
  if (!ticket.gdprConsent || ticket.qrPayload !== `${ticket.id}|${email}|${rollNumber}|${ticket.eventId}`) {
    return response.status(400).json({ error: 'Invalid registration payload.' });
  }
  try {
    const db = firestore();
    const result = await db.runTransaction(async (tx) => {
      const eventRef = db.collection('events').doc(String(ticket.eventId));
      const ticketRef = db.collection('tickets').doc(String(ticket.id));
      const eventSnap = await tx.get(eventRef);
      if (!eventSnap.exists) throw new Error('EVENT_NOT_FOUND');
      const event = eventSnap.data() as any;
      const existing = await tx.get(db.collection('tickets').where('eventId', '==', ticket.eventId));
      if (existing.docs.some((doc) => {
        const data = doc.data();
        return String(data.email).toLowerCase() === email || String(data.rollNumber).toUpperCase() === rollNumber;
      })) throw new Error('DUPLICATE');
      if (Number(event.availableSeats) <= 0) throw new Error('SOLD_OUT');
      tx.set(ticketRef, { ...ticket, email, rollNumber, eventTitle: event.title, createdAt: new Date().toISOString() });
      tx.update(eventRef, {
        availableSeats: Number(event.availableSeats) - 1,
        generatedPasses: Number(event.generatedPasses ?? (Number(event.totalSeats) - Number(event.availableSeats))) + 1,
      });
      return { ...ticket, email, rollNumber, eventTitle: event.title };
    });
    response.status(201).json(result);
  } catch (error: any) {
    const status = error.message === 'DUPLICATE' ? 409 : error.message === 'SOLD_OUT' ? 409 : error.message === 'EVENT_NOT_FOUND' ? 404 : 503;
    response.status(status).json({ error: error.message === 'DUPLICATE' ? 'A ticket already exists for this attendee.' : error.message === 'SOLD_OUT' ? 'This event is sold out.' : 'Registration is temporarily unavailable.' });
  }
}
