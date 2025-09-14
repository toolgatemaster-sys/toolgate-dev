import type { ToolgateEvent, TraceResponse } from "./types.js";

export interface Storage {
  init(): Promise<void>;
  saveEvent(evt: ToolgateEvent): Promise<{ ok: true; eventId: string }>;
  getTrace(traceId: string): Promise<TraceResponse>;
}
