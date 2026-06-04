import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";
import { serverLogger } from "@/lib/server-logger";
import { getDatabaseConfiguration } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configured(value?: string | null) {
  return value ? "configured" : "not_configured";
}

export async function GET() {
  let databaseStatus: "ok" | "error" = "ok";
  let databaseMessage = "Database reachable.";
  const databaseConfig = getDatabaseConfiguration();

  try {
    if (!databaseConfig.configured) throw new Error(databaseConfig.message);
    await withTimeout(prisma.$queryRaw`SELECT 1`);
  } catch (error) {
    serverLogger.warn("health.database_unavailable", { configured: databaseConfig.configured }, error);
    databaseStatus = "error";
    databaseMessage = databaseConfig.configured ? "Database connection is unavailable. Check Supabase pooler, SSL, and environment configuration." : databaseConfig.message;
  }

  const providers = {
    openai: configured(process.env.OPENAI_API_KEY),
    gemini: configured(process.env.GEMINI_API_KEY),
    googleOAuth: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "configured" : "not_configured",
    tiktokOAuth: process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET ? "configured" : "not_configured",
    metaOAuth: process.env.META_APP_ID && process.env.META_APP_SECRET ? "configured" : "not_configured",
    telegram: process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID ? "configured" : "settings_or_not_configured"
  };

  return NextResponse.json({
    success: databaseStatus === "ok",
    message: databaseStatus === "ok" ? "AI Clipper health check passed." : "AI Clipper is running with database connectivity issues.",
    data: {
      app: {
        status: "ok",
        environment: process.env.NODE_ENV ?? "development"
      },
      database: {
        status: databaseStatus,
        message: databaseMessage
      },
      providers,
      timestamp: new Date().toISOString()
    }
  }, { status: databaseStatus === "ok" ? 200 : 503 });
}
