export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";

export type ApprovalCtx = {
  tool?: string;
  domain?: string;
  method?: string;
  path?: string;
};

export type Approval = {
  id: string;
  agentId?: string;
  createdAt: number;
  expiresAt: number;
  reason?: string;
  ctx: ApprovalCtx;
  status: ApprovalStatus;
  note?: string;
};