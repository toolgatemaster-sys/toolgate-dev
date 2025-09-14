import { randomUUID } from "node:crypto";
import { Pool, type QueryResult } from "pg";
import type { Storage } from "./storage.js";
import type { ToolgateEvent, TraceResponse, StoredEvent } from "./types.js";
import { createTableIfNotExists, insertEventSQL, selectTraceSQL } from "./sql.js";

type EventRow = {
  event_id: string;
  trace_id: string;
  type: string;
  ts: Date;                // pg devuelve Date si no transformas
  attrs: unknown;          // JSONB → unknown (nunca any)
};

export class PgStorage implements Storage {
  private readonly pool: Pool;

  constructor(private readonly dbURL: string) {
    this.pool = new Pool({
      connectionString: this.dbURL,
      ssl: /sslmode=require/.test(this.dbURL) ? { rejectUnauthorized: false } : undefined
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
      const events: StoredEvent[] = res.rows.map((r: EventRow) => ({
        eventId: r.event_id,
        traceId: r.trace_id,
        type: r.type,
        ts: new Date(r.ts).toISOString(),
        attrs: r.attrs as Record<string, unknown>
      }));
      return { traceId, events };
    } finally {
      client.release();
    }
  }
}