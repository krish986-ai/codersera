import { randomUUID } from 'node:crypto';
import { requireAdmin } from '../_requireAdmin.js';
import { storageBucket } from '../_firebaseAdmin.js';
import { jsonBody, methodNotAllowed } from '../_http.js';

const MAX_BYTES = 1.5 * 1024 * 1024;

export default async function handler(request: any, response: any) {
  if (!requireAdmin(request, response)) return;
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
    response.status(200).json({ url });
  } catch (error) {
    console.error('Featured event image upload failed', error);
    response.status(503).json({ error: 'Image upload is temporarily unavailable.' });
  }
}
