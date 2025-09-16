import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');
import fastify from 'fastify';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT ?? 8080);
const app = fastify({ logger: true });
// health & raíz (como sanitizer)
app.get('/', async () => ({ ok: true, service: 'collector' }));
const EventSchema = z.object({
    traceId: z.string().min(1),
    type: z.string().min(1),
    ts: z.string().min(1),
    attrs: z.record(z.unknown()).default({}),
});
let storage;
let storageKind = 'memory';
// memoria
const MemStorage = (() => {
    const traces = new Map();
    return {
        async insert(ev) {
            const arr = traces.get(ev.traceId) ?? [];
            arr.push(ev);
            traces.set(ev.traceId, arr);
        },
        async listByTrace(id) {
            return traces.get(id) ?? [];
        }
    };
})();
// si hay DATABASE_URL, intenta PG
if (process.env.DATABASE_URL) {
    try {
        const { PgStorage } = await import('./storage.pg.js'); // transpila a .js
        const pg = new PgStorage(process.env.DATABASE_URL);
        await pg.init();
        storage = {
            insert: (ev) => pg.insert(ev),
            listByTrace: (id) => pg.listByTrace(id),
        };
        storageKind = 'pg';
        app.log.info('[collector] storage=pg OK');
    }
    catch (e) {
        app.log.error({ err: String(e) }, '[collector] storage=pg FAILED → using memory');
        storage = MemStorage;
        storageKind = 'memory';
    }
}
else {
    storage = MemStorage;
}
// actualizar healthz para reportar storage actual
app.get('/healthz', async () => ({ ok: true, service: 'collector', storage: storageKind }));
// Parser JSON como string para conservar rawBody
app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
        req.rawBody = body;
        done(null, JSON.parse(body));
    }
    catch (e) {
        done(e);
    }
});
function verifySignature(rawBody, key, sigHex) {
    try {
        const expected = createHmac('sha256', key).update(rawBody, 'utf8').digest();
        const got = Buffer.from(sigHex, 'hex');
        if (expected.length !== got.length)
            return false;
        return timingSafeEqual(expected, got);
    }
    catch {
        return false;
    }
}
// POST /v1/events
app.post('/v1/events', async (req, reply) => {
    try {
        // HMAC opcional (si Collector tiene HMAC_KEY, exige firma)
        if (process.env.HMAC_KEY) {
            const rawBody = req.rawBody;
            const sig = req.headers['x-signature'];
            if (!rawBody || typeof sig !== 'string' || !verifySignature(rawBody, process.env.HMAC_KEY, sig)) {
                return reply.code(401).send({ ok: false, error: 'bad_signature' });
            }
        }
        const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
        const ev = EventSchema.parse(body);
        const eventId = randomUUID();
        await storage.insert({ ...ev, eventId });
        return reply.send({ ok: true, eventId });
    }
    catch (err) {
        app.log.error({ err }, 'events.invalid_payload');
        return reply.code(400).send({ ok: false, error: 'invalid_payload' });
    }
});
// GET /v1/traces/:id
app.get('/v1/traces/:id', async (req, reply) => {
    const { id } = req.params;
    const events = await storage.listByTrace(id);
    return reply.send({ traceId: id, events });
});
// arrancar
app.listen({ host: HOST, port: PORT }).then(() => {
    app.log.info(`[collector] listening on ${HOST}:${PORT}`);
}).catch((err) => {
    console.error('listen failed', err);
    process.exit(1);
});
process.on('SIGTERM', async () => {
    try {
        await app.close();
    }
    finally {
        process.exit(0);
    }
});
