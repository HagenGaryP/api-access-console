import { AccessLevel, AccessStatus, Environment } from "./types";
import type { AccessRequest } from "./types";

const VALID_STATUSES = Object.values(AccessStatus);
const VALID_ENVIRONMENTS = Object.values(Environment);
const VALID_ACCESS_LEVELS = Object.values(AccessLevel);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isISODateString(value: unknown): value is string {
  return typeof value === "string" && !isNaN(Date.parse(value));
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export function validateAccessRequest(value: unknown): ValidationResult {
  if (typeof value !== "object" || value === null) {
    return { valid: false, errors: ["value must be a non-null object"] };
  }

  const errors: string[] = [];
  const r = value as Record<string, unknown>;

  if (!isNonEmptyString(r.id)) errors.push("id must be a non-empty string");
  if (!isNonEmptyString(r.requesterName)) errors.push("requesterName must be a non-empty string");
  if (!isNonEmptyString(r.requesterEmail) || !(r.requesterEmail as string).includes("@"))
    errors.push("requesterEmail must be a valid email");
  if (!isNonEmptyString(r.team)) errors.push("team must be a non-empty string");
  if (!isNonEmptyString(r.apiName)) errors.push("apiName must be a non-empty string");
  if (!VALID_ENVIRONMENTS.includes(r.environment as Environment))
    errors.push(`environment must be one of: ${VALID_ENVIRONMENTS.join(", ")}`);
  if (!VALID_ACCESS_LEVELS.includes(r.accessLevel as AccessLevel))
    errors.push(`accessLevel must be one of: ${VALID_ACCESS_LEVELS.join(", ")}`);
  if (!VALID_STATUSES.includes(r.status as AccessStatus))
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  if (!isISODateString(r.submittedAt)) errors.push("submittedAt must be an ISO date string");
  if (!isNonEmptyString(r.justification)) errors.push("justification must be a non-empty string");

  if (r.reviewerNotes !== undefined && !isNonEmptyString(r.reviewerNotes))
    errors.push("reviewerNotes must be a non-empty string if present");

  if (r.decision !== undefined) {
    if (typeof r.decision !== "object" || r.decision === null) {
      errors.push("decision must be a non-null object if present");
    } else {
      const d = r.decision as Record<string, unknown>;
      if (!isNonEmptyString(d.reviewedBy)) errors.push("decision.reviewedBy must be a non-empty string");
      if (!isISODateString(d.reviewedAt)) errors.push("decision.reviewedAt must be an ISO date string");
    }
  }

  const status = r.status as AccessStatus;
  const hasDecision = r.decision !== undefined;
  if ((status === "approved" || status === "rejected") && !hasDecision)
    errors.push(`${status} records must include a decision`);
  if (status === "pending" && hasDecision)
    errors.push("pending records must not include a decision");

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/** Throws if any record in the dataset is invalid. Used as a dev-time sanity check. */
export function assertMockDataValid(records: readonly AccessRequest[]): void {
  for (const record of records) {
    const result = validateAccessRequest(record);
    if (!result.valid) {
      throw new Error(`Invalid mock record ${record.id}: ${result.errors.join("; ")}`);
    }
  }
}
