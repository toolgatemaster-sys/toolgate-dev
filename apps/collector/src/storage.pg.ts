import { randomUUID } from "node:crypto";
import { Pool } from "pg"; // <- ahora con tipos
import type { Storage } from "./storage.js";
import type { ToolgateEvent, TraceResponse } from "./types.js";
import { createTableIfNotExists, insertEventSQL, selectTraceSQL } from "./sql.js";

type Row = {
  event_id: string;
  trace_id: string;
  type: string;
  ts: string | Date;
  attrs: unknown;
};

export class PgStorage implements Storage {
  private pool: Pool;

  constructor(private dbURL: string) {
    this.pool = new Pool({
      connectionString: this.dbURL,
      ssl: /sslmode=require/.test(this.dbURL) ? { rejectUnauthorized: false } : undefined
    });
  }

  async init() {
    const client = await this.pool.connect();
    try {
      await client.query(createTableIfNotExists);
    } finally {
      client.release();
    }
  }

  async saveEvent(evt: ToolgateEvent): Promise<{ ok: true; eventId: string }> {
    const eventId = randomUUID();
    const tsISO = new Date(evt.ts ?? Date.now()).toISOString();
    const client = await this.pool.connect();
    try {
      await client.query(insertEventSQL, [
        eventId,
        evt.traceId,
        evt.type,
        tsISO,
        JSON.stringify(evt.attrs ?? {})
      ]);
      return { ok: true, eventId };
    } finally {
      client.release();
    }
  }

  async getTrace(traceId: string): Promise<TraceResponse> {
    const client = await this.pool.connect();
    try {
      const res = await client.query<Row>(selectTraceSQL, [traceId]);
      const events = res.rows.map((r: Row) => ({
        eventId: r.event_id,
        traceId: r.trace_id,
        type: r.type,
        ts: new Date(r.ts).toISOString(),
        attrs: (r as Row).attrs ?? {}
      }));
      return { traceId, events };
    } finally {
      client.release();
    }
  }
}