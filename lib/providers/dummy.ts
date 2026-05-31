import type { AIProviderAdapter, ProviderGenerateInput, ProviderResult, ProviderTextInput } from "@/lib/providers/types";

function seed(input: string) {
  return encodeURIComponent(input).slice(0, 64) || "provider-dummy";
}

function media(input: ProviderGenerateInput, label: string): ProviderResult {
  const generationType = label === "Image" ? "IMAGE" : label === "Motion Image" ? "MOTION_IMAGE" : "AI_VIDEO";
  const placeholder = `https://placehold.co/960x1280/0f172a/5eead4?text=${seed(`Dummy fallback - ${label}`)}`;
  return {
    title: `${label}: ${(input.originalPrompt ?? input.prompt).slice(0, 54)}`,
    description: `Dummy ${label.toLowerCase()} generated through provider layer. Real provider calls are disabled unless mode Real and API key are configured.`,
    caption: input.originalPrompt ?? input.prompt,
    thumbnail: placeholder,
    previewUrl: placeholder,
    warning: input.mode === "REAL" ? "Dummy fallback because provider failed or real generation is unavailable." : "Dummy mode active. This is not provider output.",
    model: "manual-dummy",
    generationType,
    isDummy: true,
    outputSource: "dummy",
    originalPrompt: input.originalPrompt ?? input.prompt,
    finalPrompt: input.finalPrompt ?? input.prompt,
    provider: input.provider,
    mode: "DUMMY"
  };
}

function text(input: ProviderTextInput, label: string): ProviderResult {
  return {
    title: `${label}: ${input.topic.slice(0, 60)}`,
    description: `Rule-based dummy ${label.toLowerCase()} for ${input.platform ?? "multi-platform"}.`,
    caption: `Hook: Stop scrolling. ${input.topic}. CTA: Save this and test it tonight.`,
    script: `0-3s: strong problem hook.\n3-20s: show proof and workflow.\n20-35s: deliver takeaway.\n35-45s: CTA to save and follow.`,
    analysis: `Dummy analysis: topic has strong educational potential, best for 30-45s short-form content.`,
    warning: input.mode === "REAL" && !input.apiKey ? "API key missing. Falling back to dummy output." : undefined,
    model: "rule-based-dummy",
    isDummy: true,
    outputSource: "dummy",
    provider: input.provider,
    mode: "DUMMY"
  };
}

export const dummyProvider: AIProviderAdapter = {
  generateImage: (input) => Promise.resolve({ ...media(input, "Image"), type: "IMAGE" }),
  generateVideo: (input) => Promise.resolve({ ...media(input, "AI Video"), type: "AI_VIDEO" }),
  generateMotionImage: (input) => Promise.resolve({ ...media(input, "Motion Image"), type: "MOTION_IMAGE" }),
  generateCaption: (input) => Promise.resolve(text(input, "Caption")),
  analyzeContent: (input) => Promise.resolve(text(input, "Content Analysis")),
  generateScript: (input) => Promise.resolve(text(input, "Short Script"))
};
