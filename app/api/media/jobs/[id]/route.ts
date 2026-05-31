import { NextResponse } from "next/server";
import { mapMediaJob, processClipJob } from "@/lib/media/processor";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.mediaProcessingJob.findUnique({ where: { id: params.id } });
    if (!job) return NextResponse.json({ error: "Media job not found." }, { status: 404 });
    return NextResponse.json({ job: mapMediaJob(job) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media job could not be loaded." },
      { status: 500 }
    );
  }
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({ job: await processClipJob(params.id) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media job could not be processed." },
      { status: 500 }
    );
  }
}
