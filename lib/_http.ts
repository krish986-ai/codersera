export async function jsonBody(request: any) {
  if (typeof request.body === 'object' && request.body) return request.body;
  if (typeof request.body === 'string') {
    try { return JSON.parse(request.body); } catch { return {}; }
  }
  // Handle ReadableStream (Vercel serverless)
  if (request.body && typeof request.body.getReader === 'function') {
    const reader = request.body.getReader();
    const chunks = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    const buffer = Buffer.concat(chunks.map(c => Buffer.from(c)));
    const text = buffer.toString('utf-8');
    try { return JSON.parse(text); } catch { return {}; }
  }
  return {};
}

export function noStore(response: any) {
  response.setHeader('Cache-Control', 'private, no-store, max-age=0');
}

export function methodNotAllowed(response: any, methods: string[]) {
  noStore(response);
  response.setHeader('Allow', methods.join(', '));
  response.status(405).json({ error: 'Method not allowed.' });
}
