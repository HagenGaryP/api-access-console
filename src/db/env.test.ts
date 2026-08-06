// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Vitest doesn't build with the `react-server` export condition Next.js uses,
// so `server-only` would otherwise throw unconditionally on import here.
vi.mock("server-only", () => ({}));

const originalDatabaseUrl = process.env.DATABASE_URL;

async function loadEnvModule() {
  vi.resetModules();
  return import("./env");
}

beforeEach(() => {
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe("getDatabaseEnv", () => {
  it("does not throw when the module is imported without DATABASE_URL set", async () => {
    await expect(loadEnvModule()).resolves.toBeDefined();
  });

  it("returns the validated env for a valid PostgreSQL URL", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@host:5432/db";
    const { getDatabaseEnv } = await loadEnvModule();

    expect(getDatabaseEnv()).toEqual({
      DATABASE_URL: "postgresql://user:pass@host:5432/db",
    });
  });

  it("throws when DATABASE_URL is missing", async () => {
    const { getDatabaseEnv } = await loadEnvModule();

    expect(() => getDatabaseEnv()).toThrow();
  });

  it("throws when DATABASE_URL is malformed", async () => {
    process.env.DATABASE_URL = "not-a-url";
    const { getDatabaseEnv } = await loadEnvModule();

    expect(() => getDatabaseEnv()).toThrow();
  });

  it("throws when DATABASE_URL uses an unsupported protocol", async () => {
    process.env.DATABASE_URL = "mysql://user:pass@host:3306/db";
    const { getDatabaseEnv } = await loadEnvModule();

    expect(() => getDatabaseEnv()).toThrow();
  });

  it("does not leak the connection string or credentials in validation errors", async () => {
    process.env.DATABASE_URL = "mysql://admin:s3cr3t-password@host:3306/db";
    const { getDatabaseEnv } = await loadEnvModule();

    let thrown: unknown;
    try {
      getDatabaseEnv();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).not.toContain("s3cr3t-password");
    expect(message).not.toContain("admin");
    expect(message).not.toContain(process.env.DATABASE_URL as string);
  });
});
