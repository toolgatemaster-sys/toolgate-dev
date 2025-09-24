// apps/gateway/src/enforcement.ts
import type { FastifyInstance, FastifyRequest } from "fastify";
import { approvalsStore } from "./approvals.store";
import { applyPolicy } from "../../../packages/core/policy.apply";

type Decision = "allow" | "deny" | "pending";

function inferAction(req: FastifyRequest): "read" | "write" {
  const m = req.method.toUpperCase();
  return (m === "GET" || m === "HEAD") ? "read" : "write";
}

function inferToolFromRoute(req: FastifyRequest): string {
  const p = (req as any).routerPath || req.routeOptions?.url || String(req.url) || "";
  return p.replace(/\/v\d+\//, "").replace(/[:]/g, "").replace(/[\/-]+/g, ".").replace(/\.+$/, "") || "unknown";
}

function inferDomain(req: FastifyRequest): string | undefined {
  try {
    const body: any = req.body || {};
    if (typeof body.url === "string") return new URL(body.url).host;
  } catch {}
  return undefined;
}

function extractCtx(req: FastifyRequest) {
  const agentId = req.headers["x-tg-agent-id"] || req.headers["x-agent-id"];
  return {
    agentId: typeof agentId === "string" ? agentId : undefined,
    tool: inferToolFromRoute(req),
    domain: inferDomain(req),
    method: req.method,
    path: (req as any).routerPath || req.routeOptions?.url,
    now: Date.now(),
  };
}

export async function registerEnforcement(app: FastifyInstance) {
  app.addHook("preHandler", async (req, reply) => {
    if (!String(req.url).startsWith("/v1/")) return;

    const ctx = extractCtx(req);
    const action = inferAction(req);
    const decision: Decision = await applyPolicy(ctx as any, action as any);

    if (decision === "deny") {
      return reply.code(403).send({ decision: "deny", reason: "policy" });
    }
    if (decision === "pending") {
      const approval = approvalsStore.createApproval({ agentId: ctx.agentId, ctx, reason: "policy" });
      return reply.code(202).send({ decision: "pending", approval_id: approval.id });
    }
    // allow -> continue
  });
}
