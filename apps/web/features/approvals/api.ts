import type { Approval, ApprovalStatus } from "./types";

const BASE = process.env.NEXT_PUBLIC_TOOLGATE_GATEWAY_URL ?? "";
const PATH = process.env.NEXT_PUBLIC_TOOLGATE_APPROVALS_PATH || "/approvals";

function url(p: string, q?: Record<string, any>) {
  const usp = new URLSearchParams();
  if (q) Object.entries(q).forEach(([k, v]) => v != null && v !== "" && usp.set(k, String(v)));
  const qs = usp.toString();
  return `${BASE}${PATH}${p}${qs ? `?${qs}` : ""}`;
}

async function getJSON<T>(u: string, init?: RequestInit): Promise<T> {
  try {
    const r = await fetch(u, { cache: "no-store", ...init });
    if (r.status === 404) {
      // backend no está corriendo o path incorrecto → no revientes la UI
      return { items: [] } as unknown as T;
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as T;
  } catch {
    // red client error / ECONNREFUSED → comportarse igual que 404
    return { items: [] } as unknown as T;
  }
}

export async function listApprovals(params: {
  status?: ApprovalStatus; agentId?: string; search?: string; limit?: number;
} = {}): Promise<{ items: Approval[]; nextCursor?: string }> {
  return getJSON(url("", params));
}

export async function approveApproval(id: string, note?: string) {
  return getJSON(url(`/${id}/approve`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: note ? JSON.stringify({ note }) : undefined,
  });
}

export async function denyApproval(id: string, note?: string) {
  return getJSON(url(`/${id}/deny`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: note ? JSON.stringify({ note }) : undefined,
  });
}

// Backward compatibility aliases
export const getApprovals = listApprovals;
export const approve = approveApproval;
export const deny = denyApproval;