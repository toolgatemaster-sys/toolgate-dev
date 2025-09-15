import { Pool } from 'pg';

export type StoredEvent = {
  eventId: string;
  traceId: string;
  type: string;
  ts: string;
  attrs: Record<string, unknown>;
};

export class PgStorage {
  private pool: Pool;
  constructor(conn: string) {
    this.pool = new Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false } // supabase pooler
    });
  }

  async init() {
    await this.pool.query(`
      create table if not exists events (
        id bigserial primary key,
        event_id text not null,
        trace_id text not null,
        type text not null,
        ts timestamptz not null,
        attrs jsonb not null default '{}'::jsonb
      );
      create index if not exists idx_events_trace_id on events(trace_id);
    `);
  }

  async insert(ev: StoredEvent) {
    await this.pool.query(
      `insert into events (event_id, trace_id, type, ts, attrs)
       values ($1,$2,$3,$4,$5)`,
      [ev.eventId, ev.traceId, ev.type, ev.ts, ev.attrs]
    );
  }

  async listByTrace(traceId: string): Promise<StoredEvent[]> {
    const res = await this.pool.query(
      `select event_id as "eventId", trace_id as "traceId", type, to_char(ts, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ts, attrs
       from events where trace_id=$1 order by id asc`,
      [traceId]
    );
    return res.rows.map(r => ({
      eventId: r.eventId as string,
      traceId: r.traceId as string,
      type: r.type as string,
      ts: r.ts as string,
      attrs: (r.attrs ?? {}) as Record<string, unknown>
    }));
  }
}