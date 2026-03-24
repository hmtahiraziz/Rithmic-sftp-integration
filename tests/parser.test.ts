import { describe, expect, it } from "vitest";
import { parseRithmicResultFile } from "../src/services/rithmic/parser";

describe("parseRithmicResultFile", () => {
  it("returns success when response contains accepted", () => {
    const parsed = parseRithmicResultFile("Request accepted and processed");
    expect(parsed.isSuccess).toBe(true);
  });

  it("returns failure when response is not recognized as success", () => {
    const parsed = parseRithmicResultFile("Error: invalid account");
    expect(parsed.isSuccess).toBe(false);
  });
});
