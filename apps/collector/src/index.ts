// Fuerza a Node a resolver IPv4 primero (evita ENETUNREACH por IPv6)
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Pool } from 'pg';
import { z } from 'zod';

const PORT = 8785;

// Schema validation
const EventSchema = z.object({
  traceId: z.string(),
  type: z.string(),
  ts: z.string(),
  attrs: z.record(z.any()).default({}),
  orgId: z.string().optional(),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  eventId: z.string().optional(),
  parentEventId: z.string().optional(),
  tool: z.string().optional(),
  target: z.string().optional(),
  action: z.string().optional(),
  latencyMs: z.number().optional(),
  status: z.number().optional(),
  decision: z.string().optional(),
  riskScore: z.number().optional(),
});

// Database setup
let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { 
        rejectUnauthorized: false  // Permite certificados auto-firmados de Supabase
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
    console.log('✅ Database connection initialized');
  } catch (error) {
    console.warn('⚠️ Database connection failed:', error instanceof Error ? error.message : String(error));
    console.log('📝 Collector will run in mock mode (no persistence)');
    pool = null;
  }
} else {
  console.log('📝 DATABASE_URL not set, running in mock mode (no persistence)');
}

const fastify = Fastify({
  logger: true,
});

// CORS
fastify.register(cors, {
  origin: true,
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'collector' };
});

// POST /v1/events - Store event
fastify.post('/v1/events', async (request, reply) => {
  try {
    const eventData = EventSchema.parse(request.body);
    
    const query = `
      INSERT INTO events (
        trace_id, type, ts, attrs, org_id, project_id, agent_id,
        event_id, parent_event_id, tool, target, action,
        latency_ms, status, decision, risk_score
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING id
    `;
    
    const values = [
      eventData.traceId,
      eventData.type,
      eventData.ts,
      JSON.stringify(eventData.attrs),
      eventData.orgId || null,
      eventData.projectId || null,
      eventData.agentId || null,
      eventData.eventId || null,
      eventData.parentEventId || null,
      eventData.tool || null,
      eventData.target || null,
      eventData.action || null,
      eventData.latencyMs || null,
      eventData.status || null,
      eventData.decision || null,
      eventData.riskScore || null,
    ];
    
    const result = await pool.query(query, values);
    
    reply.code(201);
    return {
      success: true,
      id: result.rows[0].id,
      eventId: eventData.eventId || result.rows[0].id,
    };
  } catch (error) {
    fastify.log.error(error);
    
    if (error instanceof z.ZodError) {
      reply.code(400);
      return { error: 'Validation error', details: error.errors };
    }
    
    reply.code(500);
    return { error: 'Internal server error' };
  }
});

// GET /v1/traces/:id - Get events for trace
fastify.get('/v1/traces/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    
    const query = `
      SELECT 
        id, event_id, parent_event_id, ts, org_id, project_id, agent_id,
        trace_id, type, tool, target, action, latency_ms, status,
        decision, risk_score, attrs
      FROM events 
      WHERE trace_id = $1 
      ORDER BY ts ASC
    `;
    
    const result = await pool.query(query, [id]);
    
    const events = result.rows.map(row => ({
      id: row.id,
      eventId: row.event_id,
      parentEventId: row.parent_event_id,
      ts: row.ts,
      orgId: row.org_id,
      projectId: row.project_id,
      agentId: row.agent_id,
      traceId: row.trace_id,
      type: row.type,
      tool: row.tool,
      target: row.target,
      action: row.action,
      latencyMs: row.latency_ms,
      status: row.status,
      decision: row.decision,
      riskScore: row.risk_score,
      attrs: row.attrs,
    }));
    
    return {
      traceId: id,
      events,
      count: events.length,
    };
  } catch (error) {
    fastify.log.error(error);
    reply.code(500);
    return { error: 'Internal server error' };
  }
});

// Start server
const start = async () => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    fastify.log.info('Database connected');
    
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    fastify.log.info(`Collector service running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
