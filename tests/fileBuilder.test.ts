import fs from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { buildOperationFile } from "../src/services/rithmic/fileBuilder";

const filesToCleanup: string[] = [];

afterEach(async () => {
  await Promise.all(
    filesToCleanup.map(async (filePath) => {
      await fs.rm(filePath, { force: true });
    })
  );
  filesToCleanup.length = 0;
});

describe("buildOperationFile", () => {
  it("builds a csv-like operation line and writes file", async () => {
    const result = await buildOperationFile({
      operationType: "set_rms_account",
      values: ["IB", "Account", "1", "1", "500", "2", "0", "0", "0"],
      filePrefix: "ops"
    });

    filesToCleanup.push(result.localFilePath);
    const contents = await fs.readFile(result.localFilePath, "utf8");

    expect(result.line.startsWith("set_rms_account,IB,Account")).toBe(true);
    expect(contents).toContain("set_rms_account,IB,Account,1,1,500,2,0,0,0");
  });
});
