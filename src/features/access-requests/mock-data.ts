import type { AccessRequest } from "./types";
import { assertMockDataValid } from "./schema";

const SIMULATED_LATENCY_MS = 400;

// Set to true to simulate a fetch failure for testing error states.
let simulateError = false;

export function setSimulateError(value: boolean): void {
  simulateError = value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockAccessRequests: ReadonlyArray<AccessRequest> = [
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
    justification: "Need read access to reconcile transaction records for quarterly audit.",
    reviewerNotes: "Standard audit access. Approved.",
    decision: { reviewedBy: "bob.smith@company.com", reviewedAt: "2026-03-11T14:00:00.000Z" },
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
    justification:
      "Setting up a new observability pipeline. Admin access required to configure metric retention policies and create alert routing rules during the staging rollout before we promote to production.",
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
    reviewerNotes: "PII exposure risk in production. Please request access to the anonymized staging dataset instead.",
    decision: { reviewedBy: "carol.james@company.com", reviewedAt: "2026-03-21T10:20:00.000Z" },
  },
  {
    id: "req_004",
    requesterName: "James Okafor",
    requesterEmail: "james.okafor@company.com",
    team: "Mobile",
    apiName: "Push Notification API",
    environment: "development",
    accessLevel: "write",
    status: "approved",
    submittedAt: "2026-04-05T13:00:00.000Z",
    justification: "Building the in-app notification feature for the v4.2 release.",
    reviewerNotes: "Dev environment only. Approved for sprint duration.",
    decision: { reviewedBy: "bob.smith@company.com", reviewedAt: "2026-04-05T16:45:00.000Z" },
  },
  {
    id: "req_005",
    requesterName: "Sofia Lindqvist",
    requesterEmail: "sofia.lindqvist@company.com",
    team: "Finance",
    apiName: "Payment Processing API",
    environment: "production",
    accessLevel: "write",
    status: "pending",
    submittedAt: "2026-04-18T10:05:00.000Z",
    justification:
      "Finance needs write access to initiate refund workflows on behalf of support agents. Currently this is a manual process handled by the Payments team on request, which introduces delays. Automating it here will reduce resolution time from ~2 days to under 1 hour.",
  },
  {
    id: "req_006",
    requesterName: "Devon Walsh",
    requesterEmail: "devon.walsh@company.com",
    team: "Security",
    apiName: "Audit Log API",
    environment: "production",
    accessLevel: "read",
    status: "approved",
    submittedAt: "2026-02-14T07:30:00.000Z",
    justification: "Ongoing SOC 2 compliance monitoring. Security team requires persistent read access.",
    decision: { reviewedBy: "carol.james@company.com", reviewedAt: "2026-02-14T09:00:00.000Z" },
  },
  {
    id: "req_007",
    requesterName: "Yuki Tanaka",
    requesterEmail: "yuki.tanaka@company.com",
    team: "Growth",
    apiName: "Customer Insights API",
    environment: "staging",
    accessLevel: "read",
    status: "pending",
    submittedAt: "2026-04-22T14:20:00.000Z",
    justification: "A/B test analysis for the onboarding redesign experiment launching next sprint.",
  },
  {
    id: "req_008",
    requesterName: "Carlos Mendez",
    requesterEmail: "carlos.mendez@company.com",
    team: "Platform Engineering",
    apiName: "Service Registry API",
    environment: "production",
    accessLevel: "admin",
    status: "rejected",
    submittedAt: "2026-04-10T09:00:00.000Z",
    justification:
      "Need admin access to deregister deprecated service instances as part of the microservice consolidation project.",
    reviewerNotes: "Too broad. Please scope this to a write-level request with specific service IDs listed.",
    decision: { reviewedBy: "carol.james@company.com", reviewedAt: "2026-04-11T11:30:00.000Z" },
  },
  {
    id: "req_009",
    requesterName: "Nina Patel",
    requesterEmail: "nina.patel@company.com",
    team: "Data Science",
    apiName: "Infrastructure Metrics API",
    environment: "staging",
    accessLevel: "read",
    status: "approved",
    submittedAt: "2026-03-28T12:00:00.000Z",
    justification: "Training a cost-anomaly detection model that needs historical metric data.",
    decision: { reviewedBy: "bob.smith@company.com", reviewedAt: "2026-03-29T08:15:00.000Z" },
  },
  {
    id: "req_010",
    requesterName: "Elliot Grant",
    requesterEmail: "elliot.grant@company.com",
    team: "Mobile",
    apiName: "User Profile API",
    environment: "development",
    accessLevel: "write",
    status: "pending",
    submittedAt: "2026-04-23T16:50:00.000Z",
    justification: "Implementing profile edit flow for the mobile app redesign.",
  },
];

assertMockDataValid(mockAccessRequests);

function cloneAccessRequest(r: AccessRequest): AccessRequest {
  return { ...r, ...(r.decision ? { decision: { ...r.decision } } : {}) };
}

export async function fetchAccessRequests(): Promise<AccessRequest[]> {
  await sleep(SIMULATED_LATENCY_MS);
  if (simulateError) {
    throw new Error("[mock] Failed to fetch access requests.");
  }
  return mockAccessRequests.map(cloneAccessRequest);
}

export async function fetchAccessRequestById(
  id: string
): Promise<AccessRequest | undefined> {
  await sleep(SIMULATED_LATENCY_MS);
  if (simulateError) {
    throw new Error(`[mock] Failed to fetch access request ${id}.`);
  }
  const found = mockAccessRequests.find((r) => r.id === id);
  return found ? cloneAccessRequest(found) : undefined;
}
