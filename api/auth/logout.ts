import { expiredSessionCookie } from '../_auth.js';
import { noStore } from '../_http.js';

export default function handler(request: any, response: any) {
  noStore(response);
  response.setHeader('Set-Cookie', expiredSessionCookie());
  response.status(204).end();
}
