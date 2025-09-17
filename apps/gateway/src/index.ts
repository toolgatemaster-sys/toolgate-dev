import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8080);

import { createGateway } from './server.js';

async function start() {
  const app = await createGateway();
  
  await app.listen({ host: HOST, port: PORT });
  console.log(`[gateway] listening on ${HOST}:${PORT}`);
}

start().catch((err) => {
  console.error('listen failed', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  try { process.exit(0); } catch (e) { process.exit(1); }
});