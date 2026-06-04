import type { AIProviderName, CreativeType, ProviderMode, SocialPlatform } from "@/lib/types";

export type ProviderGenerateInput = {
  provider: AIProviderName;
  mode: ProviderMode;
  prompt: string;
  originalPrompt?: string;
  finalPrompt?: string;
  style?: string;
  aspectRatio?: string;
  motionPrompt?: string;
  apiKey?: string;
};

export type ProviderTextInput = {
  provider: AIProviderName;
  mode: ProviderMode;
  topic: string;
  platform?: SocialPlatform;
  apiKey?: string;
  allowDummyFallback?: boolean;
};

export type ProviderResult = {
  title: string;
  description: string;
  caption?: string;
  thumbnail?: string;
  previewUrl?: string;
  script?: string;
  analysis?: string;
  warning?: string;
  model?: string;
  generationType?: CreativeType;
  isDummy?: boolean;
  outputSource?: "provider" | "dummy";
  originalPrompt?: string;
  finalPrompt?: string;
  provider: AIProviderName;
  mode: ProviderMode;
  type?: CreativeType;
  providerError?: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

export interface AIProviderAdapter {
  generateImage(input: ProviderGenerateInput): Promise<ProviderResult>;
  generateVideo(input: ProviderGenerateInput): Promise<ProviderResult>;
  generateMotionImage(input: ProviderGenerateInput): Promise<ProviderResult>;
  generateCaption(input: ProviderTextInput): Promise<ProviderResult>;
  analyzeContent(input: ProviderTextInput): Promise<ProviderResult>;
  generateScript(input: ProviderTextInput): Promise<ProviderResult>;
}
