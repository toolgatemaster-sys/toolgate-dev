import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import ApprovalsTab from "../app/(dashboard)/approvals/ApprovalsTab";
import * as api from "../features/approvals/api";

vi.mock("../features/approvals/api");

const mockItem = {
  id: "apr_999",
  agentId: "agentZ",
  createdAt: 1730000000000,
  expiresAt: 1730003600000,
  status: "pending" as const,
  reason: "policy",
  note: "check carefully",
  ctx: { tool: "http.post", domain: "api.example.com", method: "POST", path: "/v1/tools/http.post" },
};

describe("Approvals Drawer detail (Day 9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, "getApprovals").mockResolvedValue({ items: [mockItem] });
    vi.spyOn(api, "getApproval").mockResolvedValue(mockItem);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra ctx, reason y note en el drawer", async () => {
    render(<ApprovalsTab />);

    // abrir el drawer clickeando la fila por ID
    await screen.findByText("apr_999");
    fireEvent.click(screen.getByText("apr_999"));

    // Drawer visible
    await waitFor(() => expect(screen.getByText(/Approval detail/i)).toBeInTheDocument());

    // Metadata completa - usar getAllByText para evitar ambigüedad
    expect(screen.getAllByText(/http\.post/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/api\.example\.com/).length).toBeGreaterThan(0);
    expect(screen.getByText(/policy/)).toBeInTheDocument();
    expect(screen.getAllByText(/check carefully/).length).toBeGreaterThan(0);
  });
});
