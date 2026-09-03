import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";

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
import {
  productRows,
  requestRows,
  requestScopeRows,
  roleRows,
  scopeRows,
  teamRows,
  userRoleRows,
  userRows,
} from "./data";
import { assertSeedAllowed } from "./guard";
import { reportFailure, withToolingDatabase } from "./runner";

loadEnvConfig(process.cwd());

/**
 * Inserts the demo dataset in foreign-key order inside a single transaction.
 *
 * Rows are upserted on their stable primary keys, so a repeat run converges to
 * the same state instead of duplicating or failing. Join tables carry no
 * mutable payload, so they only need conflict tolerance.
 */
async function seed(): Promise<void> {
  assertSeedAllowed(process.env);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  await withToolingDatabase(databaseUrl, async (db) => {
    await db.transaction(async (tx) => {
      await tx
        .insert(teams)
        .values(teamRows)
        .onConflictDoUpdate({ target: teams.id, set: { name: sql`excluded.name` } });

      await tx.insert(roles).values(roleRows).onConflictDoNothing();

      await tx
        .insert(users)
        .values(userRows)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: sql`excluded.name`,
            email: sql`excluded.email`,
            teamId: sql`excluded.team_id`,
          },
        });

      await tx.insert(userRoles).values(userRoleRows).onConflictDoNothing();

      await tx
        .insert(apiProducts)
        .values(productRows)
        .onConflictDoUpdate({
          target: apiProducts.id,
          set: { name: sql`excluded.name`, description: sql`excluded.description` },
        });

      await tx
        .insert(apiScopes)
        .values(scopeRows)
        .onConflictDoUpdate({
          target: apiScopes.id,
          set: {
            apiProductId: sql`excluded.api_product_id`,
            name: sql`excluded.name`,
            description: sql`excluded.description`,
            isPrivileged: sql`excluded.is_privileged`,
          },
        });

      await tx
        .insert(accessRequests)
        .values(requestRows)
        .onConflictDoUpdate({
          target: accessRequests.id,
          set: {
            requesterId: sql`excluded.requester_id`,
            requesterTeamId: sql`excluded.requester_team_id`,
            apiProductId: sql`excluded.api_product_id`,
            environment: sql`excluded.environment`,
            status: sql`excluded.status`,
            justification: sql`excluded.justification`,
            version: sql`excluded.version`,
            submittedAt: sql`excluded.submitted_at`,
            updatedAt: sql`excluded.updated_at`,
          },
        });

      await tx.insert(accessRequestScopes).values(requestScopeRows).onConflictDoNothing();
    });
  });

  console.log(
    `Seed complete: ${teamRows.length} teams, ${userRows.length} users, ` +
      `${productRows.length} API products, ${scopeRows.length} scopes, ` +
      `${requestRows.length} access requests.`,
  );
}

seed().catch((error: unknown) => {
  reportFailure(error);
  process.exitCode = 1;
});
