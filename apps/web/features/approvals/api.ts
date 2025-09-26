import type { Approval, ApprovalStatus, ListApprovalsResponse } from "./types";

// --- MOCK (toggle por env) ---
const USE_MOCK = process.env.NEXT_PUBLIC_TOOLGATE_MOCK === "1";

// estado in-memory (vive mientras corre el dev server)
let __MOCK_ITEMS: Approval[] = [
  {
    id: "apr_123",
    agentId: "agent1",
    createdAt: Date.now() - 60_000,
    expiresAt: Date.now() + 3_600_000,
    status: "pending",
    reason: "policy",
    ctx: { tool: "http.post", domain: "api.example.com", method: "POST", path: "/v1/tools/http.post" },
    note: "High risk operation",
  },
  {
    id: "apr_456",
    agentId: "agent2",
    createdAt: Date.now() - 120_000,
    expiresAt: Date.now() + 3_300_000,
    status: "approved",
    reason: "policy",
    ctx: { tool: "shell.execute", domain: "localhost", method: "POST", path: "/v1/tools/shell.execute" },
  },
  {
    id: "apr_789",
    agentId: "agent3",
    createdAt: Date.now() - 180_000,
    expiresAt: Date.now() + 3_000_000,
    status: "pending",
    reason: "policy",
    ctx: { tool: "file.write", domain: "filesystem", method: "POST", path: "/v1/tools/file.write" },
  },
];

// utilidad mock para latencia
const mockDelay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));

const BASE = process.env.NEXT_PUBLIC_TOOLGATE_GATEWAY_URL ?? "";
const PATH = process.env.NEXT_PUBLIC_TOOLGATE_APPROVALS_PATH || "/approvals";

function buildUrl(p: string, q?: Record<string, any>) {
  const usp = new URLSearchParams();
  if (q) Object.entries(q).forEach(([k, v]) => v != null && v !== "" && usp.set(k, String(v)));
  const qs = usp.toString();
  return `${BASE}${PATH}${p}${qs ? `?${qs}` : ""}`;
}

// tolerante: si 404/ECONNREFUSED → [] para no romper UI en Day 8
async function getJSON<T>(u: string, init?: RequestInit): Promise<T> {
  try {
    const r = await fetch(u, { cache: "no-store", ...init });
    if (r.status === 404) return { items: [] } as unknown as T;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await r.json();
    return JSON.parse(await r.text() || "{}");
  } catch {
    return { items: [] } as unknown as T;
  }
}

export async function getApprovals(params: { status?: ApprovalStatus; agentId?: string; search?: string; limit?: number } = {}): Promise<ListApprovalsResponse> {
  if (USE_MOCK) {
    let items = __MOCK_ITEMS.slice();
    if (params.status) items = items.filter(i => i.status === params.status);
    if (params.agentId) items = items.filter(i => i.agentId.includes(params.agentId!));
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.agentId.toLowerCase().includes(q) ||
        (i.ctx?.tool || "").toLowerCase().includes(q) ||
        (i.ctx?.domain || "").toLowerCase().includes(q)
      );
    }
    if (params.limit) items = items.slice(0, params.limit);
    return mockDelay({ items });
  }
  return getJSON(buildUrl("", params));
}

export async function getApproval(id: string): Promise<Approval> {
  if (USE_MOCK) {
    const found = __MOCK_ITEMS.find(i => i.id === id)!;
    return mockDelay(found);
  }
  return getJSON(buildUrl(`/${id}`));
}

export async function approve(id: string, note?: string) {
  if (USE_MOCK) {
    __MOCK_ITEMS = __MOCK_ITEMS.map(i => i.id === id ? { ...i, status: "approved", note: note || i.note } : i);
    return mockDelay({ ok: true } as any);
  }
  return getJSON(buildUrl(`/${id}/approve`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: note ? JSON.stringify({ note }) : undefined,
  });
}

export async function deny(id: string, note?: string) {
  if (USE_MOCK) {
    __MOCK_ITEMS = __MOCK_ITEMS.map(i => i.id === id ? { ...i, status: "denied", note: note || i.note } : i);
    return mockDelay({ ok: true } as any);
  }
  return getJSON(buildUrl(`/${id}/deny`), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: note ? JSON.stringify({ note }) : undefined,
  });
}

export async function approveMany(ids: string[], note?: string) {
  if (USE_MOCK) {
    ids.forEach(id => {
      __MOCK_ITEMS = __MOCK_ITEMS.map(i => i.id === id ? { ...i, status: "approved", note: note || i.note } : i);
    });
    return mockDelay(undefined as any);
  }
  for (const id of ids) await approve(id, note);
}

export async function denyMany(ids: string[], note?: string) {
  if (USE_MOCK) {
    ids.forEach(id => {
      __MOCK_ITEMS = __MOCK_ITEMS.map(i => i.id === id ? { ...i, status: "denied", note: note || i.note } : i);
    });
    return mockDelay(undefined as any);
  }
  for (const id of ids) await deny(id, note);
}

// Test helper to set mock items (only available in test environment)
export const __setMockItems = (items: Approval[]) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
    __MOCK_ITEMS = items;
  }
};
