import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

const HOST = '0.0.0.0';
const PORT_STR = process.env.PORT;
if (!PORT_STR) {
  // fallar ruidoso si no existe PORT (mejor que "andar en 8080" y morir con SIGTERM)
  console.error('[sanitizer] FALTA process.env.PORT');
  process.exit(1);
}
const PORT = Number(PORT_STR);

import fastify from 'fastify';
const app = fastify({ logger: true });

app.get('/healthz', async () => ({ ok: true }));

app.listen({ host: HOST, port: PORT }).then(() => {
  console.log('[sanitizer] PORT =', PORT);
  console.log(`[sanitizer] listening on ${HOST}:${PORT}`);
}).catch((err) => {
  console.error('listen failed', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  try { await app.close(); } finally { process.exit(0); }
});