import {
  accessRequestScopes,
  accessRequests,
  apiProducts,
  apiScopes,
  roles,
  teams,
  userRoles,
  users,
} from "../schema";

/**
 * Deterministic demo dataset.
 *
 * Every identifier and timestamp below is a fixed literal (or a pure function
 * of a fixed index) rather than generated at run time, so seeding the same
 * database twice produces byte-identical rows. Nothing here calls
 * `crypto.randomUUID()`, `Date.now()`, or relies on a column default.
 *
 * The identities, teams, products, environments, and justifications mirror
 * `src/features/access-requests/mock-data.ts` so the dashboard looks the same
 * once it reads from the database. Reviewer decisions and reviewer notes are
 * intentionally absent: the current schema does not model them.
 */

// UUIDs are grouped by entity in the variant nibble so a row's kind is obvious
// on sight: 8000 teams, 8001 users, 8002 products, 8003 scopes, 8004 requests.
function entityId(group: string, index: number): string {
  return `00000000-0000-4000-${group}-${String(index).padStart(12, "0")}`;
}

function fixedDate(iso: string): Date {
  return new Date(iso);
}

// ---------- teams ----------

const TEAM_NAMES = [
  "Payments",
  "Platform Engineering",
  "Data Science",
  "Mobile",
  "Finance",
  "Security",
  "Growth",
] as const;

type TeamName = (typeof TEAM_NAMES)[number];

const TEAM_CREATED_AT = fixedDate("2026-01-05T00:00:00.000Z");

export const TEAM_IDS = Object.fromEntries(
  TEAM_NAMES.map((name, index) => [name, entityId("8000", index + 1)]),
) as Record<TeamName, string>;

export const teamRows: (typeof teams.$inferInsert)[] = TEAM_NAMES.map((name) => ({
  id: TEAM_IDS[name],
  name,
  createdAt: TEAM_CREATED_AT,
}));

// ---------- roles ----------

// Lookup table for the role enum. `administrator` has no demo holder yet; the
// row exists because the table is a catalog, not a membership list.
export const roleRows: (typeof roles.$inferInsert)[] = [
  { key: "requester" },
  { key: "reviewer" },
  { key: "security_reviewer" },
  { key: "administrator" },
];

// ---------- users ----------

type SeedUser = {
  readonly email: string;
  readonly name: string;
  readonly team: TeamName;
  readonly role: (typeof roleRows)[number]["key"];
};

const SEED_USERS = [
  { email: "alice.chen@company.com", name: "Alice Chen", team: "Payments", role: "requester" },
  {
    email: "marcus.rivera@company.com",
    name: "Marcus Rivera",
    team: "Platform Engineering",
    role: "requester",
  },
  { email: "priya.nair@company.com", name: "Priya Nair", team: "Data Science", role: "requester" },
  { email: "james.okafor@company.com", name: "James Okafor", team: "Mobile", role: "requester" },
  {
    email: "sofia.lindqvist@company.com",
    name: "Sofia Lindqvist",
    team: "Finance",
    role: "requester",
  },
  { email: "devon.walsh@company.com", name: "Devon Walsh", team: "Security", role: "requester" },
  { email: "yuki.tanaka@company.com", name: "Yuki Tanaka", team: "Growth", role: "requester" },
  {
    email: "carlos.mendez@company.com",
    name: "Carlos Mendez",
    team: "Platform Engineering",
    role: "requester",
  },
  { email: "nina.patel@company.com", name: "Nina Patel", team: "Data Science", role: "requester" },
  { email: "elliot.grant@company.com", name: "Elliot Grant", team: "Mobile", role: "requester" },
  // Reviewers appear in the mock data only as decision email addresses. Their
  // display names and teams are inferred so they can exist as demo identities;
  // their past decisions are deliberately not persisted.
  {
    email: "bob.smith@company.com",
    name: "Bob Smith",
    team: "Platform Engineering",
    role: "reviewer",
  },
  {
    email: "carol.james@company.com",
    name: "Carol James",
    team: "Security",
    role: "security_reviewer",
  },
] as const satisfies readonly SeedUser[];

type UserEmail = (typeof SEED_USERS)[number]["email"];

const USER_CREATED_AT = fixedDate("2026-01-12T00:00:00.000Z");

export const USER_IDS = Object.fromEntries(
  SEED_USERS.map((user, index) => [user.email, entityId("8001", index + 1)]),
) as Record<UserEmail, string>;

export const userRows: (typeof users.$inferInsert)[] = SEED_USERS.map((user) => ({
  id: USER_IDS[user.email],
  name: user.name,
  email: user.email,
  teamId: TEAM_IDS[user.team],
  createdAt: USER_CREATED_AT,
}));

export const userRoleRows: (typeof userRoles.$inferInsert)[] = SEED_USERS.map((user) => ({
  userId: USER_IDS[user.email],
  roleKey: user.role,
  createdAt: USER_CREATED_AT,
}));

// ---------- api products and scopes ----------

const PRODUCT_NAMES = [
  "Payment Processing API",
  "Infrastructure Metrics API",
  "Customer Insights API",
  "Push Notification API",
  "Audit Log API",
  "Service Registry API",
  "User Profile API",
] as const;

type ProductName = (typeof PRODUCT_NAMES)[number];

// Mirrors the mock `accessLevel` union. Each product exposes the same three
// scopes, which keeps the catalog uniform and the request mapping mechanical.
const SCOPE_LEVELS = ["read", "write", "admin"] as const;

type ScopeLevel = (typeof SCOPE_LEVELS)[number];

const CATALOG_CREATED_AT = fixedDate("2026-01-20T00:00:00.000Z");

export const PRODUCT_IDS = Object.fromEntries(
  PRODUCT_NAMES.map((name, index) => [name, entityId("8002", index + 1)]),
) as Record<ProductName, string>;

export const productRows: (typeof apiProducts.$inferInsert)[] = PRODUCT_NAMES.map((name) => ({
  id: PRODUCT_IDS[name],
  name,
  description: `${name} for internal consumers.`,
  createdAt: CATALOG_CREATED_AT,
}));

function scopeId(productIndex: number, levelIndex: number): string {
  return entityId("8003", (productIndex + 1) * 100 + (levelIndex + 1));
}

export function getScopeId(product: ProductName, level: ScopeLevel): string {
  return scopeId(PRODUCT_NAMES.indexOf(product), SCOPE_LEVELS.indexOf(level));
}

export const scopeRows: (typeof apiScopes.$inferInsert)[] = PRODUCT_NAMES.flatMap(
  (product, productIndex) =>
    SCOPE_LEVELS.map((level, levelIndex) => ({
      id: scopeId(productIndex, levelIndex),
      apiProductId: PRODUCT_IDS[product],
      name: level,
      description: `${level} access to ${product}.`,
      // Admin is the only level that grants configuration authority.
      isPrivileged: level === "admin",
      createdAt: CATALOG_CREATED_AT,
    })),
);

// ---------- access requests ----------

type SeedRequest = {
  readonly requester: UserEmail;
  readonly product: ProductName;
  readonly level: ScopeLevel;
  readonly environment: (typeof accessRequests.$inferInsert)["environment"];
  readonly status: (typeof accessRequests.$inferInsert)["status"];
  readonly submittedAt: string;
  readonly justification: string;
};

// `pending` in the mock dataset maps to the schema's `submitted` status; the
// other mock statuses exist verbatim in the enum.
const SEED_REQUESTS = [
  {
    requester: "alice.chen@company.com",
    product: "Payment Processing API",
    level: "read",
    environment: "production",
    status: "approved",
    submittedAt: "2026-03-10T09:15:00.000Z",
    justification:
      "Need read access to reconcile transaction records for quarterly audit.",
  },
  {
    requester: "marcus.rivera@company.com",
    product: "Infrastructure Metrics API",
    level: "admin",
    environment: "staging",
    status: "submitted",
    submittedAt: "2026-04-01T11:30:00.000Z",
    justification:
      "Setting up a new observability pipeline. Admin access required to configure metric retention policies and create alert routing rules during the staging rollout before we promote to production.",
  },
  {
    requester: "priya.nair@company.com",
    product: "Customer Insights API",
    level: "read",
    environment: "production",
    status: "rejected",
    submittedAt: "2026-03-20T08:45:00.000Z",
    justification: "Exploratory analysis for a churn prediction model.",
  },
  {
    requester: "james.okafor@company.com",
    product: "Push Notification API",
    level: "write",
    environment: "development",
    status: "approved",
    submittedAt: "2026-04-05T13:00:00.000Z",
    justification: "Building the in-app notification feature for the v4.2 release.",
  },
  {
    requester: "sofia.lindqvist@company.com",
    product: "Payment Processing API",
    level: "write",
    environment: "production",
    status: "submitted",
    submittedAt: "2026-04-18T10:05:00.000Z",
    justification:
      "Finance needs write access to initiate refund workflows on behalf of support agents. Currently this is a manual process handled by the Payments team on request, which introduces delays. Automating it here will reduce resolution time from ~2 days to under 1 hour.",
  },
  {
    requester: "devon.walsh@company.com",
    product: "Audit Log API",
    level: "read",
    environment: "production",
    status: "approved",
    submittedAt: "2026-02-14T07:30:00.000Z",
    justification:
      "Ongoing SOC 2 compliance monitoring. Security team requires persistent read access.",
  },
  {
    requester: "yuki.tanaka@company.com",
    product: "Customer Insights API",
    level: "read",
    environment: "staging",
    status: "submitted",
    submittedAt: "2026-04-22T14:20:00.000Z",
    justification:
      "A/B test analysis for the onboarding redesign experiment launching next sprint.",
  },
  {
    requester: "carlos.mendez@company.com",
    product: "Service Registry API",
    level: "admin",
    environment: "production",
    status: "rejected",
    submittedAt: "2026-04-10T09:00:00.000Z",
    justification:
      "Need admin access to deregister deprecated service instances as part of the microservice consolidation project.",
  },
  {
    requester: "nina.patel@company.com",
    product: "Infrastructure Metrics API",
    level: "read",
    environment: "staging",
    status: "approved",
    submittedAt: "2026-03-28T12:00:00.000Z",
    justification:
      "Training a cost-anomaly detection model that needs historical metric data.",
  },
  {
    requester: "elliot.grant@company.com",
    product: "User Profile API",
    level: "write",
    environment: "development",
    status: "submitted",
    submittedAt: "2026-04-23T16:50:00.000Z",
    justification: "Implementing profile edit flow for the mobile app redesign.",
  },
] as const satisfies readonly SeedRequest[];

export const REQUEST_IDS = SEED_REQUESTS.map((_, index) => entityId("8004", index + 1));

function teamOf(email: UserEmail): TeamName {
  const user = SEED_USERS.find((candidate) => candidate.email === email);
  if (!user) {
    throw new Error(`Seed data references an unknown user: ${email}`);
  }
  return user.team;
}

export const requestRows: (typeof accessRequests.$inferInsert)[] = SEED_REQUESTS.map(
  (request, index) => {
    const submittedAt = fixedDate(request.submittedAt);
    return {
      id: REQUEST_IDS[index],
      requesterId: USER_IDS[request.requester],
      // Snapshot of the requester's team at submission time.
      requesterTeamId: TEAM_IDS[teamOf(request.requester)],
      apiProductId: PRODUCT_IDS[request.product],
      environment: request.environment,
      status: request.status,
      justification: request.justification,
      version: 1,
      submittedAt,
      // Fixed rather than `defaultNow()` so re-seeding never rewrites history.
      createdAt: submittedAt,
      updatedAt: submittedAt,
    };
  },
);

export const requestScopeRows: (typeof accessRequestScopes.$inferInsert)[] = SEED_REQUESTS.map(
  (request, index) => ({
    accessRequestId: REQUEST_IDS[index],
    apiScopeId: getScopeId(request.product, request.level),
    // Denormalized so both composite foreign keys pin this row to one product.
    apiProductId: PRODUCT_IDS[request.product],
    createdAt: fixedDate(request.submittedAt),
  }),
);
