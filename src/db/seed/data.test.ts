// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  PRODUCT_IDS,
  REQUEST_IDS,
  TEAM_IDS,
  USER_IDS,
  productRows,
  requestRows,
  requestScopeRows,
  roleRows,
  scopeRows,
  teamRows,
  userRoleRows,
  userRows,
} from "./data";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const allIds = [
  ...Object.values(TEAM_IDS),
  ...Object.values(USER_IDS),
  ...Object.values(PRODUCT_IDS),
  ...scopeRows.map((row) => row.id),
  ...REQUEST_IDS,
];

describe("seed identifiers", () => {
  it("are well-formed UUIDs", () => {
    for (const id of allIds) {
      expect(id).toMatch(UUID_PATTERN);
    }
  });

  it("are unique across every entity", () => {
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("cover the expected dataset size", () => {
    expect(teamRows).toHaveLength(7);
    expect(roleRows).toHaveLength(4);
    expect(userRows).toHaveLength(12);
    expect(productRows).toHaveLength(7);
    // three scopes per product
    expect(scopeRows).toHaveLength(21);
    expect(requestRows).toHaveLength(10);
    expect(requestScopeRows).toHaveLength(10);
  });
});

describe("seed referential integrity", () => {
  const teamIds = new Set(Object.values(TEAM_IDS));
  const userIds = new Set(Object.values(USER_IDS));
  const productIds = new Set(Object.values(PRODUCT_IDS));
  const scopesById = new Map(scopeRows.map((row) => [row.id, row]));
  const requestsById = new Map(requestRows.map((row) => [row.id, row]));

  it("points every user at a known team", () => {
    for (const user of userRows) {
      expect(teamIds.has(user.teamId)).toBe(true);
    }
  });

  it("points every role assignment at a known user", () => {
    for (const assignment of userRoleRows) {
      expect(userIds.has(assignment.userId)).toBe(true);
    }
  });

  it("points every scope at a known product", () => {
    for (const scope of scopeRows) {
      expect(productIds.has(scope.apiProductId)).toBe(true);
    }
  });

  it("gives each product a uniquely named scope set", () => {
    const keys = scopeRows.map((row) => `${row.apiProductId}:${row.name}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("points every request at a known requester, team, and product", () => {
    for (const request of requestRows) {
      expect(userIds.has(request.requesterId)).toBe(true);
      expect(teamIds.has(request.requesterTeamId)).toBe(true);
      expect(productIds.has(request.apiProductId)).toBe(true);
    }
  });

  it("snapshots the requester's own team on the request", () => {
    const teamByUserId = new Map(userRows.map((row) => [row.id, row.teamId]));
    for (const request of requestRows) {
      expect(request.requesterTeamId).toBe(teamByUserId.get(request.requesterId));
    }
  });

  it("satisfies the cross-product scope invariant enforced by both composite FKs", () => {
    for (const row of requestScopeRows) {
      const scope = scopesById.get(row.apiScopeId);
      const request = requestsById.get(row.accessRequestId);

      expect(scope).toBeDefined();
      expect(request).toBeDefined();
      // The denormalized product must match on the scope side and the request
      // side, or Postgres rejects the row.
      expect(scope?.apiProductId).toBe(row.apiProductId);
      expect(request?.apiProductId).toBe(row.apiProductId);
    }
  });
});

describe("seed determinism", () => {
  it("uses fixed timestamps rather than run-time values", () => {
    for (const request of requestRows) {
      expect(request.submittedAt).toBeInstanceOf(Date);
      expect(Number.isNaN((request.submittedAt as Date).getTime())).toBe(false);
      // createdAt/updatedAt are pinned to submittedAt so re-seeding cannot
      // rewrite history.
      expect(request.createdAt).toEqual(request.submittedAt);
      expect(request.updatedAt).toEqual(request.submittedAt);
    }
  });

  it("pins known request values so drift is caught", () => {
    expect(requestRows[0].submittedAt).toEqual(new Date("2026-03-10T09:15:00.000Z"));
    expect(requestRows[0].status).toBe("approved");
    expect(requestRows[0].environment).toBe("production");
    expect(requestRows[0].version).toBe(1);
  });

  it("maps every mock 'pending' request onto the schema's 'submitted' status", () => {
    const statuses = new Set(requestRows.map((row) => row.status));
    expect(statuses).toEqual(new Set(["approved", "rejected", "submitted"]));
  });
});
