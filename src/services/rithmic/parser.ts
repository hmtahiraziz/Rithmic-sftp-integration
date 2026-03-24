export interface ParsedResult {
  isSuccess: boolean;
  raw: string;
}

export function parseRithmicResultFile(rawContents: string): ParsedResult {
  const normalized = rawContents.trim().toLowerCase();
  const isSuccess =
    normalized.includes("success") ||
    normalized.includes("processed") ||
    normalized.includes("accepted");

  return {
    isSuccess,
    raw: rawContents
  };
}
