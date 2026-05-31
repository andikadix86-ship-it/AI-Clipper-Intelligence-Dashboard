import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureMediaDirs } from "@/lib/media/ffmpeg";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import { prisma } from "@/lib/prisma";
import { mapMediaJob } from "@/lib/media/processor";
import type { Platform } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = String(formData.get("projectId") || "") || undefined;
    const platform = (String(formData.get("platform") || "YOUTUBE") as Platform) || "YOUTUBE";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Video file is required." }, { status: 400 });
    }

    await ensureMediaDirs();
    const safeName = file.name.replace(/[^\w.-]+/g, "-");
    const storedName = `${Date.now()}-${safeName}`;
    const sourceFileUrl = `/uploads/videos/${storedName}`;
    const filePath = path.join(process.cwd(), "public", "uploads", "videos", storedName);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    const source = await prisma.videoSource.create({
      data: {
        projectId,
        platform,
        sourceType: "UPLOAD",
        sourceFileUrl,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "video/mp4",
        url: sourceFileUrl,
        title: file.name,
        thumbnail: demoPlaceholder("Uploaded Video", 1280, 720)
      }
    });

    const job = await prisma.mediaProcessingJob.create({
      data: {
        projectId,
        videoSourceId: source.id,
        jobType: "UPLOAD",
        status: "QUEUED",
        progress: 0,
        inputUrl: sourceFileUrl
      }
    });

    return NextResponse.json({
      videoSource: source,
      job: mapMediaJob(job),
      warning: "Stored in local fallback storage. Supabase buckets needed for production: videos, thumbnails, outputs, subtitles."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Video upload could not be queued." },
      { status: 500 }
    );
  }
}
