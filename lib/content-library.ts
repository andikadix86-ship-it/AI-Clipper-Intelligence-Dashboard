import type { ContentStatus, ContentType, LibraryAssetStatus, LibraryItemDto, SocialPlatform } from "@/lib/types";
import { demoPlaceholder } from "@/lib/demo-placeholder";

export const contentTypeLabels: Record<ContentType, string> = {
  CLIP: "Clip",
  IMAGE: "Image",
  MOTION_IMAGE: "Motion Image",
  AI_VIDEO: "AI Video",
  SCHEDULED_POST: "Scheduled Post",
  IDEA: "Idea",
  SCRIPT: "Script",
  CLIP_PLAN: "Clip Plan"
};

export const contentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
  REJECTED: "Rejected",
  FAILED: "Failed",
  READY: "Ready"
};

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  TIKTOK: "TikTok",
  YOUTUBE_SHORTS: "YouTube Shorts",
  INSTAGRAM_REELS: "Instagram Reels",
  FACEBOOK_REELS: "Facebook Reels"
};

export const assetStatusLabels: Record<LibraryAssetStatus, string> = {
  ACTIVE: "Active",
  ARCHIVED: "Archived",
  TRASHED: "Trashed"
};

export const assetStatusBadgeClasses: Record<LibraryAssetStatus, string> = {
  ACTIVE: "bg-emerald-400/15 text-emerald-100 border-emerald-300/25",
  ARCHIVED: "bg-amber-400/15 text-amber-100 border-amber-300/25",
  TRASHED: "bg-rose-400/15 text-rose-100 border-rose-300/25"
};

export const workflowStatuses: ContentStatus[] = ["DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "POSTED", "REJECTED", "FAILED"];

export const statusBadgeClasses: Record<ContentStatus, string> = {
  DRAFT: "bg-slate-500/20 text-slate-200 border-slate-300/20",
  REVIEW: "bg-amber-400/15 text-amber-100 border-amber-300/25",
  APPROVED: "bg-teal-300 text-slate-950 border-teal-200",
  SCHEDULED: "bg-sky-400/15 text-sky-100 border-sky-300/25",
  POSTED: "bg-emerald-400/15 text-emerald-100 border-emerald-300/25",
  REJECTED: "bg-rose-400/15 text-rose-100 border-rose-300/25",
  FAILED: "bg-red-500/15 text-red-100 border-red-300/25",
  READY: "bg-indigo-400/15 text-indigo-100 border-indigo-300/25"
};

export const fallbackLibraryItems: LibraryItemDto[] = [
  {
    id: "clip_ai_workflow",
    type: "CLIP",
    typeLabel: "Clip",
    title: "The 30 Second AI Workflow That Saves 2 Hours",
    description: "Short clip optimized for fast FYP discovery.",
    caption: "Save this AI workflow before your next batch recording session.",
    sourceType: "DEMO_SAMPLE",
    thumbnail: demoPlaceholder("Library Clip"),
    status: "APPROVED",
    statusLabel: "Approved",
    workflowStatus: "APPROVED",
    workflowStatusLabel: "Approved",
    reviewNotes: "Hook and caption pacing approved.",
    rejectReason: "",
    approvedAt: "2026-05-30T03:00:00.000Z",
    approvedBy: "Admin",
    platform: "YOUTUBE_SHORTS",
    platformLabel: "YouTube Shorts",
    project: "Creator Growth Engine",
    socialAccount: "Fatih Shorts",
    tags: ["ai", "creator", "workflow"],
    date: "2026-05-30",
    meta: "45s - Viral 91",
    assetStatus: "ACTIVE",
    assetStatusLabel: "Active",
    versionNumber: 1,
    isLatestVersion: true,
    versionNotes: "Initial approved clip."
  },
  {
    id: "image_creator",
    type: "IMAGE",
    typeLabel: "Image",
    title: "Creator Dashboard Hero Image",
    description: "Generated image for campaign visual testing.",
    caption: "A clean visual for creator workflow positioning.",
    sourceType: "DEMO_SAMPLE",
    thumbnail: demoPlaceholder("Library Image"),
    status: "DRAFT",
    statusLabel: "Draft",
    workflowStatus: "DRAFT",
    workflowStatusLabel: "Draft",
    reviewNotes: "",
    rejectReason: "",
    platform: "INSTAGRAM_REELS",
    platformLabel: "Instagram Reels",
    project: "Product Visual Lab",
    socialAccount: "Fatih Reels",
    tags: ["visual", "dashboard"],
    date: "2026-05-29",
    meta: "9:16",
    assetStatus: "ACTIVE",
    assetStatusLabel: "Active",
    versionNumber: 1,
    isLatestVersion: true,
    versionNotes: "Initial draft image."
  },
  {
    id: "motion_reveal",
    type: "MOTION_IMAGE",
    typeLabel: "Motion Image",
    title: "Luxury Product Reveal Motion Image",
    description: "Dummy animated preview with cinematic pan.",
    caption: "Product reveal with a soft motion hook.",
    sourceType: "DEMO_SAMPLE",
    thumbnail: demoPlaceholder("Library Motion"),
    status: "REVIEW",
    statusLabel: "Review",
    workflowStatus: "REVIEW",
    workflowStatusLabel: "Review",
    reviewNotes: "Check product framing before approval.",
    rejectReason: "",
    platform: "INSTAGRAM_REELS",
    platformLabel: "Instagram Reels",
    project: "Product Visual Lab",
    socialAccount: "Fatih Reels",
    tags: ["product", "motion"],
    date: "2026-05-30",
    meta: "Product reveal",
    assetStatus: "ACTIVE",
    assetStatusLabel: "Active",
    versionNumber: 1,
    isLatestVersion: true,
    versionNotes: "Initial motion concept."
  },
  {
    id: "video_provider",
    type: "AI_VIDEO",
    typeLabel: "AI Video",
    title: "AI Video Provider Placeholder",
    description: "Dummy provider-ready AI video item.",
    caption: "A provider-ready placeholder for future AI video generation.",
    sourceType: "DEMO_SAMPLE",
    thumbnail: demoPlaceholder("Library Video"),
    status: "APPROVED",
    statusLabel: "Approved",
    workflowStatus: "APPROVED",
    workflowStatusLabel: "Approved",
    reviewNotes: "Provider placeholder approved for scheduling test.",
    rejectReason: "",
    approvedAt: "2026-05-30T04:00:00.000Z",
    approvedBy: "Admin",
    platform: "TIKTOK",
    platformLabel: "TikTok",
    project: "Creator Growth Engine",
    socialAccount: "Fatih TikTok",
    tags: ["ai-video", "provider"],
    date: "2026-05-30",
    meta: "Manual Upload",
    assetStatus: "ACTIVE",
    assetStatusLabel: "Active",
    versionNumber: 1,
    isLatestVersion: true,
    versionNotes: "Initial AI video placeholder."
  }
];
