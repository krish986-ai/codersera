import { isAuthenticated } from '../_auth.js';

export default function handler(request: any, response: any) {
  response.status(200).json({ authenticated: isAuthenticated(request) });
}
