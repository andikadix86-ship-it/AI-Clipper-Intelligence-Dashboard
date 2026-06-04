export type CoreIntelligenceInput = {
  topic: string;
  niche?: string;
  platform?: string;
  trendSignal?: number;
  competitionLevel?: "LOW" | "MEDIUM" | "HIGH";
  audienceIntent?: string;
};

export type CoreIntelligenceOutput = {
  topic: string;
  niche: string;
  platform: string;
  trend_score: number;
  opportunity_score: number;
  competition_level: "LOW" | "MEDIUM" | "HIGH";
  audience_intent: string;
  recommended_angle: string;
  hook_ideas: string[];
  content_format: string[];
  policy_risk: "LOW" | "MEDIUM" | "HIGH";
  knowledge_base_tags: string[];
};

export function buildCoreIntelligence(input: CoreIntelligenceInput): CoreIntelligenceOutput {
  const topic = input.topic.trim() || "Untitled content opportunity";
  const niche = input.niche?.trim() || "General Creator Economy";
  const platform = input.platform || "MULTI_PLATFORM";
  const trendScore = clamp(input.trendSignal ?? 72);
  const competitionLevel = input.competitionLevel ?? "MEDIUM";
  const competitionAdjustment = competitionLevel === "LOW" ? 14 : competitionLevel === "HIGH" ? -12 : 4;
  const opportunityScore = clamp(Math.round(trendScore * 0.72 + competitionAdjustment + 18));
  const policyRisk = /copyright|reupload|medical|finance|guarantee|before after/i.test(topic) ? "MEDIUM" : "LOW";
  return {
    topic,
    niche,
    platform,
    trend_score: trendScore,
    opportunity_score: opportunityScore,
    competition_level: competitionLevel,
    audience_intent: input.audienceIntent || "Learn a practical workflow and identify the fastest next action.",
    recommended_angle: `Lead with a proof-first ${topic} result, then explain the repeatable workflow in concise steps.`,
    hook_ideas: [`Stop scrolling: this ${topic} workflow saves time.`, `Before you try ${topic}, check these three signals.`, `The simplest way to improve ${topic} without adding more tools.`],
    content_format: ["Short-form explainer", "Problem-solution breakdown", "Before-after workflow"],
    policy_risk: policyRisk,
    knowledge_base_tags: uniqueTags([niche, platform, topic, "hook-intelligence", "content-opportunity", policyRisk === "LOW" ? "policy-safe" : "policy-review"])
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueTags(values: string[]) {
  return [...new Set(values.map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).filter(Boolean))];
}
