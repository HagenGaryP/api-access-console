import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Explicit imports (no `test.globals`) mean Testing Library's automatic
// cleanup can't detect a global `afterEach`, so it's wired up manually.
afterEach(() => {
  cleanup();
});
