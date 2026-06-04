import { NextResponse } from "next/server";
import { mapMediaJob } from "@/lib/media/processor";
import { prisma } from "@/lib/prisma";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET() {
  try {
    const jobs = await prisma.mediaProcessingJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ jobs: jobs.map(mapMediaJob) });
  } catch (error) {
    serverLogger.warn("media.jobs.database_fallback", undefined, error);
    return NextResponse.json({ jobs: [], source: "fallback", message: "Database unavailable, using empty media job list." });
  }
}
