import { NextResponse } from "next/server";
import { mapMediaJob } from "@/lib/media/processor";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const jobs = await prisma.mediaProcessingJob.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ jobs: jobs.map(mapMediaJob) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media jobs could not be loaded." },
      { status: 500 }
    );
  }
}
