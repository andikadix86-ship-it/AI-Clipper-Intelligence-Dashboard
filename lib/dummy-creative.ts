import type { AIProviderDto, CreativeAssetDto, ProjectDto } from "@/lib/types";
import { demoPlaceholder } from "@/lib/demo-placeholder";

export const providerLabels = {
  GEMINI_VEO: "Gemini Veo",
  OPENAI_SORA: "OpenAI Sora / Future Provider",
  RUNWAY: "Runway",
  PIKA: "Pika",
  LUMA: "Luma",
  MANUAL_UPLOAD: "Manual Upload"
} as const;

export const defaultProviders: AIProviderDto[] = [
  { name: "GEMINI_VEO", status: "NOT_CONNECTED", providerStatus: "DUMMY", mode: "DUMMY", dailyLimit: 20, usedToday: 0, resetTime: "00:00", isActive: false },
  { name: "OPENAI_SORA", status: "NOT_CONNECTED", providerStatus: "DUMMY", mode: "DUMMY", dailyLimit: 10, usedToday: 0, resetTime: "00:00", isActive: false },
  { name: "RUNWAY", status: "NOT_CONNECTED", providerStatus: "DUMMY", mode: "DUMMY", dailyLimit: 30, usedToday: 0, resetTime: "00:00", isActive: false },
  { name: "PIKA", status: "NOT_CONNECTED", providerStatus: "DUMMY", mode: "DUMMY", dailyLimit: 30, usedToday: 0, resetTime: "00:00", isActive: false },
  { name: "LUMA", status: "NOT_CONNECTED", providerStatus: "DUMMY", mode: "DUMMY", dailyLimit: 20, usedToday: 0, resetTime: "00:00", isActive: false },
  { name: "MANUAL_UPLOAD", status: "CONNECTED", providerStatus: "DUMMY", mode: "DUMMY", dailyLimit: 999, usedToday: 0, resetTime: "00:00", isActive: true }
];

export const dummyProjects: ProjectDto[] = [
  {
    id: "project_creator_growth",
    name: "Creator Growth Engine",
    niche: "AI productivity for creators",
    category: "Education",
    targetAccounts: ["Fatih - YouTube", "Fatih - TikTok", "Fatih - Instagram"],
    contentMode: "CLIPPER"
  },
  {
    id: "project_product_visuals",
    name: "Product Visual Lab",
    niche: "Premium product promos",
    category: "Commerce",
    targetAccounts: ["Fatih - Instagram"],
    contentMode: "IMAGE_GENERATOR"
  }
];

export function buildDummyAsset(input: {
  type: CreativeAssetDto["type"];
  prompt: string;
  style?: string;
  aspectRatio?: string;
  motionPrompt?: string;
  provider?: CreativeAssetDto["provider"];
}): CreativeAssetDto {
  const label = input.type === "IMAGE" ? "Generated Image" : input.type === "MOTION_IMAGE" ? "Motion Image" : "AI Video";
  return {
    id: `asset_${Date.now()}`,
    type: input.type,
    title: `${label}: ${input.prompt.slice(0, 42) || "Untitled"}`,
    prompt: input.prompt,
    style: input.style,
    aspectRatio: input.aspectRatio,
    motionPrompt: input.motionPrompt,
    provider: input.provider,
    thumbnail: demoPlaceholder(label),
    previewUrl: input.type === "MOTION_IMAGE" ? "dummy-motion-preview" : input.type === "AI_VIDEO" ? "dummy-video-preview" : undefined,
    status: "READY",
    createdAt: new Date().toISOString()
  };
}

export const dummyLibraryAssets: CreativeAssetDto[] = [
  buildDummyAsset({ type: "IMAGE", prompt: "Founder in a futuristic studio with teal rim light", style: "Cinematic", aspectRatio: "9:16" }),
  buildDummyAsset({ type: "MOTION_IMAGE", prompt: "Luxury sneaker product hero", style: "Product Render", aspectRatio: "1:1", motionPrompt: "cinematic pan with product reveal" }),
  buildDummyAsset({ type: "AI_VIDEO", prompt: "Short explainer about AI creator workflows", aspectRatio: "16:9", provider: "MANUAL_UPLOAD" })
];
