export async function jsonBody(request: any) {
  console.log('jsonBody: request.body type:', typeof request.body, 'constructor:', request.body?.constructor?.name);
  
  if (typeof request.body === 'object' && request.body) return request.body;
  if (typeof request.body === 'string') {
    try { return JSON.parse(request.body); } catch { return {}; }
  }
  // Handle Buffer directly
  if (Buffer.isBuffer(request.body)) {
    try { return JSON.parse(request.body.toString('utf-8')); } catch { return {}; }
  }
  // Handle ReadableStream (Vercel serverless)
  if (request.body && typeof request.body.getReader === 'function') {
    try {
      const reader = request.body.getReader();
      const chunks = [];
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(Buffer.from(value));
      }
      const buffer = Buffer.concat(chunks);
      const text = buffer.toString('utf-8');
      try { return JSON.parse(text); } catch { return {}; }
    } catch {
      return {};
    }
  }
  // Fallback: try to read from request.rawBody or request._body
  if (request.rawBody) {
    try { return JSON.parse(request.rawBody.toString('utf-8')); } catch { return {}; }
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
