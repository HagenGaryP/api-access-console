// @vitest-environment node
import { getTableName, is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import * as schema from "../schema";
import { DELETION_ORDER } from "./order";

/**
 * These assertions read the real foreign keys off the Drizzle schema rather
 * than restating them, so adding a table or a reference without updating
 * `DELETION_ORDER` fails here instead of failing mid-reset against a database.
 */
const schemaTables: PgTable[] = (Object.values(schema) as unknown[]).filter(
  (value): value is PgTable => is(value, PgTable),
);

function referencedTableNames(table: PgTable): string[] {
  const self = getTableName(table);
  return getTableConfig(table)
    .foreignKeys.map((foreignKey) => getTableName(foreignKey.reference().foreignTable))
    .filter((name) => name !== self);
}

describe("reset deletion order", () => {
  const positionByName = new Map<string, number>(
    DELETION_ORDER.map((entry, index) => [entry.name, index]),
  );

  it("names each entry after the table it deletes", () => {
    for (const entry of DELETION_ORDER) {
      expect(getTableName(entry.table)).toBe(entry.name);
    }
  });

  it("covers every table in the schema exactly once", () => {
    const ordered = DELETION_ORDER.map((entry) => entry.name).sort();
    const declared = schemaTables.map((table) => getTableName(table)).sort();

    expect(ordered).toEqual(declared);
    expect(new Set(ordered).size).toBe(ordered.length);
  });

  it("deletes every dependent table before the table it references", () => {
    for (const entry of DELETION_ORDER) {
      const dependentPosition = positionByName.get(entry.name);
      expect(dependentPosition).toBeDefined();

      for (const referenced of referencedTableNames(entry.table)) {
        const referencedPosition = positionByName.get(referenced);

        expect(
          referencedPosition,
          `${entry.name} references ${referenced}, which is missing from DELETION_ORDER`,
        ).toBeDefined();
        expect(
          referencedPosition as number,
          `${entry.name} must be deleted before ${referenced} because the foreign key is ON DELETE RESTRICT`,
        ).toBeGreaterThan(dependentPosition as number);
      }
    }
  });

  it("detects at least the known restrictive references", () => {
    // Guards against the schema introspection silently returning nothing,
    // which would make the ordering assertion vacuously pass.
    const edgeCount = DELETION_ORDER.reduce(
      (total, entry) => total + referencedTableNames(entry.table).length,
      0,
    );

    expect(edgeCount).toBeGreaterThanOrEqual(8);
  });
});
