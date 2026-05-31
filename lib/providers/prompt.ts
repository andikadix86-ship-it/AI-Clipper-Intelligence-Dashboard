import type { CreativeType } from "@/lib/types";

export function buildCreativeFinalPrompt(input: { prompt: string; style?: string; type: CreativeType; motionPrompt?: string }) {
  const originalPrompt = input.prompt.trim();
  const typeInstruction =
    input.type === "IMAGE"
      ? "Create a polished image. Keep the requested product, brand, color, and named subject as the main visual focus."
      : input.type === "MOTION_IMAGE"
        ? "Create a motion-image visual concept. Keep the requested product, brand, color, and named subject as the main visual focus."
        : "Create a short video concept. Keep the requested product, brand, color, and named subject as the main visual focus.";
  const styleInstruction = input.style ? `Visual style: ${input.style}.` : "";
  const motionInstruction = input.motionPrompt ? `Motion direction: ${input.motionPrompt}.` : "";

  return `${typeInstruction} User request (preserve exactly): "${originalPrompt}". ${styleInstruction} ${motionInstruction}`.trim();
}

export function promptPreview(prompt: string) {
  return prompt.replace(/\s+/g, " ").slice(0, 160);
}
