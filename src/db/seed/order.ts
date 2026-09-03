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
 * Reverse foreign-key deletion order for `db:reset`.
 *
 * Every foreign key in this schema is `ON DELETE RESTRICT`, so deleting out of
 * order fails rather than cascading. This lives in its own module so the order
 * can be imported and regression-tested without executing the reset tooling.
 */
export const DELETION_ORDER = [
  { name: "access_request_scopes", table: accessRequestScopes },
  { name: "access_requests", table: accessRequests },
  { name: "user_roles", table: userRoles },
  { name: "api_scopes", table: apiScopes },
  { name: "api_products", table: apiProducts },
  { name: "users", table: users },
  { name: "roles", table: roles },
  { name: "teams", table: teams },
] as const;
