import { expiredSessionCookie } from '../_auth.js';

export default function handler(request: any, response: any) {
  response.setHeader('Set-Cookie', expiredSessionCookie);
  response.status(204).end();
}
