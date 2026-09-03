import { z } from "zod";

/**
 * Explicit classification of the database that `DATABASE_URL` points at.
 *
 * Deliberately separate from `NODE_ENV`/`VERCEL_ENV`: a local development
 * process can be pointed at a shared staging or production database, so
 * process signals alone can never establish that a destructive operation is
 * safe. This value describes the *data*, not the process.
 */
const DATABASE_ENVIRONMENTS = ["development", "staging", "production"] as const;

export type DatabaseEnvironment = (typeof DATABASE_ENVIRONMENTS)[number];

const databaseEnvironmentSchema = z.enum(DATABASE_ENVIRONMENTS);

/** Only the variables the guard reads. Injected so the guard stays pure and testable. */
export type ToolingEnv = Record<string, string | undefined>;

/**
 * Exact string required to unlock a destructive reset. Compared with `===`
 * rather than parsed as a boolean so that `"1"`, `"TRUE"`, `"yes"`, and any
 * other near-miss value fail closed.
 */
const RESET_UNLOCK_VALUE = "true";

function assertProcessIsNotProduction(env: ToolingEnv): void {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run database tooling: NODE_ENV is 'production'.",
    );
  }

  if (env.VERCEL_ENV === "production") {
    throw new Error(
      "Refusing to run database tooling: VERCEL_ENV is 'production'.",
    );
  }
}

/**
 * Resolves the explicit database classification. Missing or unrecognized
 * values throw, so an unclassified database is never treated as safe.
 */
function readDatabaseClassification(env: ToolingEnv): DatabaseEnvironment {
  const result = databaseEnvironmentSchema.safeParse(env.DATABASE_ENV);

  if (!result.success) {
    throw new Error(
      "Refusing to run database tooling: DATABASE_ENV must be set to one of " +
        `${DATABASE_ENVIRONMENTS.join(", ")}. It classifies the database that ` +
        "DATABASE_URL points at and has no default.",
    );
  }

  return result.data;
}

function assertDatabaseUrlPresent(env: ToolingEnv): void {
  if (!env.DATABASE_URL) {
    throw new Error("Refusing to run database tooling: DATABASE_URL is not set.");
  }
}

/**
 * Seed is additive and idempotent, so it does not require the destructive
 * unlock flag. It still refuses against production process signals and against
 * a database explicitly classified as production, and it requires a valid
 * classification so an unclassified database is never seeded.
 */
export function assertSeedAllowed(env: ToolingEnv): void {
  assertProcessIsNotProduction(env);

  const classification = readDatabaseClassification(env);
  if (classification === "production") {
    throw new Error(
      "Refusing to seed: DATABASE_ENV is 'production'. Seeding a production " +
        "database is never permitted by this tooling.",
    );
  }

  assertDatabaseUrlPresent(env);
}

/**
 * Reset deletes every seeded row, so it fails closed on every axis. Process
 * signals are evaluated first, which is what prevents ALLOW_DB_RESET from ever
 * unlocking a production process.
 *
 * Staging is refused for now: only a database explicitly classified as
 * `development` may be reset.
 */
export function assertResetAllowed(env: ToolingEnv): void {
  assertProcessIsNotProduction(env);

  const classification = readDatabaseClassification(env);
  if (classification !== "development") {
    throw new Error(
      `Refusing to reset: DATABASE_ENV is '${classification}'. Only a database ` +
        "explicitly classified as 'development' may be reset.",
    );
  }

  assertDatabaseUrlPresent(env);

  if (env.ALLOW_DB_RESET !== RESET_UNLOCK_VALUE) {
    throw new Error(
      "Refusing to reset: ALLOW_DB_RESET must be exactly 'true'. This is a " +
        "destructive operation and has no default.",
    );
  }
}
