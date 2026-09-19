import { firestore } from './_firebaseAdmin.js';
import { INITIAL_EVENTS } from '../src/lib/storage.js';
import { methodNotAllowed } from './_http.js';

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  try {
    const snap = await firestore().collection('events').where('isActive', '==', true).get();
    if (snap.empty) {
      await Promise.all(INITIAL_EVENTS.map((event) => firestore().collection('events').doc(event.id).set(event)));
      return response.status(200).json(INITIAL_EVENTS);
    }
    response.status(200).json(snap.docs.map((doc) => {
      const event = doc.data() as any;
      return {
        ...event,
        generatedPasses: Number(event.generatedPasses ?? (Number(event.totalSeats) - Number(event.availableSeats))),
        isFeatured: Boolean(event.isFeatured),
      };
    }));
  } catch (error) {
    console.error('Public event listing failed', error);
    response.status(503).json({ error: 'Events are temporarily unavailable.' });
  }
}
