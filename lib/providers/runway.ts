import { dummyProvider } from "@/lib/providers/dummy";
import type { AIProviderAdapter, ProviderGenerateInput, ProviderResult } from "@/lib/providers/types";

async function withWarning(result: ProviderResult): Promise<ProviderResult> {
  return {
    ...result,
    warning: "Runway real adapter is not implemented yet. Dummy fallback used.",
    mode: "DUMMY"
  };
}

export const runwayProvider: AIProviderAdapter = {
  ...dummyProvider,
  generateImage: async (input: ProviderGenerateInput) => withWarning(await dummyProvider.generateImage(input)),
  generateVideo: async (input: ProviderGenerateInput) => withWarning(await dummyProvider.generateVideo(input)),
  generateMotionImage: async (input: ProviderGenerateInput) => withWarning(await dummyProvider.generateMotionImage(input))
};
