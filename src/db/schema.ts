import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
  unique,
  foreignKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------- Enums ----------

export const roleEnum = pgEnum("role", [
  "requester",
  "reviewer",
  "security_reviewer",
  "administrator",
]);

export const environmentEnum = pgEnum("environment", [
  "development",
  "staging",
  "production",
]);

export const accessRequestStatusEnum = pgEnum("access_request_status", [
  "draft",
  "submitted",
  "under_review",
  "needs_information",
  "approved",
  "rejected",
  "withdrawn",
]);

// ---------- teams ----------

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("teams_name_not_empty", sql`length(trim(${table.name})) > 0`)],
);

// ---------- users ----------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("users_team_id_idx").on(table.teamId),
    check("users_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("users_email_not_empty", sql`length(trim(${table.email})) > 0`),
  ],
);

// ---------- roles (enum value is the primary key; no surrogate id) ----------

export const roles = pgTable("roles", {
  key: roleEnum("key").primaryKey(),
});

// ---------- user_roles (many-to-many join, composite key) ----------

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    roleKey: roleEnum("role_key")
      .notNull()
      .references(() => roles.key, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleKey] })],
);

// ---------- api_products ----------

export const apiProducts = pgTable(
  "api_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("api_products_name_not_empty", sql`length(trim(${table.name})) > 0`)],
);

// ---------- api_scopes ----------

export const apiScopes = pgTable(
  "api_scopes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    apiProductId: uuid("api_product_id")
      .notNull()
      .references(() => apiProducts.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    isPrivileged: boolean("is_privileged").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("api_scopes_product_id_name_key").on(table.apiProductId, table.name),
    // composite-FK target for cross-product scope integrity (see access_request_scopes)
    unique("api_scopes_id_product_id_key").on(table.id, table.apiProductId),
    index("api_scopes_product_id_idx").on(table.apiProductId),
    check("api_scopes_name_not_empty", sql`length(trim(${table.name})) > 0`),
  ],
);

// ---------- access_requests ----------

export const accessRequests = pgTable(
  "access_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // snapshot of the requester's team at submission time — independent of
    // users.teamId, so a later team change never rewrites request history
    requesterTeamId: uuid("requester_team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    apiProductId: uuid("api_product_id")
      .notNull()
      .references(() => apiProducts.id, { onDelete: "restrict" }),
    environment: environmentEnum("environment").notNull(),
    status: accessRequestStatusEnum("status").notNull().default("draft"),
    justification: text("justification").notNull(),
    // optimistic-concurrency guard for reviewer decisions against stale state
    version: integer("version").notNull().default(1),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // composite-FK target for cross-product scope integrity (see access_request_scopes)
    unique("access_requests_id_product_id_key").on(table.id, table.apiProductId),
    index("access_requests_requester_id_idx").on(table.requesterId),
    index("access_requests_api_product_id_idx").on(table.apiProductId),
    index("access_requests_status_idx").on(table.status),
    check("access_requests_justification_not_empty", sql`length(trim(${table.justification})) > 0`),
    check("access_requests_version_positive", sql`${table.version} > 0`),
  ],
);

// ---------- access_request_scopes (normalized requested scopes) ----------

export const accessRequestScopes = pgTable(
  "access_request_scopes",
  {
    accessRequestId: uuid("access_request_id").notNull(),
    apiScopeId: uuid("api_scope_id").notNull(),
    // denormalized on purpose — lets both composite FKs below pin this row
    // to the *same* product on both the request side and the scope side
    apiProductId: uuid("api_product_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.accessRequestId, table.apiScopeId] }),
    foreignKey({
      columns: [table.accessRequestId, table.apiProductId],
      foreignColumns: [accessRequests.id, accessRequests.apiProductId],
      name: "access_request_scopes_request_product_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.apiScopeId, table.apiProductId],
      foreignColumns: [apiScopes.id, apiScopes.apiProductId],
      name: "access_request_scopes_scope_product_fk",
    }).onDelete("restrict"),
    index("access_request_scopes_api_scope_id_idx").on(table.apiScopeId),
  ],
);
