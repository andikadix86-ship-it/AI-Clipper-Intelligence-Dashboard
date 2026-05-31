import { maskSecret } from "@/lib/security";

export function getRedditOAuthStatus() {
  const clientId = process.env.REDDIT_CLIENT_ID ?? "";
  const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? "";
  const userAgent = process.env.REDDIT_USER_AGENT ?? "";
  const ready = Boolean(clientId && clientSecret && userAgent);
  return {
    status: ready ? "READY" as const : "SETUP_REQUIRED" as const,
    message: ready
      ? "Reddit OAuth server-side configuration tersedia. Search API belum diaktifkan pada tahap foundation."
      : "Reddit OAuth belum lengkap. Isi REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, dan REDDIT_USER_AGENT di env server.",
    clientIdMasked: clientId ? maskSecret(clientId) : "",
    clientSecretConfigured: Boolean(clientSecret),
    userAgentConfigured: Boolean(userAgent)
  };
}

