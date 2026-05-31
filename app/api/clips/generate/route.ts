import { NextResponse } from "next/server";
import { withTimeout } from "@/lib/db-timeout";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import { analyzeVideoSource, fallbackClips, generateClipSuggestions, mapClipToDto, processClipJob } from "@/lib/media/processor";
import { prisma } from "@/lib/prisma";
import type { ClipSettingPayload, Platform, SocialPlatform } from "@/lib/types";

export const runtime = "nodejs";

type GenerateRequest = {
  projectId?: string;
  videoSourceId?: string;
  sourceTitle: string;
  sourceUrl: string;
  platform: Platform;
  setting: ClipSettingPayload;
};

const platformToSocialPlatform: Record<Platform, SocialPlatform> = {
  YOUTUBE: "YOUTUBE_SHORTS",
  TIKTOK: "TIKTOK",
  INSTAGRAM: "INSTAGRAM_REELS"
};

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const clipCount = Math.max(1, Math.min(10, Number(body.setting.clipCount) || 3));
  const requestedDuration = body.setting.duration === "AUTO" ? 0 : Number(body.setting.duration) || 45;
  const fallback = fallbackClips(clipCount, requestedDuration || 30, body.sourceTitle || "Untitled source");

  try {
    let videoSourceId = body.videoSourceId;
    let projectId: string | null | undefined;

    if (!videoSourceId || videoSourceId.startsWith("preview_")) {
      const source = await withTimeout(
        prisma.videoSource.create({
          data: {
            projectId: body.projectId || undefined,
            platform: body.platform,
            url: body.sourceUrl,
            title: body.sourceTitle || "Dummy source video",
            thumbnail: fallback[0]?.thumbnail ?? demoPlaceholder("Video Source", 1280, 720)
          }
        })
      );
      videoSourceId = source.id;
      projectId = source.projectId;
    } else {
      const source = await withTimeout(prisma.videoSource.findUnique({ where: { id: videoSourceId }, select: { projectId: true } }));
      projectId = source?.projectId;
    }
    projectId = body.projectId || projectId;

    const setting = await withTimeout(
      prisma.clipSetting.create({
        data: {
          videoSourceId,
          prompt: body.setting.prompt,
          watermark: body.setting.watermark,
          subtitle: body.setting.subtitle,
          category: body.setting.category,
          clipCount,
          duration: requestedDuration,
          resolution: body.setting.resolution,
          layout: body.setting.layout,
          subtitleStyle: body.setting.subtitleStyle,
          textPlacement: body.setting.textPlacement,
          ccLanguage: body.setting.ccLanguage
        }
      })
    );

    const analysis = await analyzeVideoSource(videoSourceId);
    const suggestions = generateClipSuggestions({
      sourceTitle: body.sourceTitle || "Untitled source",
      category: body.setting.category,
      clipCount,
      requestedDuration,
      metadata: analysis.metadata
    });

    const savedClips = await withTimeout(
      Promise.all(
        suggestions.map((suggestion, index) =>
          prisma.generatedClip.create({
            data: {
              videoSourceId,
              clipSettingId: setting.id,
              title: suggestion.title,
              description: suggestion.description,
              thumbnail: fallback[index]?.thumbnail ?? demoPlaceholder(`Clip ${index + 1}`, 720, 1280),
              duration: suggestion.duration,
              viralScore: suggestion.viralScore,
              startTime: suggestion.startTime,
              endTime: suggestion.endTime,
              processingStatus: "QUEUED",
              tags: ["ai-clipper", "ffmpeg-ready", body.setting.category.toLowerCase(), "shorts"]
            }
          })
        )
      )
    );

    await withTimeout(
      prisma.contentItem.createMany({
        data: savedClips.map((clip) => ({
          projectId,
          generatedClipId: clip.id,
          type: "CLIP",
          title: clip.title,
          description: clip.description,
          caption: `${clip.title} - ready for review.`,
          thumbnail: clip.thumbnail,
          status: "DRAFT",
          workflowStatus: "DRAFT",
          platform: platformToSocialPlatform[body.platform],
          tags: clip.tags
        }))
      }),
      5000
    );

    const jobs = [];
    for (const clip of savedClips) {
      const job = await prisma.mediaProcessingJob.create({
        data: {
          projectId,
          videoSourceId,
          generatedClipId: clip.id,
          jobType: "CLIP_PROCESSING",
          status: "QUEUED",
          progress: 0,
          inputUrl: body.sourceUrl,
          logs: ["Queued: clip processing job created."]
        }
      });
      jobs.push(await processClipJob(job.id, { resolution: body.setting.resolution, subtitleStyle: body.setting.subtitleStyle }));
    }

    const processedClips = await prisma.generatedClip.findMany({
      where: { id: { in: savedClips.map((clip) => clip.id) } },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({
      videoSourceId,
      settingId: setting.id,
      analysis,
      jobs,
      clips: processedClips.map(mapClipToDto),
      warning: analysis.warning
    });
  } catch (error) {
    return NextResponse.json({
      videoSourceId: body.videoSourceId,
      settingId: `setting_${Date.now()}`,
      clips: fallback,
      warning: error instanceof Error ? `Processor fallback used: ${error.message}` : "Processor fallback used."
    });
  }
}
