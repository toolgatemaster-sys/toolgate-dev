import { z } from "zod";

/** Body del /v1/proxy */
export const ProxyRequestSchema = z.object({
  method: z.string().optional().default("GET"),
  url: z.string().url(),
  headers: z.record(z.string()).optional().default({}),
  body: z.any().optional(),
  traceId: z.string().optional()
});
export type ProxyRequest = z.infer<typeof ProxyRequestSchema>;

/** Evento "estándar" que enviamos al Collector */
export type ToolgateEvent = {
  traceId?: string;
  type: string;  // p.ej., 'proxy.forward' | 'proxy.error' | 'gate.decision'
  ts: string;    // ISO
  attrs: Record<string, unknown>;
};
