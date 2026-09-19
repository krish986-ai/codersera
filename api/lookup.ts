import { firestore } from '../lib/_firebaseAdmin.js';
import { methodNotAllowed } from '../lib/_http.js';

export default async function handler(request: any, response: any) {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET']);
  const query = String(request.query?.q || '').trim().toLowerCase();
  if (query.length < 3 || query.length > 120) return response.status(400).json({ error: 'Enter a valid lookup value.' });
  try {
    const db = firestore();
    const [id, email, roll] = await Promise.all([
      db.collection('tickets').doc(query.toUpperCase()).get(),
      db.collection('tickets').where('email', '==', query).limit(10).get(),
      db.collection('tickets').where('rollNumber', '==', query.toUpperCase()).limit(10).get(),
    ]);
    const docs = [id.exists ? id : null, ...email.docs, ...roll.docs].filter(Boolean);
    const unique = [...new Map(docs.map((d: any) => [d.id, d.data()])).values()];
    response.status(200).json(unique);
  } catch (error) {
    console.error('Public ticket lookup failed', error);
    response.status(503).json({ error: 'Ticket lookup is temporarily unavailable.' });
  }
}