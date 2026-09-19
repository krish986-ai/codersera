export function jsonBody(request: any) {
  if (typeof request.body === 'object' && request.body) return request.body;
  if (typeof request.body === 'string') {
    try { return JSON.parse(request.body); } catch { return {}; }
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
