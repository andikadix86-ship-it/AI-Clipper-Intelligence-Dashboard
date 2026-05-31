import { NextResponse } from "next/server";
import { contentStatusLabels, contentTypeLabels, socialPlatformLabels } from "@/lib/content-library";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const platformLabels = {
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram"
} as const;

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        videoSources: { include: { clips: true }, orderBy: { createdAt: "desc" } },
        creativeAssets: { orderBy: { createdAt: "desc" } },
        contentItems: { include: { socialAccount: true }, orderBy: { updatedAt: "desc" } },
        schedules: { include: { contentItem: true, socialAccount: true }, orderBy: { scheduledAt: "desc" } },
        socialAccounts: { include: { schedules: true }, orderBy: { updatedAt: "desc" } },
        agentRecommendations: { include: { agent: true, contentItem: true }, orderBy: { createdAt: "desc" }, take: 6 }
      }
    });

    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const generatedClips = project.videoSources.flatMap((source) =>
      source.clips.map((clip) => ({
        id: clip.id,
        title: clip.title,
        description: clip.description,
        thumbnail: clip.thumbnail,
        duration: clip.duration,
        viralScore: clip.viralScore,
        sourceTitle: source.title,
        createdAt: clip.createdAt.toISOString()
      }))
    );

    const totalImages = project.creativeAssets.filter((asset) => asset.type === "IMAGE" || asset.type === "MOTION_IMAGE").length;
    const totalAiVideos = project.creativeAssets.filter((asset) => asset.type === "AI_VIDEO").length;

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        niche: project.niche,
        category: project.category,
        targetAccounts: project.targetAccounts,
        contentMode: project.contentMode,
        status: "Active"
      },
      stats: {
        totalVideoSources: project.videoSources.length,
        totalClips: generatedClips.length,
        totalImages,
        totalAiVideos,
        totalScheduled: project.schedules.filter((schedule) => schedule.status === "SCHEDULED").length,
        totalPosted: project.contentItems.filter((item) => item.workflowStatus === "POSTED").length
      },
      videoSources: project.videoSources.map((source) => ({
        id: source.id,
        platform: platformLabels[source.platform],
        url: source.url,
        title: source.title,
        thumbnail: source.thumbnail,
        clips: source.clips.length,
        createdAt: source.createdAt.toISOString()
      })),
      generatedClips,
      creativeAssets: project.creativeAssets.map((asset) => ({
        id: asset.id,
        type: asset.type,
        title: asset.title,
        prompt: asset.prompt,
        thumbnail: asset.thumbnail,
        status: asset.status,
        createdAt: asset.createdAt.toISOString()
      })),
      contentItems: project.contentItems.map((item) => ({
        id: item.id,
        type: contentTypeLabels[item.type],
        title: item.title,
        status: contentStatusLabels[item.workflowStatus],
        thumbnail: item.thumbnail,
        platform: item.platform ? socialPlatformLabels[item.platform] : "Unassigned",
        socialAccount: item.socialAccount?.name ?? "Unassigned",
        sourceType: item.sourceType,
        viralScorePrediction: item.viralScorePrediction,
        updatedAt: item.updatedAt.toISOString()
      })),
      schedules: project.schedules.map((schedule) => ({
        id: schedule.id,
        title: schedule.contentItem?.title ?? "Untitled content",
        socialAccount: schedule.socialAccount.name,
        platform: schedule.socialPlatform ? socialPlatformLabels[schedule.socialPlatform] : "Unassigned",
        status: schedule.status,
        scheduledAt: schedule.scheduledAt?.toISOString() ?? schedule.startDate.toISOString()
      })),
      socialAccounts: project.socialAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        platform: account.socialPlatform ? socialPlatformLabels[account.socialPlatform] : "Unassigned",
        handle: account.handle ?? "",
        status: account.isActive ? account.status : "DISABLED",
        scheduled: account.schedules.length
      })),
      analytics: {
        isDummy: true,
        views: "1.92M",
        engagement: "14.8%",
        topContent: project.contentItems[0]?.title ?? "The 30 Second AI Workflow",
        topAccount: project.socialAccounts[0]?.name ?? "Fatih Shorts",
        bestPostingTime: "19:00-21:00 Asia/Jakarta"
      },
      agentRecommendations: project.agentRecommendations.map((recommendation) => ({
        id: recommendation.id,
        agentName: recommendation.agent.name,
        contentTitle: recommendation.contentItem?.title ?? "Project level",
        title: recommendation.title,
        description: recommendation.description,
        recommendationType: recommendation.recommendationType,
        priority: recommendation.priority,
        score: recommendation.score,
        createdAt: recommendation.createdAt.toISOString()
      })),
      recentActivity: [
        `${project.name} has ${project.contentItems.length} content items in library.`,
        `${project.videoSources.length} video sources connected to this project.`,
        `${project.schedules.length} schedules are linked to this campaign.`
      ]
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project center could not be loaded." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.project.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Project could not be deleted." },
      { status: 500 }
    );
  }
}
