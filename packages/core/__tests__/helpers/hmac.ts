import { createHmac } from 'node:crypto';

export function hmacHeader(body: any, key: string, headerName = "x-toolgate-sig") {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const sig = createHmac('sha256', key).update(payload, 'utf8').digest('hex');
  return { [headerName]: sig, 'content-type': 'application/json' };
}

export function signRequest(body: string, key: string): string {
  return createHmac('sha256', key).update(body, 'utf8').digest('hex');
}
