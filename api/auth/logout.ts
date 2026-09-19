import { expiredSessionCookie } from '../_auth';

export default function handler(request: any, response: any) {
  response.setHeader('Set-Cookie', expiredSessionCookie);
  response.status(204).end();
}
