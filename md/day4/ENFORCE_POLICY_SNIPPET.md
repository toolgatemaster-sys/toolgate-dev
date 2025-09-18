# Gateway Enforcement Snippet (reference)

```ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { applyPolicy } from "./policy.apply.js";
import { URL } from "node:url";

type ToolPayload = { tool?: string; url?: string };

function inferAction(req: FastifyRequest): "read" | "write" {
  const m = req.method.toUpperCase();
  return (m === "GET" || m === "HEAD") ? "read" : "write";
}

function inferToolFromRoute(req: FastifyRequest): string {
  const p = (req as any).routerPath || req.routeOptions?.url || "";
  if (p.includes("/http")) return "http.get";
  if (p.includes("/storage")) return "storage.put";
  return "unknown";
}

function extractCtx(req: FastifyRequest): { profile: string; tool: string; url?: string } {
  const profile = String((req.headers["x-tg-profile"] ?? "anonymous"));
  const body = (req.body ?? {}) as ToolPayload;
  const tool = body.tool ?? inferToolFromRoute(req);
  const raw = body.url;
  let url: string | undefined;
  try { url = typeof raw === "string" ? new URL(raw).toString() : undefined; } catch {}
  return { profile, tool, url };
}

export async function registerEnforcement(app: FastifyInstance) {
  app.addHook("preHandler", async (req, reply) => {
    const ctx = extractCtx(req);
    const action = inferAction(req);
    const decision = await applyPolicy(ctx, action);
    if (decision === "deny") {
      return reply.code(403).send({ decision: "deny", reason: "policy" });
    }
    if (decision === "pending") {
      return reply.code(202).send({ decision: "pending" });
    }
    // allow → continue
  });
}
```
