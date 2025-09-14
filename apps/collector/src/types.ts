import { z } from "zod";

export const EventSchema = z.object({
  eventId: z.string().uuid().optional(), // server-side
  traceId: z.string().min(1),
  type: z.string().min(1),
  ts: z.string().datetime().or(z.string().min(1)), // aceptamos fecha como string, validamos al guardar
  attrs: z.record(z.any()).default({})
});

export type ToolgateEvent = z.infer<typeof EventSchema>;

export const TraceResponseSchema = z.object({
  traceId: z.string(),
  events: z.array(EventSchema.extend({ eventId: z.string().uuid() }))
});

export type TraceResponse = z.infer<typeof TraceResponseSchema>;
