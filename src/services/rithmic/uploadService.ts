import path from "node:path";
import { env } from "../../config/env";
import { getJob, createJob, updateJob } from "../../storage/jobStore";
import { UploadRequest } from "../../types";
import { logger } from "../../utils/logger";
import { buildOperationFile } from "./fileBuilder";
import { parseRithmicResultFile } from "./parser";
import { normalizeRemoteDir, resolveRemoteDirectory } from "./sftpRemotePaths";
import { withSftpClient } from "./sftpClient";

function resolveRemoteTarget(operationType: UploadRequest["operationType"]): string {
  // Conformance mapping (per client requirement):
  // - User/account creation uses coperations
  // - set_rms_account uses in_flight
  // - set_rms_product uses coperations
  if (
    operationType === "add_user" ||
    operationType === "add_account" ||
    operationType === "set_rms_product"
  ) {
    return normalizeRemoteDir(env.RITHMIC_REMOTE_COPERATIONS);
  }
  return normalizeRemoteDir(env.RITHMIC_REMOTE_IN_FLIGHT);
}

export async function createAndUploadJob(input: UploadRequest) {
  const job = createJob(input);

  try {
    updateJob(job.id, { status: "building_file" });

    const builtFile = await buildOperationFile({
      operationType: input.operationType,
      values: input.values,
      filePrefix: input.filePrefix
    });

    const configuredDir = resolveRemoteTarget(input.operationType);

    updateJob(job.id, {
      status: "uploading",
      localFilePath: builtFile.localFilePath
    });

    await withSftpClient(async (client) => {
      const remoteDir = await resolveRemoteDirectory(client, configuredDir);
      const remotePath = path.posix.join(remoteDir, builtFile.fileName);
      updateJob(job.id, { remotePath });
      await client.put(builtFile.localFilePath, remotePath);
    });

    const uploadedJob = updateJob(job.id, { status: "uploaded" });
    logger.info({ jobId: uploadedJob.id, remotePath: uploadedJob.remotePath }, "Rithmic file uploaded");
    return uploadedJob;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    const failedJob = updateJob(job.id, {
      status: "failed",
      error: message
    });
    logger.error({ jobId: failedJob.id, err: message }, "Rithmic file upload failed");
    return failedJob;
  }
}

export async function retryUpload(jobId: string) {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  return createAndUploadJob({
    operationType: job.operationType,
    values: job.values,
    filePrefix: job.filePrefix
  });
}

export async function pollJobResult(jobId: string) {
  const job = getJob(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  if (!job.remotePath) {
    throw new Error("Job has no remote upload path");
  }

  if (job.status !== "uploaded" && job.status !== "processing_result") {
    return job;
  }

  const remoteBaseName = path.posix.basename(job.remotePath, path.posix.extname(job.remotePath));
  updateJob(job.id, { status: "processing_result" });

  return withSftpClient(async (client) => {
    const resultsDir = await resolveRemoteDirectory(client, env.RITHMIC_REMOTE_RESULTS);
    const list = await client.list(resultsDir);
    const match = list.find((entry: { name: string }) =>
      entry.name.includes(remoteBaseName)
    );

    if (!match) {
      return updateJob(job.id, { status: "uploaded" });
    }

    const remoteResultPath = path.posix.join(resultsDir, match.name);
    const content = await client.get(remoteResultPath);
    const resultRaw = Buffer.isBuffer(content) ? content.toString("utf8") : String(content);
    const parsed = parseRithmicResultFile(resultRaw);

    if (parsed.isSuccess) {
      return updateJob(job.id, {
        status: "processed",
        resultFilePath: remoteResultPath,
        resultRaw,
        error: undefined
      });
    }

    return updateJob(job.id, {
      status: "failed",
      resultFilePath: remoteResultPath,
      resultRaw,
      error: "Rithmic result indicates failure"
    });
  });
}
