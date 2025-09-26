import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ApprovalsTab from "../app/(dashboard)/approvals/ApprovalsTab";
import * as api from "../features/approvals/api";

vi.mock("../features/approvals/api");

describe("Approvals Metrics (Day 9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock dinámico: soporta llamada principal (con filtros de la tabla)
    // y las 3 llamadas de métricas (status: pending/approved/denied).
    vi.spyOn(api, "getApprovals").mockImplementation(async (params: any) => {
      const s = params?.status;
      if (s === "pending")  return { items: [{ id: "p1", agentId: "agent1", createdAt: Date.now(), status: "pending" as const }] };           // 1 pending
      if (s === "approved") return { items: [{ id: "a1", agentId: "agent2", createdAt: Date.now(), status: "approved" as const }, { id: "a2", agentId: "agent3", createdAt: Date.now(), status: "approved" as const }] }; // 2 approved
      if (s === "denied")   return { items: [] };                        // 0 denied
      // llamada de tabla (por default el componente usa status "pending"):
      return { items: [{ id: "row1", agentId: "agentX", createdAt: Date.now(), status: "pending" as const }] };
    });
    
    // Mock approveMany and denyMany
    vi.spyOn(api, "approveMany").mockResolvedValue({ status: "approved" });
    vi.spyOn(api, "denyMany").mockResolvedValue({ status: "denied" });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza cards de métricas con los conteos correctos", async () => {
    render(<ApprovalsTab />);

    // Aguardar a que al menos la tabla pinte algo
    await screen.findByText(/Approvals/i);

    await waitFor(() => {
      expect(screen.getByText("Pending: 1")).toBeInTheDocument();
      expect(screen.getByText("Approved: 2")).toBeInTheDocument();
      expect(screen.getByText("Denied: 0")).toBeInTheDocument();
    });
  });

  it("updates metrics on Refresh click", async () => {
    // Mock with different values for refresh
    const mockApprovals = [{ id: "row1", agentId: "agentX", createdAt: Date.now(), status: "pending" as const }];
    
    vi.spyOn(api, "getApprovals").mockImplementation(async (params: any) => {
      const s = params?.status;
      if (s === "pending")  return { items: [{ id: "p1", agentId: "agent1", createdAt: Date.now(), status: "pending" as const }, { id: "p2", agentId: "agent2", createdAt: Date.now(), status: "pending" as const }] }; // 2 pending
      if (s === "approved") return { items: [{ id: "a1", agentId: "agent3", createdAt: Date.now(), status: "approved" as const }] }; // 1 approved
      if (s === "denied")   return { items: [{ id: "d1", agentId: "agent4", createdAt: Date.now(), status: "denied" as const }] }; // 1 denied
      return { items: mockApprovals };
    });

    render(<ApprovalsTab />);

    // espera métricas iniciales
    await waitFor(() => {
      expect(screen.getByText("Pending: 2")).toBeInTheDocument();
      expect(screen.getByText("Approved: 1")).toBeInTheDocument();
      expect(screen.getByText("Denied: 1")).toBeInTheDocument();
    });

    // Count calls before refresh
    const callsBefore = vi.mocked(api.getApprovals).mock.calls.length;
    
    // click en Refresh
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    // Verify more API calls were made (table + 3 metrics)
    await waitFor(() => {
      expect(api.getApprovals).toHaveBeenCalledTimes(callsBefore + 4);
    });
  });
});
