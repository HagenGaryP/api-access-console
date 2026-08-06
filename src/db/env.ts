import "server-only";
import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

let cachedEnv: DatabaseEnv | undefined;

/**
 * Validates DATABASE_URL on first call only, so importing this module
 * (and any module that imports it) never reads or validates `process.env`.
 */
export function getDatabaseEnv(): DatabaseEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = databaseEnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid database environment configuration: ${issues}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
