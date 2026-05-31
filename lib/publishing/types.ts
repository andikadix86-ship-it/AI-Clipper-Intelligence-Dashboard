import type { AuthStatus, PublishMode, PublishingJobStatus, SocialPlatform } from "@/lib/types";

export type PublishPostInput = {
  videoFileUrl?: string;
  socialAccountId?: string;
  contentItemId?: string;
  scheduleId?: string;
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "public" | "private" | "unlisted";
  madeForKids?: boolean;
  notifySubscribers?: boolean;
  caption: string;
  assetUrl?: string;
  platform: SocialPlatform;
  publishMode: PublishMode;
  account: {
    id: string;
    name: string;
    authStatus: AuthStatus;
    uploadMode: PublishMode;
  };
};

export type PublishPostResult = {
  ok: boolean;
  status: PublishingJobStatus;
  providerJobId?: string;
  postUrl?: string;
  errorMessage?: string;
  warning?: string;
};

export interface PublishingProvider {
  name: string;
  publishPost(input: PublishPostInput): Promise<PublishPostResult>;
  validateAccount(accountId: string): Promise<{ ok: boolean; authStatus: AuthStatus; message: string }>;
  refreshToken(accountId: string): Promise<{ ok: boolean; authStatus: AuthStatus; message: string }>;
  getPostStatus(providerJobId: string): Promise<{ status: PublishingJobStatus; message: string }>;
}
