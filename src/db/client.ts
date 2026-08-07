import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getDatabaseEnv } from "./env";
import * as schema from "./schema";

function createDatabase(pool: Pool) {
  return drizzle(pool, { schema });
}

type RuntimeDatabase = ReturnType<typeof createDatabase>;

export async function withDatabase<T>(
  operation: (db: RuntimeDatabase) => Promise<T>,
): Promise<T> {
  const { DATABASE_URL } = getDatabaseEnv();
  const pool = new Pool({ connectionString: DATABASE_URL });

  let lifecycleFailed = false;
  let lifecycleError: unknown;

  try {
    const db = createDatabase(pool);
    return await operation(db);
  } catch (error) {
    lifecycleFailed = true;
    lifecycleError = error;
    throw error;
  } finally {
    try {
      await pool.end();
    } catch (cleanupError) {
      if (lifecycleFailed) {
        throw new AggregateError(
          [lifecycleError, cleanupError],
          "Database operation and connection cleanup both failed.",
        );
      }

      throw cleanupError;
    }
  }
}
