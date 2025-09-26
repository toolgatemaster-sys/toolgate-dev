import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import ApprovalsTab from "../app/(dashboard)/approvals/ApprovalsTab";
import * as api from "../features/approvals/api";

vi.mock("../features/approvals/api");

const mockItems = [{
  id: "apr_123", agentId: "agent1", createdAt: 1730000000000, expiresAt: 1730003600000,
  status: "pending" as const, ctx: { tool: "http.post", domain: "api.example.com", method: "POST", path: "/v1/tools/http.post" }, reason: "policy"
}, {
  id: "apr_456", agentId: "agent2", createdAt: 1730000100000, expiresAt: 1730003700000,
  status: "pending" as const, ctx: { tool: "http.post", domain: "api.example.com", method: "POST", path: "/v1/tools/http.post" }, reason: "policy"
}];

describe("Approvals Drawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getApprovals to return data based on status parameter
    vi.spyOn(api, "getApprovals").mockImplementation(async (params: any) => {
      const status = params?.status;
      const limit = params?.limit;
      
      // For metrics calls (limit: 1000) - return simple counts
      if (limit === 1000) {
        if (status === "pending") {
          return { items: [{ id: "p1", agentId: "agent1", createdAt: Date.now(), status: "pending" as const }] };
        }
        if (status === "approved") {
          return { items: [{ id: "a1", agentId: "agent2", createdAt: Date.now(), status: "approved" as const }, { id: "a2", agentId: "agent3", createdAt: Date.now(), status: "approved" as const }] };
        }
        if (status === "denied") {
          return { items: [] };
        }
      }
      
      // For table calls (limit: 50 or undefined) - return mockItems which contains apr_123 and apr_456
      return { items: mockItems };
    });
    
    vi.spyOn(api, "getApproval").mockResolvedValue({ ...mockItems[0] });
    vi.spyOn(api, "approve").mockResolvedValue({ ok: true } as any);
    vi.spyOn(api, "deny").mockResolvedValue({ ok: true } as any);
    vi.spyOn(api, "approveMany").mockResolvedValue(undefined as any);
    vi.spyOn(api, "denyMany").mockResolvedValue(undefined as any);
  });
  afterEach(() => cleanup());

  it("opens drawer on row click and shows detail", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_123");
    fireEvent.click(screen.getByText("apr_123"));
    await waitFor(() => expect(screen.getByText(/Approval detail/i)).toBeInTheDocument());
    expect(api.getApproval).toHaveBeenCalledWith("apr_123");
  });

  it("approves with note from drawer", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_123");
    fireEvent.click(screen.getByText("apr_123"));
    await screen.findByText(/Approval detail/i);

    const note = await screen.findByPlaceholderText(/Add a note/i);
    fireEvent.change(note, { target: { value: "looks safe" } });

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(api.approve).toHaveBeenCalledWith("apr_123", "looks safe"));
  });

  it("denies with note and closes drawer", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_123");
    fireEvent.click(screen.getByText("apr_123"));
    await screen.findByText(/Approval detail/i);

    fireEvent.change(await screen.findByPlaceholderText(/Add a note/i), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Deny" }));

    await waitFor(() => expect(api.deny).toHaveBeenCalledWith("apr_123", "nope"));
    await waitFor(() => expect(screen.queryByText(/Approval detail/i)).not.toBeInTheDocument());
  });

  it("bulk approve selected", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_123");
    fireEvent.click(screen.getByLabelText("Select apr_123"));
    fireEvent.click(screen.getByRole("button", { name: "Approve selected" }));
    await waitFor(() => expect(api.approveMany).toHaveBeenCalled());
  });

  it("bulk deny selected", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_123");
    fireEvent.click(screen.getByLabelText("Select apr_123"));
    fireEvent.click(screen.getByRole("button", { name: "Deny selected" }));
    await waitFor(() => expect(api.denyMany).toHaveBeenCalled());
  });

  it("handles error loading detail", async () => {
    vi.spyOn(api, "getApproval").mockRejectedValueOnce(new Error("boom"));
    render(<ApprovalsTab />);
    await screen.findByText("apr_123");
    fireEvent.click(screen.getByText("apr_123"));
    // debería mostrar algún texto "Loading…" y luego quedarse sin detalle, pero sin crashear
    await waitFor(() => expect(screen.getByText(/Loading/i)).toBeInTheDocument());
  });
});
it("shows ctx, reason and existing note in the drawer", async () => {
  // Para este caso, necesitamos que el detalle traiga una note existente
  const detailed = {
    ...mockItems[0],
    note: "check carefully",
  };
  vi.spyOn(api, "getApproval").mockResolvedValueOnce(detailed);

  render(<ApprovalsTab />);
  await screen.findByText("apr_123");
  fireEvent.click(screen.getByText("apr_123"));

  await waitFor(() => expect(screen.getByText(/Approval detail/i)).toBeInTheDocument());

  // Metadata completa del ctx - usar getAllByText para evitar ambigüedad
  expect(screen.getAllByText(/http\.post/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/api\.example\.com/).length).toBeGreaterThan(0);
  expect(screen.getByText(/policy/)).toBeInTheDocument();            // reason
  expect(screen.getAllByText(/check carefully/).length).toBeGreaterThan(0);   // existing note
});

it("copies ID to clipboard from drawer", async () => {
  const writeText = vi.fn();
  // mock de clipboard a nivel test
  Object.assign(navigator, { clipboard: { writeText } });

  render(<ApprovalsTab />);
  await screen.findByText("apr_123");
  fireEvent.click(screen.getByText("apr_123"));

  await screen.findByText(/Approval detail/i);
  // botón "Copy ID" (agregado en Day 9)
  fireEvent.click(screen.getByRole("button", { name: /Copy ID/i }));
  expect(writeText).toHaveBeenCalledWith("apr_123");
});

it("disables approve/deny buttons for non-pending approvals", async () => {
  // Mock approved status
  vi.spyOn(api, 'getApproval').mockResolvedValueOnce({ 
    ...mockItems[0], 
    status: 'approved' as const 
  });

  render(<ApprovalsTab />);

  await waitFor(() => {
    expect(screen.getByText("apr_123")).toBeInTheDocument();
  });

  // Click to open drawer
  fireEvent.click(screen.getByText("apr_123"));

  // Wait for drawer to open
  await waitFor(() => {
    expect(screen.getByText(/Approval detail/i)).toBeInTheDocument();
  });

  // Verify buttons are disabled
  expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled();
});