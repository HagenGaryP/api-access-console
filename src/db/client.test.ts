// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabaseEnv: vi.fn(),
  drizzle: vi.fn(),
  poolConstructor: vi.fn(),
  poolEnds: [] as ReturnType<typeof vi.fn>[],
  poolConnects: [] as ReturnType<typeof vi.fn>[],
  poolQueries: [] as ReturnType<typeof vi.fn>[],
}));

vi.mock("server-only", () => ({}));

vi.mock("./env", () => ({
  getDatabaseEnv: mocks.getDatabaseEnv,
}));

vi.mock("drizzle-orm/neon-serverless", () => ({
  drizzle: mocks.drizzle,
}));

vi.mock("@neondatabase/serverless", () => ({
  Pool: class MockPool {
    readonly end = vi.fn();
    readonly connect = vi.fn();
    readonly query = vi.fn();

    constructor(config: unknown) {
      mocks.poolConstructor(config);
      mocks.poolEnds.push(this.end);
      mocks.poolConnects.push(this.connect);
      mocks.poolQueries.push(this.query);
    }
  },
}));

async function loadClientModule() {
  return import("./client");
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.poolEnds.length = 0;
  mocks.poolConnects.length = 0;
  mocks.poolQueries.length = 0;
  mocks.getDatabaseEnv.mockReturnValue({
    DATABASE_URL: "postgresql://user:password@example.test/database",
  });
});

describe("withDatabase", () => {
  it("does not read the environment or create connection resources at import time", async () => {
    await loadClientModule();

    expect(mocks.getDatabaseEnv).not.toHaveBeenCalled();
    expect(mocks.poolConstructor).not.toHaveBeenCalled();
    expect(mocks.drizzle).not.toHaveBeenCalled();
  });

  it("reads the environment when invoked and passes the configured database to the callback", async () => {
    const configuredDatabase = { kind: "configured-database" };
    mocks.drizzle.mockReturnValue(configuredDatabase);
    const operation = vi.fn().mockResolvedValue("operation-result");
    const { withDatabase } = await loadClientModule();

    const result = await withDatabase(operation);

    expect(mocks.getDatabaseEnv).toHaveBeenCalledTimes(1);
    expect(mocks.poolConstructor).toHaveBeenCalledWith({
      connectionString: "postgresql://user:password@example.test/database",
    });
    expect(mocks.drizzle).toHaveBeenCalledWith(expect.anything(), {
      schema: expect.any(Object),
    });
    expect(operation).toHaveBeenCalledWith(configuredDatabase);
    expect(result).toBe("operation-result");
    expect(mocks.poolEnds[0]).toHaveBeenCalledTimes(1);
  });

  it("creates and closes a distinct Pool for every invocation without making network calls", async () => {
    mocks.drizzle.mockReturnValue({ kind: "database" });
    const { withDatabase } = await loadClientModule();

    await withDatabase(async () => "first");
    await withDatabase(async () => "second");

    expect(mocks.poolConstructor).toHaveBeenCalledTimes(2);
    expect(mocks.poolEnds).toHaveLength(2);
    expect(mocks.poolEnds[0]).not.toBe(mocks.poolEnds[1]);
    expect(mocks.poolEnds[0]).toHaveBeenCalledTimes(1);
    expect(mocks.poolEnds[1]).toHaveBeenCalledTimes(1);
    expect(mocks.poolConnects.every((connect) => connect.mock.calls.length === 0)).toBe(true);
    expect(mocks.poolQueries.every((query) => query.mock.calls.length === 0)).toBe(true);
  });

  it("closes the Pool and preserves the operation error when the callback fails", async () => {
    const operationError = new Error("operation failed");
    mocks.drizzle.mockReturnValue({ kind: "database" });
    const { withDatabase } = await loadClientModule();

    await expect(
      withDatabase(async () => {
        throw operationError;
      }),
    ).rejects.toBe(operationError);
    expect(mocks.poolEnds[0]).toHaveBeenCalledTimes(1);
  });

  it("closes the Pool and preserves the error when Drizzle initialization fails", async () => {
    const initializationError = new Error("Drizzle initialization failed");
    mocks.drizzle.mockImplementation(() => {
      throw initializationError;
    });
    const operation = vi.fn();
    const { withDatabase } = await loadClientModule();

    await expect(withDatabase(operation)).rejects.toBe(initializationError);
    expect(mocks.poolConstructor).toHaveBeenCalledTimes(1);
    expect(operation).not.toHaveBeenCalled();
    expect(mocks.poolEnds[0]).toHaveBeenCalledTimes(1);
  });

  it("reports the initialization error first when initialization and cleanup both fail", async () => {
    const initializationError = new Error("Drizzle initialization failed");
    const cleanupError = new Error("cleanup failed");
    mocks.drizzle.mockImplementation(() => {
      mocks.poolEnds[0].mockRejectedValueOnce(cleanupError);
      throw initializationError;
    });
    const { withDatabase } = await loadClientModule();

    const aggregate = await withDatabase(async () => undefined).catch((error: unknown) => error);

    expect(aggregate).toBeInstanceOf(AggregateError);
    expect((aggregate as AggregateError).errors).toEqual([initializationError, cleanupError]);
    expect(mocks.poolEnds[0]).toHaveBeenCalledTimes(1);
  });

  it("reports the operation error first when operation and cleanup both fail", async () => {
    const operationError = new Error("operation failed");
    const cleanupError = new Error("cleanup failed");
    mocks.drizzle.mockReturnValue({ kind: "database" });
    const { withDatabase } = await loadClientModule();

    const result = withDatabase(async () => {
      mocks.poolEnds[0].mockRejectedValueOnce(cleanupError);
      throw operationError;
    });

    const aggregate = await result.catch((error: unknown) => error);

    expect(aggregate).toBeInstanceOf(AggregateError);
    expect((aggregate as AggregateError).errors).toEqual([operationError, cleanupError]);
    expect(mocks.poolEnds[0]).toHaveBeenCalledTimes(1);
  });
});
