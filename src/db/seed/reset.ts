import { loadEnvConfig } from "@next/env";

import { assertResetAllowed } from "./guard";
import { DELETION_ORDER } from "./order";
import { reportFailure, withToolingDatabase } from "./runner";

loadEnvConfig(process.cwd());

/**
 * Deletes every seeded row in strict reverse foreign-key order inside one
 * transaction. Schema and migration history are left untouched.
 *
 * The order itself lives in `order.ts` and is regression-tested against the
 * schema's actual foreign keys. `TRUNCATE ... CASCADE` was rejected because it
 * would bypass the `ON DELETE RESTRICT` design rather than respect it.
 */
async function reset(): Promise<void> {
  // Runs before any pool is constructed: a refused reset never connects.
  assertResetAllowed(process.env);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  await withToolingDatabase(databaseUrl, async (db) => {
    await db.transaction(async (tx) => {
      for (const { table } of DELETION_ORDER) {
        await tx.delete(table);
      }
    });
  });

  console.log(
    `Reset complete: cleared ${DELETION_ORDER.length} tables ` +
      `(${DELETION_ORDER.map((entry) => entry.name).join(", ")}). ` +
      "Schema and migration history are unchanged.",
  );
}

reset().catch((error: unknown) => {
  reportFailure(error);
  process.exitCode = 1;
});
