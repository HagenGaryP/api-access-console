"use server";

// Server Functions for the access-requests feature. Only async Server
// Functions may be exported from a file with a top-level "use server"
// directive — non-exported helpers/constants are fine.

import { AccessStatus } from "./types";
import type { AccessRequest, DecisionAction, SubmitDecisionResult } from "./types";
import { findMockAccessRequest, isSimulatedErrorEnabled } from "./mock-data";
import { validateDecisionInput } from "./schema";

const SIMULATED_LATENCY_MS = 400;

/** Mock reviewer identity used for all decisions made in this app. */
const MOCK_REVIEWER_EMAIL = "reviewer@company.com";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates approving or rejecting a request. Does not mutate the
 * module-level mock dataset — callers own the resulting record.
 *
 * Server Functions are reachable independent of the UI (e.g. direct POST
 * requests), so `id`/`action` are treated as untrusted regardless of their
 * declared types and validated before any other work is done.
 */
export async function submitDecision(
  id: string,
  action: DecisionAction,
): Promise<SubmitDecisionResult> {
  const validation = validateDecisionInput(id, action);
  if (!validation.valid) {
    return {
      ok: false,
      error: `[mock] Invalid decision request: ${validation.errors.join("; ")}`,
    };
  }

  await sleep(SIMULATED_LATENCY_MS);

  if (isSimulatedErrorEnabled()) {
    return {
      ok: false,
      error: `[mock] Failed to submit decision for request ${id}.`,
    };
  }

  const found = findMockAccessRequest(id);
  if (found === undefined) {
    return { ok: false, error: `[mock] Request ${id} not found.` };
  }

  if (found.status !== AccessStatus.pending) {
    return {
      ok: false,
      error: `[mock] Only pending requests can be approved or rejected.`,
    };
  }

  const updated: AccessRequest = {
    ...found,
    status:
      action === "approve" ? AccessStatus.approved : AccessStatus.rejected,
    decision: {
      reviewedBy: MOCK_REVIEWER_EMAIL,
      reviewedAt: new Date().toISOString(),
    },
  };

  return { ok: true, request: updated };
}
