export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";

export interface ApprovalCtx {
  tool?: string;
  domain?: string;
  method?: string;
  path?: string;
}

export interface Approval {
  id: string;
  agentId: string;
  createdAt: number;   // epoch ms
  expiresAt?: number;  // epoch ms
  status: ApprovalStatus;
  reason?: string;
  ctx?: ApprovalCtx;
  note?: string;
  action?: string;     // alias si backend lo emite
  bodyHash?: string;
}

export interface ListApprovalsResponse {
  items: Approval[];
  nextCursor?: string;
}
