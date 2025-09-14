import { z } from "zod";

export const ISODateString = z.string().refine(
  (s) => !Number.isNaN(Date.parse(s)),
  { message: "Invalid ISO date string" }
);

export const EventSchema = z.object({
  traceId: z.string().min(1),
  type: z.string().min(1),
  ts: ISODateString,
  attrs: z.record(z.unknown()).default({}) // objeto arbitrario, pero nunca any
});

export type ToolgateEvent = z.infer<typeof EventSchema>;

export const StoredEventSchema = EventSchema.extend({
  eventId: z.string().uuid()
});

export type StoredEvent = z.infer<typeof StoredEventSchema>;

export const TraceResponseSchema = z.object({
  traceId: z.string(),
  events: z.array(StoredEventSchema)
});

export type TraceResponse = z.infer<typeof TraceResponseSchema>;