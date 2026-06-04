import { maskSecret } from "@/lib/security";

export type ServerEnv = {
  DATABASE_URL: string;
  DIRECT_URL: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  YOUTUBE_DATA_API_KEY?: string;
  YOUTUBE_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  TIKTOK_CLIENT_KEY?: string;
  TIKTOK_CLIENT_SECRET?: string;
  TIKTOK_REDIRECT_URI?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;
  META_REDIRECT_URI?: string;
  REDDIT_CLIENT_ID?: string;
  REDDIT_CLIENT_SECRET?: string;
  REDDIT_USER_AGENT?: string;
};

function requireEnv(name: "DATABASE_URL" | "DIRECT_URL") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required on the server. Configure it in .env for Supabase/PostgreSQL.`);
  return value;
}

export function getDatabaseUrl() {
  return normalizeDatabaseUrl(process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:6543/postgres?connection_limit=1");
}

export type DatabaseConfiguration = {
  configured: boolean;
  connectionString?: string;
  message: string;
};

export class DatabaseConfigurationError extends Error {
  code = "DATABASE_CONFIG_INVALID" as const;

  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

export function getDatabaseConfiguration(value = process.env.DATABASE_URL): DatabaseConfiguration {
  if (!value?.trim()) {
    return { configured: false, message: "DATABASE_URL is missing. Configure the Supabase pooler URL before enabling database-backed workflows." };
  }
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
      return { configured: false, message: "DATABASE_URL must use a PostgreSQL connection string." };
    }
    if (!url.hostname || isPlaceholderHost(url.hostname)) {
      return { configured: false, message: "DATABASE_URL contains a placeholder Supabase host. Replace it with the real pooler hostname." };
    }
    const sslMode = url.searchParams.get("sslmode");
    if (sslMode === "require" || sslMode === "prefer") {
      // Supabase pooler URLs use libpq-style TLS. Without this flag, pg treats
      // sslmode=require as verify-full and rejects the pooler's certificate chain.
      url.searchParams.set("uselibpqcompat", "true");
    }
    return { configured: true, connectionString: url.toString(), message: "Database connection string is configured." };
  } catch {
    return { configured: false, message: "DATABASE_URL is invalid. Configure a valid Supabase PostgreSQL pooler URL." };
  }
}

export function assertDatabaseConfigured() {
  const config = getDatabaseConfiguration();
  if (!config.configured || !config.connectionString) throw new DatabaseConfigurationError(config.message);
  return config.connectionString;
}

function normalizeDatabaseUrl(value: string) {
  return getDatabaseConfiguration(value).connectionString ?? value;
}

function isPlaceholderHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized.includes("xxx") || normalized.includes("placeholder") || normalized.includes("your-") || normalized === "example.com";
}

export function getServerEnv(): ServerEnv {
  return {
    DATABASE_URL: requireEnv("DATABASE_URL"),
    DIRECT_URL: requireEnv("DIRECT_URL"),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    YOUTUBE_DATA_API_KEY: process.env.YOUTUBE_DATA_API_KEY,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY,
    TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
    TIKTOK_REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI,
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI,
    REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
    REDDIT_USER_AGENT: process.env.REDDIT_USER_AGENT
  };
}

export function getSafeEnvStatus() {
  const database = getDatabaseConfiguration();
  return {
    databaseUrl: database.configured ? "configured" : "invalid_or_missing",
    directUrl: process.env.DIRECT_URL ? "configured" : "missing",
    openaiApiKey: process.env.OPENAI_API_KEY ? maskSecret(process.env.OPENAI_API_KEY) : "",
    geminiApiKey: process.env.GEMINI_API_KEY ? maskSecret(process.env.GEMINI_API_KEY) : "",
    youtubeDataApiKey: process.env.YOUTUBE_DATA_API_KEY ? maskSecret(process.env.YOUTUBE_DATA_API_KEY) : "",
    youtubeApiKey: process.env.YOUTUBE_API_KEY ? maskSecret(process.env.YOUTUBE_API_KEY) : "",
    googleClientId: process.env.GOOGLE_CLIENT_ID ? maskSecret(process.env.GOOGLE_CLIENT_ID) : "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "configured" : "missing",
    tiktokClientKey: process.env.TIKTOK_CLIENT_KEY ? maskSecret(process.env.TIKTOK_CLIENT_KEY) : "",
    metaAppId: process.env.META_APP_ID ? maskSecret(process.env.META_APP_ID) : "",
    redditClientId: process.env.REDDIT_CLIENT_ID ? maskSecret(process.env.REDDIT_CLIENT_ID) : "",
    redditClientSecret: process.env.REDDIT_CLIENT_SECRET ? "configured" : "missing",
    redditUserAgent: process.env.REDDIT_USER_AGENT ? "configured" : "missing"
  };
}
