"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Approval, ApprovalStatus } from "@/features/approvals/types";
import { getApprovals, approve, deny, approveMany, denyMany } from "@/features/approvals/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import ApprovalsDrawer from "./ApprovalsDrawer";

const REFRESH_MS = 12_000;

export default function ApprovalsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Approval[]>([]);
  const [status, setStatus] = useState<ApprovalStatus | "all">("pending");
  const [agentId, setAgentId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  // ---- Day 9: métricas (pending/approved/denied) ----
  const [metrics, setMetrics] = useState({ pending: 0, approved: 0, denied: 0 });

  const params = useMemo(() => ({
    status: status === "all" ? undefined : status,
    agentId: agentId || undefined,
    search: search || undefined,
    limit: 50,
  }), [status, agentId, search]);

  const selectedIds = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);

  async function refreshMetrics() {
    // las métricas son globales (no filtran por agent/search) para tener “overview”
    // si prefieres que respeten filtros, pasa { agentId, search } aquí también
    const [p, a, d] = await Promise.all([
      getApprovals({ status: "pending", limit: 1_000 }),
      getApprovals({ status: "approved", limit: 1_000 }),
      getApprovals({ status: "denied",  limit: 1_000 }),
    ]);
    setMetrics({
      pending: p.items?.length ?? 0,
      approved: a.items?.length ?? 0,
      denied:  d.items?.length ?? 0,
    });
  }

  async function refresh() {
    setLoading(true);
    try {
      const res = await getApprovals(params);
      setItems(res.items ?? []);
      // actualizar métricas en cada refresh “de pantalla”
      refreshMetrics().catch(() => {});
    } catch (e: any) {
      toast({ title: "Failed to load", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    refresh(); 
    // primera carga de métricas por si no hay items con el filtro actual
    refreshMetrics().catch(() => {});
  }, [params]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, params]);

  function rowStatusBadge(s: ApprovalStatus) {
    const variant = s === "pending" ? "secondary"
                  : s === "approved" ? "default"
                  : s === "denied" ? "destructive"
                  : "outline";
    return <Badge variant={variant}>{s}</Badge>;
  }

  async function onApprove(id: string, note?: string) {
    try {
      await approve(id, note);
      toast({ title: "Approved", description: `Approval ${id} approved` });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  }

  async function onDeny(id: string, note?: string) {
    try {
      await deny(id, note);
      toast({ title: "Denied", description: `Approval ${id} denied` });
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  }

  async function onBulk(kind: "approve" | "deny") {
    if (selectedIds.length === 0) return;
    try {
      if (kind === "approve") await approveMany(selectedIds);
      else await denyMany(selectedIds);
      toast({ title: kind === "approve" ? "Approved" : "Denied", description: `${selectedIds.length} items` });
      setSelected({});
      await refresh();
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    }
  }

  return (
    <div className="space-y-4 p-6">
      {/* ---- Day 9: métricas arriba ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">Pending: {metrics.pending}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">Approved: {metrics.approved}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">Denied: {metrics.denied}</CardContent>
        </Card>
      </div>

      {/* ---- Card principal (filtros + acciones + tabla) ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mantener etiqueta 'Status' para compat con tests Day 7 */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Status</span>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger className="w-[160px]" aria-label="Status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="approved">approved</SelectItem>
                  <SelectItem value="denied">denied</SelectItem>
                  <SelectItem value="expired">expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">Agent</span>
              <Input placeholder="agentId" value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-[200px]" />
            </div>

            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-[240px]" />

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm flex items-center gap-2">
                <span>Auto-refresh</span>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} aria-label="Auto-refresh" />
              </label>
              <Button variant="outline" onClick={refresh} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
            </div>
          </div>

          {/* Acciones bulk */}
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={selectedIds.length === 0} onClick={() => onBulk("approve")}>Approve selected</Button>
            <Button variant="outline" disabled={selectedIds.length === 0} onClick={() => onBulk("deny")}>Deny selected</Button>
            {selectedIds.length > 0 && <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>}
          </div>

          <Separator />

          {/* Tabla */}
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      aria-label="Select all"
                      type="checkbox"
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const next: Record<string, boolean> = {};
                        if (checked) items.forEach((it) => next[it.id] = true);
                        setSelected(next);
                      }}
                      checked={items.length > 0 && items.every((it) => selected[it.id])}
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpenId(a.id)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        aria-label={`Select ${a.id}`}
                        type="checkbox"
                        checked={!!selected[a.id]}
                        onChange={(e) => setSelected((s) => ({ ...s, [a.id]: e.target.checked }))}
                      />
                    </TableCell>
                    <TableCell><code className="text-xs">{a.id}</code></TableCell>
                    <TableCell>{rowStatusBadge(a.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{a.agentId}</TableCell>
                    <TableCell className="truncate">{a.ctx?.tool || a.action || "—"}</TableCell>
                    <TableCell className="truncate">{a.ctx?.domain || "—"}</TableCell>
                    <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{a.expiresAt ? new Date(a.expiresAt).toLocaleString() : "—"}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button data-testid={`approve-${a.id}`} size="sm" variant="outline" disabled={a.status !== "pending"} onClick={() => onApprove(a.id)}>Approve</Button>
                        <Button data-testid={`deny-${a.id}`} size="sm" variant="outline" disabled={a.status !== "pending"} onClick={() => onDeny(a.id)}>Deny</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">No approvals found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Drawer */}
      <ApprovalsDrawer
        id={openId}
        open={!!openId}
        onOpenChange={(o) => !o && setOpenId(null)}
        onAfterAction={refresh}
      />
    </div>
  );
}
