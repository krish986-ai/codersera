import { isAuthenticated } from './_auth.js';

export function requireAdmin(request: any, response: any): boolean {
  if (!isAuthenticated(request)) {
    response.status(401).json({ error: 'Administrator authentication required.' });
    return false;
  }
  return true;
}
