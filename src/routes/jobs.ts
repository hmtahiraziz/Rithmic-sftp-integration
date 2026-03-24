import { Router } from "express";
import { z } from "zod";
import { getJob } from "../storage/jobStore";
import { UploadRequest } from "../types";
import {
  createAndUploadJob,
  pollJobResult,
  retryUpload
} from "../services/rithmic/uploadService";

const uploadSchema = z.object({
  operationType: z.enum([
    "add_user",
    "add_account",
    "set_rms_account",
    "set_rms_product"
  ]),
  values: z.array(z.string()).min(1),
  filePrefix: z.string().optional()
});

export const jobsRouter = Router();

jobsRouter.post("/upload", async (req, res) => {
  const parsed = uploadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      issues: parsed.error.issues
    });
  }

  const result = await createAndUploadJob(parsed.data as UploadRequest);
  return res.status(201).json(result);
});

jobsRouter.get("/:jobId", (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }
  return res.json(job);
});

jobsRouter.post("/:jobId/poll-result", async (req, res) => {
  try {
    const job = await pollJobResult(req.params.jobId);
    return res.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to poll result";
    const statusCode = message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({ message });
  }
});

jobsRouter.post("/:jobId/retry", async (req, res) => {
  try {
    const retriedJob = await retryUpload(req.params.jobId);
    return res.status(201).json(retriedJob);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry upload";
    const statusCode = message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json({ message });
  }
});
