import { NextResponse } from "next/server";
import { unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureMediaDirs } from "@/lib/media/ffmpeg";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import { prisma } from "@/lib/prisma";
import { mapMediaJob } from "@/lib/media/processor";
import type { Platform } from "@/lib/types";
import { withTimeout } from "@/lib/db-timeout";
import { sanitizeErrorMessage } from "@/lib/security";
import { serverLogger } from "@/lib/server-logger";
import { validateVideoUpload } from "@/lib/media/upload-policy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let filePath = "";
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const projectId = String(formData.get("projectId") || "") || undefined;
    const platform = (String(formData.get("platform") || "YOUTUBE") as Platform) || "YOUTUBE";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Video file is required." }, { status: 400 });
    }
    const validation = validateVideoUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await ensureMediaDirs();
    const safeName = file.name.replace(/[^\w.-]+/g, "-");
    const storedName = `${Date.now()}-${safeName}`;
    const sourceFileUrl = `/uploads/videos/${storedName}`;
    filePath = path.join(process.cwd(), "public", "uploads", "videos", storedName);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    const source = await withTimeout(prisma.videoSource.create({
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
    }), 5000);

    const job = await withTimeout(prisma.mediaProcessingJob.create({
      data: {
        projectId,
        videoSourceId: source.id,
        jobType: "UPLOAD",
        status: "QUEUED",
        progress: 0,
        inputUrl: sourceFileUrl
      }
    }), 5000);

    return NextResponse.json({
      success: true,
      videoSource: source,
      job: mapMediaJob(job),
      persistence: "supabase_metadata",
      storage: "local_file",
      warning: "Stored in local fallback storage. Supabase buckets needed for production: videos, thumbnails, outputs, subtitles."
    });
  } catch (error) {
    if (filePath) await unlink(filePath).catch(() => undefined);
    serverLogger.warn("media.upload.persistence_failed", undefined, error);
    return NextResponse.json(
      {
        success: false,
        error: sanitizeErrorMessage(error),
        message: "Video upload could not be queued. Database storage is unavailable; the local file was cleaned up safely.",
        source: "fallback"
      },
      { status: 503 }
    );
  }
}
