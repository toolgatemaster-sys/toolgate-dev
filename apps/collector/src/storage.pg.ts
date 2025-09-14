import { randomUUID } from "node:crypto";
import { Pool, type QueryResult } from "pg";
import type { Storage } from "./storage.js";
import type { ToolgateEvent, TraceResponse, StoredEvent } from "./types.js";
import { createTableIfNotExists, insertEventSQL, selectTraceSQL } from "./sql.js";

type EventRow = {
  event_id: string;
  trace_id: string;
  type: string;
  ts: Date;
  attrs: unknown;
};

export class PgStorage implements Storage {
  private readonly pool: Pool;

  constructor(private readonly dbURL: string) {
    // ⚠️ Fuerza TLS con verificación laxa (evita "self-signed certificate")
    this.pool = new Pool({
      connectionString: this.dbURL,
      ssl: { rejectUnauthorized: false },   // ← CLAVE
    });
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(createTableIfNotExists);
    } finally {
      client.release();
    }
  }

  async saveEvent(evt: ToolgateEvent): Promise<{ ok: true; eventId: string }> {
    const eventId = randomUUID();
    const tsISO = new Date(evt.ts).toISOString();
    const client = await this.pool.connect();
    try {
      await client.query(insertEventSQL, [
        eventId,
        evt.traceId,
        evt.type,
        tsISO,
        JSON.stringify(evt.attrs)
      ]);
      return { ok: true, eventId };
    } finally {
      client.release();
    }
  }

  async getTrace(traceId: string): Promise<TraceResponse> {
    const client = await this.pool.connect();
    try {
      const res: QueryResult<EventRow> = await client.query(selectTraceSQL, [traceId]);
      const events: StoredEvent[] = res.rows.map((r) => ({
        eventId: r.event_id,
        traceId: r.trace_id,
        type: r.type,
        ts: new Date(r.ts).toISOString(),
        attrs: r.attrs as Record<string, unknown>,  // 👈 cast explícito
      }));
      return { traceId, events };
    } finally {
      client.release();
    }
  }
}