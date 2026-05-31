import type { AuthStatus, PublishMode, SocialConnectionStatus, SocialPlatform, UploadMethod } from "@/lib/types";

export type SocialAccountDto = {
  id: string;
  projectId: string;
  projectName: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  niche: string;
  status: SocialConnectionStatus;
  uploadMethod: UploadMethod;
  uploadMode: PublishMode;
  authStatus: AuthStatus;
  tokenMasked: string;
  platformAccountId?: string;
  platformAccountName?: string;
  platformAccountAvatar?: string;
  permissionStatus: string;
  tokenExpiresAt?: string;
  lastSyncAt?: string;
  connectionNotes: string;
  loginNotes: string;
  notes: string;
  isActive: boolean;
  disabledAt?: string;
  lastActivityAt?: string;
  totalContent: number;
  scheduledPosts: number;
  postedPosts: number;
};

type SocialAccountRecord = {
  id: string;
  projectId: string | null;
  project?: { name: string } | null;
  socialPlatform: SocialPlatform | null;
  name: string;
  handle: string | null;
  niche: string | null;
  status: SocialConnectionStatus;
  uploadMethod: UploadMethod;
  uploadMode?: PublishMode;
  authStatus?: AuthStatus;
  accessTokenEncrypted?: string | null;
  platformAccountId?: string | null;
  platformAccountName?: string | null;
  platformAccountAvatar?: string | null;
  permissionStatus?: string;
  tokenExpiresAt?: Date | null;
  lastSyncAt?: Date | null;
  connectionNotes?: string;
  loginNotes: string | null;
  notes: string;
  isActive: boolean;
  disabledAt: Date | null;
  lastActivityAt: Date | null;
  _count?: { schedules: number };
  schedules?: Array<{ status: string }>;
};

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  TIKTOK: "TikTok",
  YOUTUBE_SHORTS: "YouTube Shorts",
  INSTAGRAM_REELS: "Instagram Reels",
  FACEBOOK_REELS: "Facebook Reels"
};

export const uploadMethodLabels: Record<UploadMethod, string> = {
  MANUAL: "Manual",
  API: "API",
  BROWSER_AUTOMATION: "Browser Automation"
};

export const publishModeLabels: Record<PublishMode, string> = {
  MANUAL: "Manual",
  SEMI_AUTO: "Semi Auto",
  AUTO: "Auto"
};

export const authStatusLabels: Record<AuthStatus, string> = {
  NOT_CONNECTED: "Not Connected",
  CONNECTED: "Connected",
  EXPIRED: "Expired",
  ERROR: "Error"
};

export const statusLabels: Record<SocialConnectionStatus, string> = {
  CONNECTED: "Connected",
  MANUAL: "Manual",
  NOT_CONNECTED: "Not Connected",
  DISABLED: "Disabled"
};

export function mapSocialAccount(account: SocialAccountRecord, contentCountByProject = new Map<string | null, number>()): SocialAccountDto {
  const scheduledPosts = account._count?.schedules ?? account.schedules?.length ?? 0;
  const postedPosts = account.schedules?.filter((schedule) => schedule.status === "POSTED").length ?? 0;

  return {
    id: account.id,
    projectId: account.projectId ?? "",
    projectName: account.project?.name ?? "Unassigned",
    platform: account.socialPlatform ?? "YOUTUBE_SHORTS",
    name: account.name,
    handle: account.handle ?? "",
    niche: account.niche ?? "",
    status: account.isActive ? account.status : "DISABLED",
    uploadMethod: account.uploadMethod,
    uploadMode: account.uploadMode ?? "MANUAL",
    authStatus: account.authStatus ?? "NOT_CONNECTED",
    tokenMasked: account.accessTokenEncrypted ? "tok_***masked" : "",
    platformAccountId: account.platformAccountId ?? undefined,
    platformAccountName: account.platformAccountName ?? undefined,
    platformAccountAvatar: account.platformAccountAvatar ?? undefined,
    permissionStatus: account.permissionStatus ?? "NOT_REQUESTED",
    tokenExpiresAt: account.tokenExpiresAt?.toISOString(),
    lastSyncAt: account.lastSyncAt?.toISOString(),
    connectionNotes: account.connectionNotes ?? "",
    loginNotes: account.loginNotes ?? "",
    notes: account.notes,
    isActive: account.isActive,
    disabledAt: account.disabledAt?.toISOString(),
    lastActivityAt: account.lastActivityAt?.toISOString() ?? account.disabledAt?.toISOString(),
    totalContent: contentCountByProject.get(account.projectId) ?? 0,
    scheduledPosts,
    postedPosts
  };
}
