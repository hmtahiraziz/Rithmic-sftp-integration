import fs from "node:fs/promises";
import path from "node:path";
import { OperationType } from "../../types";

function sanitizeSegment(value: string): string {
  return value.replace(/[^\w.-]/g, "_");
}

export async function buildOperationFile(params: {
  operationType: OperationType;
  values: string[];
  filePrefix?: string;
}): Promise<{ localFilePath: string; fileName: string; line: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const prefix = sanitizeSegment(params.filePrefix ?? params.operationType);
  const fileName = `${prefix}_${timestamp}.txt`;
  const outboundDir = path.resolve(process.cwd(), "data/outbound");
  await fs.mkdir(outboundDir, { recursive: true });

  const line = [params.operationType, ...params.values].join(",");
  const localFilePath = path.join(outboundDir, fileName);
  await fs.writeFile(localFilePath, `${line}\n`, "utf8");

  return {
    localFilePath,
    fileName,
    line
  };
}
