import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestsDashboard } from "./RequestsDashboard";
import type { AccessRequest, SubmitDecisionResult } from "../types";

// The Server Function boundary is mocked so decision outcomes are
// deterministic and don't depend on the mock module's simulated latency
// or randomized failure flag.
vi.mock("../actions", () => ({
  submitDecision: vi.fn(),
}));

import { submitDecision } from "../actions";

const mockSubmitDecision = vi.mocked(submitDecision);

const baseRequests: AccessRequest[] = [
  {
    id: "req_001",
    requesterName: "Alice Chen",
    requesterEmail: "alice.chen@company.com",
    team: "Payments",
    apiName: "Payment Processing API",
    environment: "production",
    accessLevel: "read",
    status: "approved",
    submittedAt: "2026-03-10T09:15:00.000Z",
    justification: "Need read access to reconcile transaction records.",
    decision: {
      reviewedBy: "bob.smith@company.com",
      reviewedAt: "2026-03-11T14:00:00.000Z",
    },
  },
  {
    id: "req_002",
    requesterName: "Marcus Rivera",
    requesterEmail: "marcus.rivera@company.com",
    team: "Platform Engineering",
    apiName: "Infrastructure Metrics API",
    environment: "staging",
    accessLevel: "admin",
    status: "pending",
    submittedAt: "2026-04-01T11:30:00.000Z",
    justification: "Admin access needed for the observability rollout.",
  },
  {
    id: "req_003",
    requesterName: "Priya Nair",
    requesterEmail: "priya.nair@company.com",
    team: "Data Science",
    apiName: "Customer Insights API",
    environment: "production",
    accessLevel: "read",
    status: "rejected",
    submittedAt: "2026-03-20T08:45:00.000Z",
    justification: "Exploratory analysis for a churn prediction model.",
    reviewerNotes: "PII exposure risk in production.",
    decision: {
      reviewedBy: "carol.james@company.com",
      reviewedAt: "2026-03-21T10:20:00.000Z",
    },
  },
];

function renderDashboard(requests: AccessRequest[] = baseRequests) {
  return render(<RequestsDashboard requests={requests} />);
}

// The table and the mobile-card layout both render at once (CSS handles
// which is visible), so name text appears twice unless queries are scoped
// to the table.
function tableWithin() {
  return within(screen.getByRole("table"));
}

/** Opens the detail panel for Marcus Rivera's (pending) request, via the desktop table's trigger, and returns that button. */
async function openPendingRequestPanel(user: ReturnType<typeof userEvent.setup>) {
  const trigger = tableWithin().getByRole("button", {
    name: /view details for marcus rivera/i,
  });
  await user.click(trigger);
  return trigger;
}

/** Locates Marcus Rivera's row within the desktop table and returns it scoped with `within`. */
function marcusTableRow() {
  const row = tableWithin().getByText("Marcus Rivera").closest("tr");
  if (row === null) {
    throw new Error("Expected Marcus Rivera's table row to exist");
  }
  return within(row);
}

beforeEach(() => {
  mockSubmitDecision.mockReset();
});

describe("RequestsDashboard search and filtering", () => {
  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(screen.getByRole("searchbox", { name: /search/i }), "Marcus");

    expect(tableWithin().getByText("Marcus Rivera")).toBeInTheDocument();
    expect(tableWithin().queryByText("Alice Chen")).not.toBeInTheDocument();
    expect(tableWithin().queryByText("Priya Nair")).not.toBeInTheDocument();
  });

  it("filters the list by status", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /^status$/i }),
      "pending"
    );

    expect(tableWithin().getByText("Marcus Rivera")).toBeInTheDocument();
    expect(tableWithin().queryByText("Alice Chen")).not.toBeInTheDocument();
    expect(tableWithin().queryByText("Priya Nair")).not.toBeInTheDocument();
  });

  it("filters the list by environment", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /^environment$/i }),
      "staging"
    );

    expect(tableWithin().getByText("Marcus Rivera")).toBeInTheDocument();
    expect(tableWithin().queryByText("Alice Chen")).not.toBeInTheDocument();
    expect(tableWithin().queryByText("Priya Nair")).not.toBeInTheDocument();
  });
});

describe("RequestsDashboard filtered-empty state", () => {
  it("shows a no-matches message and restores the full list after clearing filters", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.type(
      screen.getByRole("searchbox", { name: /search/i }),
      "nobody-matches-this"
    );

    expect(
      screen.getByRole("heading", { name: /no matching requests/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(
      screen.queryByRole("heading", { name: /no matching requests/i })
    ).not.toBeInTheDocument();
    expect(tableWithin().getByText("Alice Chen")).toBeInTheDocument();
    expect(tableWithin().getByText("Marcus Rivera")).toBeInTheDocument();
    expect(tableWithin().getByText("Priya Nair")).toBeInTheDocument();
  });
});

describe("RequestsDashboard detail panel", () => {
  it("opens the panel with the selected request's details", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await openPendingRequestPanel(user);

    const panel = screen.getByRole("complementary");
    expect(
      within(panel).getByRole("heading", { name: "Marcus Rivera" })
    ).toBeInTheDocument();
    expect(within(panel).getByText(/observability rollout/i)).toBeInTheDocument();
  });

  it("moves focus into the panel on open and restores it to the trigger when closed with Escape", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const trigger = await openPendingRequestPanel(user);

    const closeButton = screen.getByRole("button", { name: /close detail panel/i });
    expect(closeButton).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });
});

describe("RequestsDashboard decision workflow", () => {
  it("approves a pending request and shows updated status/feedback", async () => {
    mockSubmitDecision.mockResolvedValue({
      ok: true,
      request: {
        ...baseRequests[1],
        status: "approved",
        decision: {
          reviewedBy: "reviewer@company.com",
          reviewedAt: "2026-04-02T00:00:00.000Z",
        },
      },
    } satisfies SubmitDecisionResult);
    const user = userEvent.setup();
    renderDashboard();

    await openPendingRequestPanel(user);
    await user.click(screen.getByRole("button", { name: "Approve" }));

    const panel = screen.getByRole("complementary");
    expect(await within(panel).findByText(/request approved/i)).toBeInTheDocument();
    expect(within(panel).getByText(/reviewed by/i)).toBeInTheDocument();
    expect(mockSubmitDecision).toHaveBeenCalledWith("req_002", "approve");
    expect(marcusTableRow().getByText("Approved")).toBeInTheDocument();
  });

  it("rejects a pending request and shows updated status/feedback", async () => {
    mockSubmitDecision.mockResolvedValue({
      ok: true,
      request: {
        ...baseRequests[1],
        status: "rejected",
        decision: {
          reviewedBy: "reviewer@company.com",
          reviewedAt: "2026-04-02T00:00:00.000Z",
        },
      },
    } satisfies SubmitDecisionResult);
    const user = userEvent.setup();
    renderDashboard();

    await openPendingRequestPanel(user);
    await user.click(screen.getByRole("button", { name: "Reject" }));

    const panel = screen.getByRole("complementary");
    expect(await within(panel).findByText(/request rejected/i)).toBeInTheDocument();
    expect(mockSubmitDecision).toHaveBeenCalledWith("req_002", "reject");
    expect(marcusTableRow().getByText("Rejected")).toBeInTheDocument();
  });

  it("shows a visible error message when the decision submission fails", async () => {
    mockSubmitDecision.mockResolvedValue({
      ok: false,
      error: "[mock] Failed to submit decision for request req_002.",
    } satisfies SubmitDecisionResult);
    const user = userEvent.setup();
    renderDashboard();

    await openPendingRequestPanel(user);
    await user.click(screen.getByRole("button", { name: "Approve" }));

    const panel = screen.getByRole("complementary");
    expect(await within(panel).findByRole("alert")).toHaveTextContent(
      /failed to submit decision/i
    );
    // A failed decision must not silently show the request as decided.
    expect(within(panel).queryByText(/request approved/i)).not.toBeInTheDocument();
  });
});
