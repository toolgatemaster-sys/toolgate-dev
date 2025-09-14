import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8080);

import Fastify from 'fastify';
import cors from '@fastify/cors';

type ProxyBody = {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  traceId?: string;
};

const app = Fastify({ logger: true });

// Error handler global
app.setErrorHandler((err, req, reply) => {
  req.log.error({ err }, "unhandled error");
  if (!reply.sent) reply.code(500).send({ error: "internal_error" });
});

await app.register(cors, { origin: true });

// Health check
app.get('/healthz', async () => ({ ok: true }));

// Carga segura de ALLOW_HOSTS
const raw = process.env.ALLOW_HOSTS ?? '';
const ALLOW_SET = new Set(
  raw.split(',').map(h => h.trim().toLowerCase()).filter(Boolean)
);

function isAllowed(urlStr: string) {
  let host: string;
  try { host = new URL(urlStr).hostname.toLowerCase(); }
  catch { return false; }
  return ALLOW_SET.has(host);
}

const COLLECTOR_URL = process.env.COLLECTOR_URL!;
const HMAC_KEY = process.env.HMAC_KEY ?? 'replace-me';

// Utilidad fire-and-forget para emitir eventos
async function emitEvent(evt: any) {
  try {
    await fetch(`${COLLECTOR_URL}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(evt),
    });
  } catch (e) {
    console.error('emitEvent failed', e);
  }
}

app.post('/v1/proxy', async (req, reply) => {
  const body = req.body as ProxyBody;

  if (!body?.url) {
    return reply.code(400).send({ error: 'Missing url' });
  }
  
  if (!isAllowed(body.url)) {
    await emitEvent({
      traceId: body.traceId ?? crypto.randomUUID(),
      type: 'gate.decision',
      ts: new Date().toISOString(),
      attrs: { allowed: false, reason: 'host_not_in_allowlist', url: body.url }
    });
    return reply.code(403).send({ error: 'Host not allowed' });
  }

  const method = (body.method ?? 'GET').toUpperCase();
  const headers = new Headers(body.headers ?? {});
  headers.set('x-toolgate-sig', HMAC_KEY);

  try {
    const upstream = await fetch(body.url, {
      method,
      headers,
      body: ['GET','HEAD'].includes(method) ? undefined : JSON.stringify(body.body),
    });

    const text = await upstream.text();

    // Evento al collector (no bloqueante)
    emitEvent({
      traceId: body.traceId ?? crypto.randomUUID(),
      type: 'proxy.forward',
      ts: new Date().toISOString(),
      attrs: {
        url: body.url,
        status: upstream.status,
        ok: upstream.ok
      }
    });

    reply.code(upstream.status);
    return reply.headers(Object.fromEntries(upstream.headers)).send(text);

  } catch (err: any) {
    // 502: upstream falló
    emitEvent({
      traceId: body.traceId ?? crypto.randomUUID(),
      type: 'proxy.error',
      ts: new Date().toISOString(),
      attrs: { url: body.url, message: String(err) }
    });
    return reply.code(502).send({ error: 'Upstream error', detail: String(err) });
  }
});

await app.listen({ host: HOST, port: PORT });
app.log.info(`gateway listening on ${HOST}:${PORT}`);