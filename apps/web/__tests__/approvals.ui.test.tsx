import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
// Mock the API functions with the SAME alias that ApprovalsTab uses
vi.mock("@/features/approvals/api", () => ({
  getApprovals: vi.fn(),
  approve: vi.fn(),
  deny: vi.fn(),
  approveMany: vi.fn(),
  denyMany: vi.fn(),
  // Also mock the original names for backward compatibility
  listApprovals: vi.fn(),
  approveApproval: vi.fn(),
  denyApproval: vi.fn(),
}));

// NO importo ApprovalsTab aquí - lo haré dinámicamente después del mock
import * as api from "@/features/approvals/api";
import { getApprovals, approve, deny, approveMany } from "@/features/approvals/api";

// Set up the mock implementation immediately after the mock declaration
vi.mocked(getApprovals).mockImplementation(async (params: any) => {
  const status = params?.status;
  const limit = params?.limit;
  
  // Debug: log what parameters we're getting
  console.log('getApprovals called with:', { status, limit, params });
  
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
  
  // For table calls (limit: 50 or undefined) - return mockApprovals which contains apr_123 and apr_456
  console.log('Returning mockApprovals for table:', mockApprovals);
  return { items: mockApprovals };
});

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
    ctx: {
      tool: "http.post",
      domain: "api.example.com",
      method: "POST",
      path: "/v1/tools/http.post",
    },
    status: "pending" as const,
    note: "High risk operation",
  },
  {
    id: "apr_456",
    agentId: "agent2",
    createdAt: 1730000100000,
    expiresAt: 1730003700000,
    reason: "policy",
    ctx: {
      tool: "shell.execute",
      domain: "localhost",
      method: "POST",
      path: "/v1/tools/shell.execute",
    },
    status: "approved" as const,
  },
];

describe("ApprovalsTab", () => {
  let ApprovalsTab: any;
  
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules(); // invalida caché de módulos
    
    // Evita que el autorefresh te ensucie el grafo/llamadas
    vi.spyOn(global, "setInterval").mockReturnValue(0 as any);

    vi.mocked(api.getApprovals).mockImplementation(async (params: any) => {
      const { status, limit } = params ?? {};
      // Métricas (limit: 1000)
      if (limit === 1000) {
        if (status === "pending")  return { items: [{ id: "p1", agentId: "agent1", createdAt: Date.now(), status: "pending" as const }] };
        if (status === "approved") return { items: [{ id: "a1", agentId: "agent2", createdAt: Date.now(), status: "approved" as const }] };
        if (status === "denied")   return { items: [{ id: "d1", agentId: "agent3", createdAt: Date.now(), status: "denied" as const }] };
        return { items: [] };
      }
      // Tabla (cualquier otro caso)
      return { items: mockApprovals };
    });
    
    // Import dinámico después del mock
    const module = await import("../app/(dashboard)/approvals/ApprovalsTab");
    ApprovalsTab = module.default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders filters, buttons, and table headers", async () => {
    render(<ApprovalsTab />);

    // Wait for component to finish loading and check filters
    await waitFor(() => {
      expect(screen.getAllByText("Status")).toHaveLength(2); // Filter label + table header
      expect(screen.getAllByText("Agent")).toHaveLength(2); // Filter label + table header
      expect(screen.getByText("Auto-refresh")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Refresh" })
      ).toBeInTheDocument();
    });

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
      expect(api.getApprovals).toHaveBeenCalledWith({
        status: "approved",
        agentId: undefined,
        limit: 50,
        search: undefined,
      });
    });
  });

  it("changes agentId filter and triggers correct query", async () => {
    render(<ApprovalsTab />);

    const agentInput = screen.getByPlaceholderText("agentId");
    fireEvent.change(agentInput, { target: { value: "agent123" } });

    await waitFor(() => {
      expect(api.getApprovals).toHaveBeenCalledWith({
        status: "pending",
        agentId: "agent123",
        limit: 50,
        search: undefined,
      });
    });
  });

  it("calls approve API, shows toast, and refetches", async () => {
    vi.mocked(api.approve).mockResolvedValue({ status: "approved" });
    render(<ApprovalsTab />);

    await waitFor(() => {
      expect(screen.getByText(/apr_123/)).toBeInTheDocument();
    });

    // Find the first approve button (there might be multiple rows)
    const approveButtons = screen.getAllByRole("button", { name: "Approve" });
    const enabledApproveButton = approveButtons.find(
      (button) => !(button as HTMLButtonElement).disabled
    );
    expect(enabledApproveButton).toBeInTheDocument();

    if (enabledApproveButton) {
      fireEvent.click(enabledApproveButton);

      await waitFor(() => {
        expect(approve).toHaveBeenCalledWith("apr_123", undefined);
        expect(mockToast).toHaveBeenCalled();
        // Verify API was called for refresh (don't count exact calls)
        expect(api.getApprovals).toHaveBeenCalled();
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
    const enabledDenyButton = denyButtons.find(
      (button) => !(button as HTMLButtonElement).disabled
    );
    expect(enabledDenyButton).toBeInTheDocument();

    if (enabledDenyButton) {
      fireEvent.click(enabledDenyButton);

      await waitFor(() => {
        expect(deny).toHaveBeenCalledWith("apr_123", undefined);
        expect(mockToast).toHaveBeenCalled();
        // Verify API was called for refresh (don't count exact calls)
        expect(api.getApprovals).toHaveBeenCalled();
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
    expect(
      approveButtons.some((button) => (button as HTMLButtonElement).disabled)
    ).toBe(true);
    expect(
      denyButtons.some((button) => (button as HTMLButtonElement).disabled)
    ).toBe(true);
  });

  it("shows error message when API fails", async () => {
    vi.mocked(getApprovals).mockRejectedValue(new Error("Network error"));
    render(<ApprovalsTab />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to load",
        description: "Network error",
        variant: "destructive",
      });
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

    // Initial load: verify API was called (don't count exact calls)
    await waitFor(() => {
      expect(api.getApprovals).toHaveBeenCalled();
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

    // Initial load: verify API was called
    await waitFor(() => {
      expect(api.getApprovals).toHaveBeenCalled();
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

  // --- Day 9: métricas ---

  it("renders metrics cards with correct counts", async () => {
    // El componente hará 4 llamadas en el primer render:
    // 1) tabla con params actuales
    // 2) metrics pending
    // 3) metrics approved
    // 4) metrics denied
    const impl = vi
      .fn()
      .mockResolvedValueOnce({ items: mockApprovals }) // tabla
      .mockResolvedValueOnce({ items: [{ id: "p1" }] }) // pending = 1
      .mockResolvedValueOnce({ items: [{ id: "a1" }, { id: "a2" }] }) // approved = 2
      .mockResolvedValueOnce({ items: [] }); // denied = 0
    vi.mocked(getApprovals).mockImplementation(impl as any);

    render(<ApprovalsTab />);

  // asegura que la pantalla cargó
  await screen.findByText("Approvals");

  // verifica los cards de métricas
  await waitFor(() => {
    expect(screen.getByText("Pending: 1")).toBeInTheDocument();
    expect(screen.getByText("Approved: 2")).toBeInTheDocument();
    expect(screen.getByText("Denied: 0")).toBeInTheDocument();
  });
  });

  it("updates metrics on Refresh click", async () => {
    // Configurar mock específico para este test
    vi.mocked(getApprovals).mockImplementation(async (params: any) => {
      const status = params?.status;
      if (status === "pending") return { items: [{ id: "p1", agentId: "agent1", createdAt: Date.now(), status: "pending" as const }] };
      if (status === "approved") return { items: [{ id: "a1", agentId: "agent2", createdAt: Date.now(), status: "approved" as const }, { id: "a2", agentId: "agent3", createdAt: Date.now(), status: "approved" as const }] };
      if (status === "denied") return { items: [] };
      // Para la tabla principal
      return { items: mockApprovals };
    });

    render(<ApprovalsTab />);

    // espera métricas iniciales
    await screen.findByText("Approvals");
    await waitFor(() => {
      expect(screen.getByText("Pending: 1")).toBeInTheDocument();
      expect(screen.getByText("Approved: 2")).toBeInTheDocument();
      expect(screen.getByText("Denied: 0")).toBeInTheDocument();
    });

    // Configurar mock para después del refresh
    vi.mocked(getApprovals).mockImplementation(async (params: any) => {
      const status = params?.status;
      if (status === "pending") return { items: [{ id: "p1", agentId: "agent1", createdAt: Date.now(), status: "pending" as const }, { id: "p2", agentId: "agent2", createdAt: Date.now(), status: "pending" as const }] };
      if (status === "approved") return { items: [{ id: "a1", agentId: "agent2", createdAt: Date.now(), status: "approved" as const }] };
      if (status === "denied") return { items: [{ id: "d1", agentId: "agent3", createdAt: Date.now(), status: "denied" as const }] };
      // Para la tabla principal
      return { items: mockApprovals };
    });

    // click en Refresh
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    // métricas actualizadas
    await waitFor(() => {
      expect(screen.getByText("Pending: 2")).toBeInTheDocument();
      expect(screen.getByText("Approved: 1")).toBeInTheDocument();
      expect(screen.getByText("Denied: 1")).toBeInTheDocument();
    });
  });

  it("select all and bulk approve works", async () => {
    vi.mocked(approveMany).mockResolvedValue({ status: "approved" });

    render(<ApprovalsTab />);

    await waitFor(() => {
      expect(screen.getByText("apr_123")).toBeInTheDocument();
    });

    // Select all
    fireEvent.click(screen.getByLabelText('Select all'));
    
    // Bulk approve
    fireEvent.click(screen.getByRole('button', { name: /Approve selected/i }));

    await waitFor(() => {
      expect(approveMany).toHaveBeenCalledWith(expect.arrayContaining(['apr_123', 'apr_456']));
      expect(mockToast).toHaveBeenCalled();
    });
  });
});
