// @vitest-environment node
import { describe, expect, it } from "vitest";

import { assertResetAllowed, assertSeedAllowed, type ToolingEnv } from "./guard";

const DATABASE_URL = "postgresql://user:secret@localhost:5432/api_access_console";

function resetEnv(overrides: ToolingEnv = {}): ToolingEnv {
  return {
    DATABASE_ENV: "development",
    DATABASE_URL,
    ALLOW_DB_RESET: "true",
    ...overrides,
  };
}

function seedEnv(overrides: ToolingEnv = {}): ToolingEnv {
  return { DATABASE_ENV: "development", DATABASE_URL, ...overrides };
}

describe("assertResetAllowed", () => {
  it("allows a fully unlocked development database", () => {
    expect(() => assertResetAllowed(resetEnv())).not.toThrow();
  });

  it("refuses when the process is a production build, even when fully unlocked", () => {
    expect(() => assertResetAllowed(resetEnv({ NODE_ENV: "production" }))).toThrow(
      /NODE_ENV is 'production'/,
    );
    expect(() => assertResetAllowed(resetEnv({ VERCEL_ENV: "production" }))).toThrow(
      /VERCEL_ENV is 'production'/,
    );
  });

  it("refuses when the database classification is missing", () => {
    expect(() => assertResetAllowed(resetEnv({ DATABASE_ENV: undefined }))).toThrow(
      /DATABASE_ENV must be set/,
    );
  });

  it.each(["", "dev", "Development", "DEVELOPMENT", "prod", "local"])(
    "refuses the unrecognized classification %o",
    (value) => {
      expect(() => assertResetAllowed(resetEnv({ DATABASE_ENV: value }))).toThrow(
        /DATABASE_ENV must be set/,
      );
    },
  );

  it("refuses staging and production databases", () => {
    expect(() => assertResetAllowed(resetEnv({ DATABASE_ENV: "staging" }))).toThrow(
      /Only a database explicitly classified as 'development'/,
    );
    expect(() => assertResetAllowed(resetEnv({ DATABASE_ENV: "production" }))).toThrow(
      /Only a database explicitly classified as 'development'/,
    );
  });

  it("refuses when DATABASE_URL is absent", () => {
    expect(() => assertResetAllowed(resetEnv({ DATABASE_URL: undefined }))).toThrow(
      /DATABASE_URL is not set/,
    );
  });

  it.each([undefined, "", "TRUE", "True", "1", "yes", "on", " true", "true "])(
    "refuses the unlock value %o because only the exact string 'true' unlocks",
    (value) => {
      expect(() => assertResetAllowed(resetEnv({ ALLOW_DB_RESET: value }))).toThrow(
        /ALLOW_DB_RESET must be exactly 'true'/,
      );
    },
  );
});

describe("assertSeedAllowed", () => {
  it("allows development and staging databases without the reset unlock flag", () => {
    expect(() => assertSeedAllowed(seedEnv())).not.toThrow();
    expect(() => assertSeedAllowed(seedEnv({ DATABASE_ENV: "staging" }))).not.toThrow();
  });

  it("refuses a database classified as production", () => {
    expect(() => assertSeedAllowed(seedEnv({ DATABASE_ENV: "production" }))).toThrow(
      /Seeding a production database is never permitted/,
    );
  });

  it("refuses production process signals", () => {
    expect(() => assertSeedAllowed(seedEnv({ NODE_ENV: "production" }))).toThrow(
      /NODE_ENV is 'production'/,
    );
    expect(() => assertSeedAllowed(seedEnv({ VERCEL_ENV: "production" }))).toThrow(
      /VERCEL_ENV is 'production'/,
    );
  });

  it("refuses a missing or unrecognized classification", () => {
    expect(() => assertSeedAllowed(seedEnv({ DATABASE_ENV: undefined }))).toThrow(
      /DATABASE_ENV must be set/,
    );
    expect(() => assertSeedAllowed(seedEnv({ DATABASE_ENV: "qa" }))).toThrow(
      /DATABASE_ENV must be set/,
    );
  });

  it("refuses when DATABASE_URL is absent", () => {
    expect(() => assertSeedAllowed(seedEnv({ DATABASE_URL: undefined }))).toThrow(
      /DATABASE_URL is not set/,
    );
  });

  it("does not require the destructive unlock flag to be absent", () => {
    expect(() => assertSeedAllowed(seedEnv({ ALLOW_DB_RESET: "true" }))).not.toThrow();
  });
});
