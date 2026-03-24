import { logger } from "../../utils/logger";

/** Chrooted SFTP roots at login dir; strip leading "/" so "/in_flight" → "in_flight". */
export function normalizeRemoteDir(dir: string): string {
  return dir.replace(/^\/+/, "").replace(/\/+$/, "");
}

export async function listSftpHome(client: { list: (p: string) => Promise<{ name: string }[]> }): Promise<string[]> {
  const list = await client.list(".");
  return list
    .map((e) => e.name)
    .filter((n) => n !== "." && n !== "..")
    .sort();
}

/**
 * Ensure a path relative to SFTP login dir exists. If missing, try mkdir (if allowed),
 * else case-insensitive match against home. Throws with home listing for easier .env fixes.
 */
export async function resolveRemoteDirectory(
  client: {
    exists: (p: string) => Promise<false | "d" | "-" | "l">;
    mkdir: (p: string, recursive: boolean) => Promise<string | void>;
    list: (p: string) => Promise<{ name: string }[]>;
  },
  configured: string
): Promise<string> {
  const normalized = normalizeRemoteDir(configured);
  let type = await client.exists(normalized);

  if (type === "d") {
    return normalized;
  }

  try {
    await client.mkdir(normalized, true);
    type = await client.exists(normalized);
    if (type === "d") {
      logger.info({ dir: normalized }, "Created remote SFTP directory");
      return normalized;
    }
  } catch {
    /* Many hosts forbid mkdir; continue to diagnostics */
  }

  const home = await listSftpHome(client);
  const lower = normalized.toLowerCase();
  const caseMatch = home.find((n) => n.toLowerCase() === lower);
  if (caseMatch) {
    logger.info(
      { configured: normalized, resolved: caseMatch },
      "Resolved remote folder by case-insensitive name match"
    );
    return caseMatch;
  }

  throw new Error(
    `Remote folder "${normalized}" does not exist (SFTP exists=${String(type)}). ` +
      `Entries in your SFTP home: ${home.length > 0 ? home.join(", ") : "(empty or list failed)"}. ` +
      `Set RITHMIC_REMOTE_IN_FLIGHT / RITHMIC_REMOTE_COPERATIONS to match one of these names.`
  );
}
