import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  RITHMIC_SFTP_HOST: z.string().min(1),
  RITHMIC_SFTP_PORT: z.coerce.number().default(22),
  RITHMIC_SFTP_USER: z.string().min(1),
  RITHMIC_SFTP_PASSWORD: z.string().min(1),
  // Use paths relative to the SFTP account home (no leading "/"). Absolute paths
  // like "/in_flight" often fail on chrooted SFTP with "No such file".
  RITHMIC_REMOTE_IN_FLIGHT: z.string().min(1).default("in_flight"),
  RITHMIC_REMOTE_COPERATIONS: z.string().min(1).default("Coperations"),
  RITHMIC_REMOTE_RESULTS: z.string().min(1).default("out")
});

export const env = envSchema.parse(process.env);
