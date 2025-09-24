"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import type { Approval, ApprovalStatus } from "../../../features/approvals/types";
import { getApprovals, approve, deny } from "../../../features/approvals/api";

const STATUS_OPTIONS: ApprovalStatus[] = ["pending", "approved", "denied", "expired"];

function fmtTs(ts?: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function ApprovalsTab() {
  const { toast } = useToast();
  const [status, setStatus] = useState<ApprovalStatus | undefined>("pending");
  const [agentId, setAgentId] = useState<string>("");
  const [items, setItems] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchList() {
    try {
      setLoading(true);
      setError(null);
      const { items } = await getApprovals({ status, agentId: agentId || undefined });
      setItems(items);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to load approvals";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, agentId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchList, 12_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, status, agentId]);

  async function onApprove(id: string) {
    try {
      await approve(id);
      toast({ title: "Approved", description: id });
      fetchList();
    } catch (e: any) {
      toast({ title: "Approve failed", description: e?.message ?? "Error", variant: "destructive" });
    }
  }

  async function onDeny(id: string) {
    try {
      await deny(id);
      toast({ title: "Denied", description: id });
      fetchList();
    } catch (e: any) {
      toast({ title: "Deny failed", description: e?.message ?? "Error", variant: "destructive" });
    }
  }

  const rows = useMemo(() => items, [items]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Approvals</CardTitle>
          <CardDescription>Review and act on pending requests from your agents.</CardDescription>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Status</Label>
            <Select value={status} onValueChange={(v: ApprovalStatus) => setStatus(v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent filter */}
          <div className="flex items-center gap-2">
            <Label className="text-sm">Agent</Label>
            <Input
              placeholder="agentId"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-[180px]"
            />
          </div>

          {/* Auto refresh */}
          <div className="flex items-center gap-2">
            <Switch id="auto" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto" className="text-sm">
              Auto-refresh
            </Label>
          </div>

          {/* Manual refresh */}
          <Button onClick={fetchList} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {error && <div className="text-sm text-destructive mb-3">Failed to load: {error}</div>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No approvals found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "pending"
                            ? "default"
                            : row.status === "approved"
                            ? "secondary"
                            : row.status === "denied"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{row.agentId ?? "—"}</TableCell>
                    <TableCell className="text-xs">{row.ctx?.tool ?? "—"}</TableCell>
                    <TableCell className="text-xs">{row.ctx?.domain ?? "—"}</TableCell>
                    <TableCell className="text-xs">{fmtTs(row.createdAt)}</TableCell>
                    <TableCell className="text-xs">{fmtTs(row.expiresAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onApprove(row.id)}
                          disabled={loading || row.status !== "pending"}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeny(row.id)}
                          disabled={loading || row.status !== "pending"}
                        >
                          Deny
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
