import { describe, it, expect } from "vitest";
import { validateDecisionInput } from "./schema";

describe("validateDecisionInput", () => {
  it("accepts a valid id and action", () => {
    expect(validateDecisionInput("req_001", "approve")).toEqual({ valid: true });
    expect(validateDecisionInput("req_001", "reject")).toEqual({ valid: true });
  });

  it("rejects an empty or non-string id", () => {
    expect(validateDecisionInput("", "approve").valid).toBe(false);
    expect(validateDecisionInput("   ", "approve").valid).toBe(false);
    expect(validateDecisionInput(123, "approve").valid).toBe(false);
    expect(validateDecisionInput(undefined, "approve").valid).toBe(false);
  });

  it("rejects an action that is not approve/reject", () => {
    const result = validateDecisionInput("req_001", "delete");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.join(" ")).toMatch(/"approve" or "reject"/);
    }
  });

  it("rejects a missing action", () => {
    expect(validateDecisionInput("req_001", undefined).valid).toBe(false);
  });

  it("reports errors for both invalid fields at once", () => {
    const result = validateDecisionInput("", "delete");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toHaveLength(2);
    }
  });
});
