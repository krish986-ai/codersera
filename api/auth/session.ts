import { isAuthenticated } from '../_auth.js';
import { noStore } from '../_http.js';

export default function handler(request: any, response: any) {
  noStore(response);
  response.status(200).json({ authenticated: isAuthenticated(request) });
}
