import { NextResponse } from "next/server";
import { processClipJob, runDummyProcessingJob } from "@/lib/media/processor";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.videoSourceId) return NextResponse.json({ error: "videoSourceId is required." }, { status: 400 });

  try {
    const source = await prisma.videoSource.findUnique({ where: { id: body.videoSourceId } });
    if (!source) return NextResponse.json({ error: "Video source not found." }, { status: 404 });

    const job = await prisma.mediaProcessingJob.create({
      data: {
        projectId: source.projectId,
        videoSourceId: source.id,
        generatedClipId: body.generatedClipId,
        jobType: "CLIP_PROCESSING",
        status: "QUEUED",
        progress: 0,
        inputUrl: source.sourceFileUrl ?? source.url
      }
    });
    const completed = await (body.generatedClipId ? processClipJob(job.id, { resolution: body.resolution, subtitleStyle: body.subtitleStyle }) : runDummyProcessingJob(job.id));
    return NextResponse.json({ job: completed });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Clip processing could not be started." },
      { status: 500 }
    );
  }
}
