import SftpClient from "ssh2-sftp-client";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";

function errorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

export async function withSftpClient<T>(
  fn: (client: any) => Promise<T>
): Promise<T> {
  const client = new SftpClient();
  let connected = false;

  try {
    await client.connect({
      host: env.RITHMIC_SFTP_HOST,
      port: env.RITHMIC_SFTP_PORT,
      username: env.RITHMIC_SFTP_USER,
      password: env.RITHMIC_SFTP_PASSWORD
    });
    connected = true;
    logger.debug({ host: env.RITHMIC_SFTP_HOST, port: env.RITHMIC_SFTP_PORT }, "SFTP connected");

    return await fn(client);
  } catch (error) {
    const details = errorDetails(error);
    console.log(
      
        details.message,
         details.stack,
        env.RITHMIC_SFTP_HOST,
        env.RITHMIC_SFTP_PORT
    )
    throw error;
  } finally {
    try {
      await client.end();
    } catch (endError) {
      logger.warn(
        { err: errorDetails(endError).message },
        "SFTP client close failed (ignored)"
      );
    }
  }
}
