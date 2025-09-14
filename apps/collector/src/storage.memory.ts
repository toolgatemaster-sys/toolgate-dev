import { randomUUID } from "node:crypto";
import type { Storage } from "./storage.js";
import type { ToolgateEvent, TraceResponse, StoredEvent } from "./types.js";

export class MemoryStorage implements Storage {
  private byTrace = new Map<string, StoredEvent[]>();

  async init(): Promise<void> {
    // no-op
  }

  async saveEvent(evt: ToolgateEvent): Promise<{ ok: true; eventId: string }> {
    const eventId = randomUUID();
    const normalized: StoredEvent = {
      ...evt,
      eventId,
      ts: new Date(evt.ts).toISOString()
    };
    const list = this.byTrace.get(normalized.traceId) ?? [];
    list.push(normalized);
    this.byTrace.set(normalized.traceId, list);
    return { ok: true, eventId };
  }

  async getTrace(traceId: string): Promise<TraceResponse> {
    const events = this.byTrace.get(traceId) ?? [];
    return { traceId, events };
  }
}