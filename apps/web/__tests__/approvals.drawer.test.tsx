import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import ApprovalsTab from "../app/(dashboard)/approvals/ApprovalsTab";
import * as api from "../features/approvals/api";

vi.mock("../features/approvals/api");

const mockItems = [{
  id: "apr_777", agentId: "agentX", createdAt: 1730000000000, expiresAt: 1730003600000,
  status: "pending" as const, ctx: { tool: "http.post", domain: "api.example.com", method: "POST", path: "/v1/tools/http.post" }, reason: "policy"
}];

describe("Approvals Drawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, "getApprovals").mockResolvedValue({ items: mockItems });
    vi.spyOn(api, "getApproval").mockResolvedValue({ ...mockItems[0] });
    vi.spyOn(api, "approve").mockResolvedValue({ ok: true } as any);
    vi.spyOn(api, "deny").mockResolvedValue({ ok: true } as any);
    vi.spyOn(api, "approveMany").mockResolvedValue(undefined as any);
    vi.spyOn(api, "denyMany").mockResolvedValue(undefined as any);
  });
  afterEach(() => cleanup());

  it("opens drawer on row click and shows detail", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_777");
    fireEvent.click(screen.getByText("apr_777"));
    await waitFor(() => expect(screen.getByText(/Approval detail/i)).toBeInTheDocument());
    expect(api.getApproval).toHaveBeenCalledWith("apr_777");
  });

  it("approves with note from drawer", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_777");
    fireEvent.click(screen.getByText("apr_777"));
    await screen.findByText(/Approval detail/i);

    const note = await screen.findByPlaceholderText(/Add a note/i);
    fireEvent.change(note, { target: { value: "looks safe" } });

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(api.approve).toHaveBeenCalledWith("apr_777", "looks safe"));
  });

  it("denies with note and closes drawer", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_777");
    fireEvent.click(screen.getByText("apr_777"));
    await screen.findByText(/Approval detail/i);

    fireEvent.change(await screen.findByPlaceholderText(/Add a note/i), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Deny" }));

    await waitFor(() => expect(api.deny).toHaveBeenCalledWith("apr_777", "nope"));
    await waitFor(() => expect(screen.queryByText(/Approval detail/i)).not.toBeInTheDocument());
  });

  it("bulk approve selected", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_777");
    fireEvent.click(screen.getByLabelText("Select apr_777"));
    fireEvent.click(screen.getByRole("button", { name: "Approve selected" }));
    await waitFor(() => expect(api.approveMany).toHaveBeenCalled());
  });

  it("bulk deny selected", async () => {
    render(<ApprovalsTab />);
    await screen.findByText("apr_777");
    fireEvent.click(screen.getByLabelText("Select apr_777"));
    fireEvent.click(screen.getByRole("button", { name: "Deny selected" }));
    await waitFor(() => expect(api.denyMany).toHaveBeenCalled());
  });

  it("handles error loading detail", async () => {
    vi.spyOn(api, "getApproval").mockRejectedValueOnce(new Error("boom"));
    render(<ApprovalsTab />);
    await screen.findByText("apr_777");
    fireEvent.click(screen.getByText("apr_777"));
    // debería mostrar algún texto "Loading…" y luego quedarse sin detalle, pero sin crashear
    await waitFor(() => expect(screen.getByText(/Loading/i)).toBeInTheDocument());
  });
});
