import { randomUUID } from "node:crypto";
import type { Storage } from "./storage.js";
import type { ToolgateEvent, TraceResponse } from "./types.js";

export class MemoryStorage implements Storage {
  private byTrace = new Map<string, Array<ToolgateEvent & { eventId: string }>>();

  async init() {
    // nada
  }

  async saveEvent(evt: ToolgateEvent): Promise<{ ok: true; eventId: string }> {
    const eventId = randomUUID();
    const normalized = {
      ...evt,
      eventId,
      ts: new Date(evt.ts ?? Date.now()).toISOString()
    };
    const arr = this.byTrace.get(normalized.traceId) ?? [];
    arr.push(normalized);
    this.byTrace.set(normalized.traceId, arr);
    return { ok: true, eventId };
  }

  async getTrace(traceId: string): Promise<TraceResponse> {
    const events = this.byTrace.get(traceId) ?? [];
    return { traceId, events };
  }
}
