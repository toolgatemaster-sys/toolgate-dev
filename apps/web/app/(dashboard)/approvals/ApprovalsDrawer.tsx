"use client";

import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label"; // shadcn agrega label automáticamente con input
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Approval } from "@/features/approvals/types";
import { getApproval, approve, deny } from "@/features/approvals/api";
import { useToast } from "@/hooks/use-toast";

export default function ApprovalsDrawer({
  id, open, onOpenChange, onAfterAction,
}: { id: string | null; open: boolean; onOpenChange: (o: boolean) => void; onAfterAction: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Approval | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    if (open && id) {
      setDetail(null);
      getApproval(id).then((d) => { if (active) setDetail(d); }).catch(() => setDetail(null));
    }
    return () => { active = false; };
  }, [id, open]);

  async function act(kind: "approve" | "deny") {
    if (!id) return;
    setLoading(true);
    try {
      if (kind === "approve") await approve(id, note);
      else await deny(id, note);
      toast({ title: kind === "approve" ? "Approved" : "Denied", description: `Approval ${id} ${kind}d` });
      onAfterAction();
      onOpenChange(false);
      setNote("");
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px]">
        <SheetHeader>
          <SheetTitle>Approval detail</SheetTitle>
          <SheetDescription>ID: {id}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {!detail && <div className="text-sm text-muted-foreground">Loading…</div>}
          {detail && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Status:</span> {detail.status}</div>
                <div><span className="text-muted-foreground">Agent:</span> {detail.agentId}</div>
                <div><span className="text-muted-foreground">Tool:</span> {detail.ctx?.tool || "—"}</div>
                <div><span className="text-muted-foreground">Domain:</span> {detail.ctx?.domain || "—"}</div>
                <div><span className="text-muted-foreground">Method:</span> {detail.ctx?.method || "—"}</div>
                <div><span className="text-muted-foreground">Path:</span> {detail.ctx?.path || "—"}</div>
                <div><span className="text-muted-foreground">Created:</span> {new Date(detail.createdAt).toLocaleString()}</div>
                <div><span className="text-muted-foreground">Expires:</span> {detail.expiresAt ? new Date(detail.expiresAt).toLocaleString() : "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Reason:</span> {detail.reason || "—"}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea id="note" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" disabled={loading || detail.status !== "pending"} onClick={() => act("deny")}>Deny</Button>
                <Button disabled={loading || detail.status !== "pending"} onClick={() => act("approve")}>Approve</Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
