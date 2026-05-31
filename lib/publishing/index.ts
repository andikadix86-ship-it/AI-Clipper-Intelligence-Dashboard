import { facebookPublishingProvider } from "@/lib/publishing/facebook";
import { instagramPublishingProvider } from "@/lib/publishing/instagram";
import { manualPublishingProvider } from "@/lib/publishing/manual";
import { tiktokPublishingProvider } from "@/lib/publishing/tiktok";
import type { PublishingProvider } from "@/lib/publishing/types";
import { youtubePublishingProvider } from "@/lib/publishing/youtube";
import type { SocialPlatform } from "@/lib/types";

export const publishingProviders: Record<SocialPlatform | "MANUAL_UPLOAD", PublishingProvider> = {
  YOUTUBE_SHORTS: youtubePublishingProvider,
  TIKTOK: tiktokPublishingProvider,
  INSTAGRAM_REELS: instagramPublishingProvider,
  FACEBOOK_REELS: facebookPublishingProvider,
  MANUAL_UPLOAD: manualPublishingProvider
};

export function getPublishingProvider(platform?: SocialPlatform | null) {
  return platform ? publishingProviders[platform] : manualPublishingProvider;
}
