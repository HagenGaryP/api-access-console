import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "../schema";

/**
 * Tooling-local database lifecycle.
 *
 * This deliberately does not reuse `src/db/client.ts`. That module (and
 * `src/db/env.ts`) starts with `import "server-only"`, which resolves to the
 * no-op `empty.js` only under the `react-server` export condition. A plain
 * Node process resolves the default entry, which throws on import. Seed and
 * reset therefore own their connection, exactly as `drizzle.config.ts` does.
 *
 * The connection string is passed in rather than read here, so the caller's
 * safety guard always runs before any pool can be constructed.
 */
function createToolingDatabase(pool: Pool) {
  return drizzle(pool, { schema });
}

export type ToolingDatabase = ReturnType<typeof createToolingDatabase>;

export async function withToolingDatabase<T>(
  databaseUrl: string,
  operation: (db: ToolingDatabase) => Promise<T>,
): Promise<T> {
  const pool = new Pool({ connectionString: databaseUrl });

  let operationFailed = false;
  let operationError: unknown;

  try {
    const db = createToolingDatabase(pool);
    return await operation(db);
  } catch (error) {
    operationFailed = true;
    operationError = error;
    throw error;
  } finally {
    try {
      await pool.end();
    } catch (cleanupError) {
      if (operationFailed) {
        throw new AggregateError(
          [operationError, cleanupError],
          "Database operation and connection cleanup both failed.",
        );
      }

      throw cleanupError;
    }
  }
}

/** Prints a failure without a stack, unwrapping the dual-failure case. */
export function reportFailure(error: unknown): void {
  if (error instanceof AggregateError) {
    console.error(error.message);
    for (const inner of error.errors) {
      console.error(`  - ${inner instanceof Error ? inner.message : String(inner)}`);
    }
    return;
  }

  console.error(error instanceof Error ? error.message : String(error));
}
