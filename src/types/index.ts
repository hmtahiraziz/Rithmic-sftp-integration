export type OperationType =
  | "add_user"
  | "add_account"
  | "set_rms_account"
  | "set_rms_product";

export interface UploadRequest {
  operationType: OperationType;
  values: string[];
  filePrefix?: string;
}

export type JobStatus =
  | "created"
  | "building_file"
  | "uploading"
  | "uploaded"
  | "processing_result"
  | "processed"
  | "failed";

export interface UploadJob {
  id: string;
  operationType: OperationType;
  values: string[];
  filePrefix?: string;
  localFilePath?: string;
  remotePath?: string;
  status: JobStatus;
  error?: string;
  resultFilePath?: string;
  resultRaw?: string;
  createdAt: string;
  updatedAt: string;
}
