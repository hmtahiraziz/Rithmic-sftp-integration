import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { UploadJob, UploadRequest } from "../types";

const jobs = new Map<string, UploadJob>();
const jobFilePath = path.resolve(process.cwd(), "data/jobs/jobs.json");

function ensureStoreLoaded() {
  const jobsDir = path.dirname(jobFilePath);
  fs.mkdirSync(jobsDir, { recursive: true });

  if (!fs.existsSync(jobFilePath)) {
    fs.writeFileSync(jobFilePath, "[]", "utf8");
    return;
  }

  const raw = fs.readFileSync(jobFilePath, "utf8");
  const parsed = JSON.parse(raw) as UploadJob[];
  for (const job of parsed) {
    jobs.set(job.id, job);
  }
}

function persistStore() {
  const serialized = JSON.stringify(Array.from(jobs.values()), null, 2);
  fs.writeFileSync(jobFilePath, serialized, "utf8");
}

ensureStoreLoaded();

export function createJob(input: UploadRequest): UploadJob {
  const now = new Date().toISOString();
  const job: UploadJob = {
    id: crypto.randomUUID(),
    operationType: input.operationType,
    values: input.values,
    filePrefix: input.filePrefix,
    status: "created",
    createdAt: now,
    updatedAt: now
  };
  jobs.set(job.id, job);
  persistStore();
  return job;
}

export function updateJob(jobId: string, update: Partial<UploadJob>): UploadJob {
  const current = jobs.get(jobId);
  if (!current) {
    throw new Error(`Job not found: ${jobId}`);
  }

  const updated: UploadJob = {
    ...current,
    ...update,
    updatedAt: new Date().toISOString()
  };
  jobs.set(jobId, updated);
  persistStore();
  return updated;
}

export function getJob(jobId: string): UploadJob | undefined {
  return jobs.get(jobId);
}
