export type Platform = "YOUTUBE" | "TIKTOK" | "INSTAGRAM";
export type PrivacyStatus = "PUBLIC" | "PRIVATE" | "UNLISTED";
export type ContentMode = "CLIPPER" | "IMAGE_GENERATOR" | "AI_VIDEO_GENERATOR";
export type CreativeType = "IMAGE" | "MOTION_IMAGE" | "AI_VIDEO";
export type AIProviderName = "GEMINI_VEO" | "OPENAI_SORA" | "RUNWAY" | "PIKA" | "LUMA" | "MANUAL_UPLOAD";
export type ProviderStatus = "CONNECTED" | "NOT_CONNECTED";
export type AIProviderStatus = "NOT_CONFIGURED" | "CONFIGURED" | "READY" | "ERROR" | "DUMMY";
export type ProviderMode = "DUMMY" | "REAL";
export type SocialPlatform = "TIKTOK" | "YOUTUBE_SHORTS" | "INSTAGRAM_REELS" | "FACEBOOK_REELS";
export type SocialConnectionStatus = "CONNECTED" | "MANUAL" | "NOT_CONNECTED" | "DISABLED";
export type UploadMethod = "MANUAL" | "API" | "BROWSER_AUTOMATION";
export type PublishMode = "MANUAL" | "SEMI_AUTO" | "AUTO";
export type AuthStatus = "NOT_CONNECTED" | "CONNECTED" | "EXPIRED" | "ERROR";
export type PublishingJobStatus = "READY_TO_POST" | "PUBLISHING" | "POSTED" | "FAILED" | "CANCELED";
export type ContentType = "CLIP" | "IMAGE" | "MOTION_IMAGE" | "AI_VIDEO" | "SCHEDULED_POST" | "IDEA" | "SCRIPT" | "CLIP_PLAN";
export type ContentStatus = "DRAFT" | "REVIEW" | "APPROVED" | "SCHEDULED" | "POSTED" | "REJECTED" | "FAILED" | "READY";
export type LibraryAssetStatus = "ACTIVE" | "ARCHIVED" | "TRASHED";
export type AgentRole = "CEO" | "RESEARCH" | "SCRIPT" | "CLIPPER" | "CREATIVE" | "SCHEDULER" | "ANALYST";
export type AgentStatus = "ACTIVE" | "PAUSED" | "DISABLED";
export type AgentTaskType = "RESEARCH_TREND" | "GENERATE_CONTENT_IDEA" | "REVIEW_CONTENT" | "RECOMMEND_SCHEDULE" | "ANALYZE_PERFORMANCE";
export type AgentTaskStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
export type AgentPriority = "HIGH" | "MEDIUM" | "LOW";
export type TelegramStatus = "CONNECTED" | "NOT_CONNECTED" | "ERROR";
export type TelegramApprovalAction = "SENT_REVIEW" | "SENT_APPROVED" | "APPROVED" | "REJECTED" | "REVIEW" | "TEST";
export type TelegramLogStatus = "PENDING" | "SENT" | "FAILED" | "RESPONDED";
export type AutomationPlanStatus = "DRAFT" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED";

export type VideoPreview = {
  id: string;
  platform: Platform;
  url: string;
  videoId?: string;
  title: string;
  thumbnail: string;
  embedUrl?: string;
};

export type ClipSettingPayload = {
  videoSourceId?: string;
  prompt: string;
  watermark: boolean;
  subtitle: boolean;
  category: string;
  clipCount: number;
  duration: number | "AUTO";
  resolution: string;
  layout: string;
  subtitleStyle: string;
  textPlacement: string;
  ccLanguage: string;
};

export type GeneratedClipDto = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  viralScore: number;
  tags: string[];
  outputFileUrl?: string;
  subtitleUrl?: string;
  startTime?: number;
  endTime?: number;
  processingStatus?: string;
  errorMessage?: string;
};

export type PostingClipDetailDto = {
  generatedClipId: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: PrivacyStatus;
  notifySubscriber: boolean;
  madeForKids: boolean;
};

export type ProjectDto = {
  id: string;
  name: string;
  niche: string;
  category: string;
  targetAccounts: string[];
  contentMode: ContentMode;
};

export type CreativeAssetDto = {
  id: string;
  type: CreativeType;
  title: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  motionPrompt?: string;
  provider?: AIProviderName;
  thumbnail: string;
  previewUrl?: string;
  status: "READY" | "PROCESSING" | "FAILED";
  model?: string;
  generationType?: CreativeType;
  mode?: ProviderMode;
  isDummy?: boolean;
  outputSource?: "provider" | "dummy";
  finalPrompt?: string;
  generationStatus?: string;
  warning?: string;
  relevanceWarning?: string;
  createdAt?: string;
};

export type AIProviderDto = {
  id?: string;
  name: AIProviderName;
  status: ProviderStatus;
  providerStatus?: AIProviderStatus;
  lastTestAt?: string;
  lastTestStatus?: AIProviderStatus;
  lastTestError?: string;
  mode?: ProviderMode;
  apiKeyMasked?: string;
  dailyLimit: number;
  usedToday: number;
  resetTime: string;
  isActive: boolean;
};

export type LibraryItemDto = {
  id: string;
  type: ContentType;
  typeLabel: string;
  title: string;
  description: string;
  caption: string;
  thumbnail: string;
  status: ContentStatus;
  statusLabel: string;
  workflowStatus: ContentStatus;
  workflowStatusLabel: string;
  reviewNotes: string;
  rejectReason: string;
  reviewer?: string;
  approvedAt?: string;
  approvedBy?: string;
  scheduledAt?: string;
  publishedAt?: string;
  failureReason?: string;
  telegramChatId?: string;
  approvalMessageId?: string;
  approvalStatus?: string;
  sourceType?: string;
  linkedFromContentId?: string;
  parentAssetId?: string;
  assetStatus: LibraryAssetStatus;
  assetStatusLabel: string;
  versionNumber: number;
  isLatestVersion: boolean;
  versionNotes: string;
  archivedAt?: string;
  trashedAt?: string;
  viralScorePrediction?: number;
  contentAngle?: string;
  trendKeyword?: string;
  trendPlatform?: SocialPlatform;
  fypScore?: number;
  hook?: string;
  cta?: string;
  targetAudience?: string;
  editingStyle?: string;
  suggestedDuration?: number;
  notes?: string;
  postUrl?: string;
  scheduleStatus?: string;
  analyticsStatus?: string;
  performanceSummary?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    watchTime: number;
    averageViewDuration: number;
    followersGained: number;
    engagementRate: number;
    postedAt?: string;
    recordedAt?: string;
  };
  platform?: SocialPlatform;
  platformLabel: string;
  projectId?: string;
  project: string;
  socialAccountId?: string;
  socialAccount: string;
  tags: string[];
  date: string;
  meta: string;
  approvalHistory?: ApprovalHistoryDto[];
  versionHistory?: AssetVersionDto[];
  publishingHistory?: PublishingHistoryDto[];
  collections?: AssetCollectionSummaryDto[];
  agentRecommendations?: AgentRecommendationDto[];
  telegramApprovalLogs?: TelegramApprovalLogDto[];
  generationProvider?: AIProviderName;
  generationModel?: string;
  generationMode?: ProviderMode;
  generationType?: CreativeType;
  generationOutputSource?: "provider" | "dummy";
  generationStatus?: string;
  originalPrompt?: string;
  finalPrompt?: string;
  isDummyGeneration?: boolean;
  generationWarning?: string;
  isDemoData?: boolean;
};

export type ApprovalHistoryDto = {
  id: string;
  fromStatus: ContentStatus;
  toStatus: ContentStatus;
  note: string;
  reason: string;
  actionBy: string;
  createdAt: string;
};

export type AssetVersionDto = {
  id: string;
  title: string;
  versionNumber: number;
  isLatestVersion: boolean;
  versionNotes: string;
  assetStatus: LibraryAssetStatus;
  createdAt: string;
};

export type PublishingHistoryDto = {
  id: string;
  status: string;
  platform: string;
  scheduledAt?: string;
  socialAccount: string;
};

export type AssetCollectionSummaryDto = {
  id: string;
  name: string;
};

export type AssetCollectionDto = {
  id: string;
  name: string;
  description: string;
  projectId?: string;
  project: string;
  contentCount: number;
  createdAt: string;
};

export type AIAgentDto = {
  id: string;
  name: string;
  role: AgentRole;
  roleLabel: string;
  description: string;
  status: AgentStatus;
  statusLabel: string;
  lastRunAt?: string;
  totalTasks: number;
  successRate: number;
  createdAt: string;
};

export type AgentTaskDto = {
  id: string;
  agentId: string;
  agentName?: string;
  projectId?: string;
  project?: string;
  contentItemId?: string;
  contentTitle?: string;
  taskType: AgentTaskType;
  taskTypeLabel: string;
  title: string;
  description: string;
  status: AgentTaskStatus;
  priority: AgentPriority;
  result: string;
  createdAt: string;
  completedAt?: string;
};

export type AgentRecommendationDto = {
  id: string;
  agentId: string;
  agentName?: string;
  projectId?: string;
  project?: string;
  contentItemId?: string;
  contentTitle?: string;
  title: string;
  description: string;
  recommendationType: string;
  priority: AgentPriority;
  score: number;
  status: string;
  createdAt: string;
};

export type AutomationPlanDto = {
  id: string;
  projectId?: string;
  project?: string;
  socialAccountId?: string;
  socialAccount?: string;
  title: string;
  description: string;
  suggestedPlatform?: SocialPlatform;
  suggestedPlatformLabel: string;
  suggestedPostingTime: string;
  reason: string;
  priority: AgentPriority;
  status: AutomationPlanStatus;
  statusLabel: string;
  createdByAgentId?: string;
  createdByAgent?: string;
  createdAt: string;
  updatedAt: string;
};

export type TelegramSettingDto = {
  id?: string;
  botTokenMasked: string;
  chatId: string;
  status: TelegramStatus;
  statusLabel: string;
  lastTestAt?: string;
};

export type GoogleOAuthSettingDto = {
  id?: string;
  clientIdMasked: string;
  clientSecretMasked: string;
  redirectUri: string;
  status: ProviderStatus;
  statusLabel: string;
  lastTestAt?: string;
};

export type OAuthProviderSettingDto = {
  id?: string;
  provider: "TIKTOK" | "META";
  clientIdMasked: string;
  clientSecretMasked: string;
  redirectUri: string;
  status: ProviderStatus;
  statusLabel: string;
  lastTestAt?: string;
};

export type TelegramApprovalLogDto = {
  id: string;
  contentItemId: string;
  action: TelegramApprovalAction;
  telegramMessageId?: string;
  telegramChatId?: string;
  status: TelegramLogStatus;
  responseBy?: string;
  responseAt?: string;
  errorMessage?: string;
  createdAt: string;
};
