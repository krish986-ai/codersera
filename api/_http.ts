export function jsonBody(request: any) {
  if (typeof request.body === 'object' && request.body) return request.body;
  try { return JSON.parse(request.body || '{}'); } catch { return {}; }
}

export function methodNotAllowed(response: any, methods: string[]) {
  response.setHeader('Allow', methods.join(', '));
  response.status(405).json({ error: 'Method not allowed.' });
}
