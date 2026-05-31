import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTimeout } from "@/lib/db-timeout";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import { buildYouTubeEmbedUrl, buildYouTubeThumbnail, getYouTubeVideoId } from "@/lib/youtube";
import type { Platform } from "@/lib/types";

export const runtime = "nodejs";

type PreviewRequest = {
  platform: Platform;
  url: string;
  projectId?: string;
};

export async function POST(request: Request) {
  let body: PreviewRequest;
  try {
    body = (await request.json()) as PreviewRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.url || !body.platform) {
    return NextResponse.json({ error: "Platform and URL are required." }, { status: 400 });
  }

  const videoId = body.platform === "YOUTUBE" ? getYouTubeVideoId(body.url) : undefined;
  if (body.platform === "YOUTUBE" && !videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL." }, { status: 400 });
  }

  const platformLabel = body.platform.toLowerCase();
  const title = body.platform === "YOUTUBE" ? "Dummy YouTube Long Video Ready for Clipping" : `Dummy ${platformLabel} source ready for clipping`;
  const thumbnail =
    body.platform === "YOUTUBE" && videoId
      ? buildYouTubeThumbnail(videoId)
      : demoPlaceholder(`${platformLabel} Source`, 1280, 720);
  const embedUrl = body.platform === "YOUTUBE" && videoId ? buildYouTubeEmbedUrl(videoId) : undefined;

  try {
    const videoSource = await withTimeout(
      prisma.videoSource.create({
        data: {
          platform: body.platform,
          projectId: body.projectId || undefined,
          url: body.url,
          videoId,
          title,
          thumbnail,
          embedUrl
        }
      })
    );

    return NextResponse.json({
      id: videoSource.id,
      platform: videoSource.platform,
      url: videoSource.url,
      videoId: videoSource.videoId ?? undefined,
      title: videoSource.title,
      thumbnail: videoSource.thumbnail,
      embedUrl: videoSource.embedUrl ?? undefined
    });
  } catch {
    return NextResponse.json({
      id: `preview_${Date.now()}`,
      platform: body.platform,
      url: body.url,
      videoId,
      title,
      thumbnail,
      embedUrl
    });
  }
}
