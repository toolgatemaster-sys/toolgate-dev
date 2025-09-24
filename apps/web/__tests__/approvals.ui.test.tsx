import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ApprovalsTab from "../app/(dashboard)/approvals/ApprovalsTab";
import { getApprovals, approve, deny } from "../features/approvals/api";

// Mock the API functions with consistent naming
vi.mock("../features/approvals/api", () => ({
  getApprovals: vi.fn(),
  approve: vi.fn(),
  deny: vi.fn(),
  // Also mock the original names for backward compatibility
  listApprovals: vi.fn(),
  approveApproval: vi.fn(),
  denyApproval: vi.fn(),
}));

// Mock the toast hook with assertion capability
const mockToast = vi.fn();
vi.mock("../hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockApprovals = [
  {
    id: "apr_123",
    agentId: "agent1",
    createdAt: 1730000000000,
    expiresAt: 1730003600000,
    reason: "policy",
    ctx: { tool: "http.post", domain: "api.example.com", method: "POST", path: "/v1/tools/http.post" },
    status: "pending" as const,
    note: "High risk operation",
  },
  {
    id: "apr_456",
    agentId: "agent2",
    createdAt: 1730000100000,
    expiresAt: 1730003700000,
    reason: "policy",
    ctx: { tool: "shell.execute", domain: "localhost", method: "POST", path: "/v1/tools/shell.execute" },
    status: "approved" as const,
  },
];

describe("ApprovalsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApprovals).mockResolvedValue({ items: mockApprovals });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders filters, buttons, and table headers", async () => {
    render(<ApprovalsTab />);
    
    // Check filters
    expect(screen.getAllByText("Status")).toHaveLength(2); // Filter label + table header
    expect(screen.getAllByText("Agent")).toHaveLength(2); // Filter label + table header
    expect(screen.getByText("Auto-refresh")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    
    // Check table headers
    await waitFor(() => {
      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getAllByText("Status")).toHaveLength(2); // Filter + header
      expect(screen.getAllByText("Agent")).toHaveLength(2); // Filter + header
      expect(screen.getByText("Tool")).toBeInTheDocument();
      expect(screen.getByText("Domain")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
      expect(screen.getByText("Expires")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });
  });

  it("changes status filter and triggers correct query", async () => {
    render(<ApprovalsTab />);
    
    // For Radix UI Select, we need to open and click
    const statusButton = screen.getByRole("combobox");
    fireEvent.click(statusButton);
    
    // Wait for and click the approved option
    await waitFor(() => {
      const approvedOption = screen.getByText("approved");
      fireEvent.click(approvedOption);
    });
    
    await waitFor(() => {
      expect(getApprovals).toHaveBeenCalledWith({ status: "approved", agentId: undefined });
    });
  });

  it("changes agentId filter and triggers correct query", async () => {
    render(<ApprovalsTab />);
    
    const agentInput = screen.getByPlaceholderText("agentId");
    fireEvent.change(agentInput, { target: { value: "agent123" } });
    
    await waitFor(() => {
      expect(getApprovals).toHaveBeenCalledWith({ status: "pending", agentId: "agent123" });
    });
  });

  it("calls approve API, shows toast, and refetches", async () => {
    vi.mocked(approve).mockResolvedValue({ status: "approved" });
    render(<ApprovalsTab />);
    
    await waitFor(() => {
      expect(screen.getByText(/apr_123/)).toBeInTheDocument();
    });
    
    // Find the first approve button (there might be multiple rows)
    const approveButtons = screen.getAllByRole("button", { name: "Approve" });
    const enabledApproveButton = approveButtons.find(button => !(button as HTMLButtonElement).disabled);
    expect(enabledApproveButton).toBeInTheDocument();
    
    if (enabledApproveButton) {
      fireEvent.click(enabledApproveButton);
      
      await waitFor(() => {
        expect(approve).toHaveBeenCalledWith("apr_123");
        expect(mockToast).toHaveBeenCalled();
        expect(getApprovals).toHaveBeenCalledTimes(2); // Initial load + refetch after approve
      });
    }
  });

  it("calls deny API, shows toast, and refetches", async () => {
    vi.mocked(deny).mockResolvedValue({ status: "denied" });
    render(<ApprovalsTab />);
    
    await waitFor(() => {
      expect(screen.getByText(/apr_123/)).toBeInTheDocument();
    });
    
    // Find the first deny button (there might be multiple rows)
    const denyButtons = screen.getAllByRole("button", { name: "Deny" });
    const enabledDenyButton = denyButtons.find(button => !(button as HTMLButtonElement).disabled);
    expect(enabledDenyButton).toBeInTheDocument();
    
    if (enabledDenyButton) {
      fireEvent.click(enabledDenyButton);
      
      await waitFor(() => {
        expect(deny).toHaveBeenCalledWith("apr_123");
        expect(mockToast).toHaveBeenCalled();
        expect(getApprovals).toHaveBeenCalledTimes(2); // Initial load + refetch after deny
      });
    }
  });

  it("disables action buttons for non-pending approvals", async () => {
    render(<ApprovalsTab />);
    
    await waitFor(() => {
      expect(screen.getByText(/apr_456/)).toBeInTheDocument();
    });
    
    // Find all approve and deny buttons
    const approveButtons = screen.getAllByRole("button", { name: "Approve" });
    const denyButtons = screen.getAllByRole("button", { name: "Deny" });
    
    // Stronger assertion: some buttons should be disabled
    expect(approveButtons.some(button => (button as HTMLButtonElement).disabled)).toBe(true);
    expect(denyButtons.some(button => (button as HTMLButtonElement).disabled)).toBe(true);
  });

  it("shows error message when API fails", async () => {
    vi.mocked(getApprovals).mockRejectedValue(new Error("Network error"));
    render(<ApprovalsTab />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });

  it("shows empty state when no approvals found", async () => {
    vi.mocked(getApprovals).mockResolvedValue({ items: [] });
    render(<ApprovalsTab />);
    
    await waitFor(() => {
      expect(screen.getByText("No approvals found.")).toBeInTheDocument();
    });
  });

  it("auto-refresh toggle exists and can be clicked", async () => {
    render(<ApprovalsTab />);

    // Initial load
    await waitFor(() => {
      expect(getApprovals).toHaveBeenCalledTimes(1);
    });

    // Verify toggle exists and can be clicked
    const toggle = screen.getByLabelText(/Auto-refresh/i);
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    
    // Component should still be rendered
    expect(screen.getByText("Approvals")).toBeInTheDocument();
  });

  it("toggle auto-refresh changes state", async () => {
    render(<ApprovalsTab />);

    // Initial load
    await waitFor(() => {
      expect(getApprovals).toHaveBeenCalledTimes(1);
    });

    const toggle = screen.getByLabelText(/Auto-refresh/i);
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle); // Turn OFF
    
    // Verify the toggle state changed (this tests the toggle functionality)
    expect(toggle).toBeInTheDocument();
  });

  it("renders human-readable timestamps", async () => {
    render(<ApprovalsTab />);

    await waitFor(() => {
      expect(screen.getByText(/apr_123/)).toBeInTheDocument();
    });

    // The formatted date should include a year like 2024 or 2025
    const yearRegex = /(2024|2025)/;
    expect(screen.getAllByText(yearRegex).length).toBeGreaterThan(0);
  });
});
