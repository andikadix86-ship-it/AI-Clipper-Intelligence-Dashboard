const sensitiveKeyPattern = /(api[_-]?key|token|secret|password|credential|authorization|clientSecret|accessToken|refreshToken)/i;

export function maskSecret(value?: string | null) {
  if (!value) return "";
  if (value.length <= 8) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function encodeSecret(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

export function decodeSecret(value?: string | null) {
  if (!value) return "";
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return "";
  }
}

export function sanitizeErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "Unexpected server error.";
  const lowered = raw.toLowerCase();
  if (lowered.includes("tls") || lowered.includes("certificate") || lowered.includes("pg_hba") || lowered.includes("database")) {
    return "Database connection is temporarily unavailable. Check Supabase pooler, SSL, and environment configuration.";
  }
  return raw.replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1***").replace(/(key|token|secret|password)=([^&\s]+)/gi, "$1=***");
}

export function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeMetadata(item));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, entry]) => {
      acc[key] = sensitiveKeyPattern.test(key) ? maskSecret(String(entry ?? "")) : sanitizeMetadata(entry);
      return acc;
    }, {});
  }
  return value;
}
