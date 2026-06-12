import { maskSecret } from "@/lib/security";

export function getRedditOAuthStatus() {
  const clientId = process.env.REDDIT_CLIENT_ID ?? "";
  const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? "";
  const userAgent = process.env.REDDIT_USER_AGENT ?? "";
  const ready = Boolean(clientId && clientSecret && userAgent);
  return {
    status: ready ? "READY" as const : "NOT_CONFIGURED" as const,
    message: ready
      ? "Reddit OAuth tersedia sebagai optional insight source."
      : "Reddit API optional dan belum dikonfigurasi. Sistem memakai fallback/demo mode tanpa Reddit sebagai dependency utama.",
    clientIdMasked: clientId ? maskSecret(clientId) : "",
    clientSecretConfigured: Boolean(clientSecret),
    userAgentConfigured: Boolean(userAgent)
  };
}
