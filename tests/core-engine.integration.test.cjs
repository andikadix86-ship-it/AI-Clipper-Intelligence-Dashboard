require("../scripts/register-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const { buildCoreIntelligence } = require("../lib/intelligence/core-engine.ts");
const { knowledgeEntryDraft } = require("../lib/intelligence/knowledge-entry-draft.ts");
const { createEmptyState, createFallbackPayload } = require("../lib/fallback-contract.ts");
const { extractGeminiText, geminiExecutionMode, requestGeminiJson } = require("../lib/providers/gemini-client.ts");
const { generateIntelligenceBrief, IntelligenceBriefValidationError } = require("../lib/intelligence/intelligence-engine.ts");
const { generateContentPackage, ContentCreatorValidationError, platformCta } = require("../lib/content-creator/content-creator-engine.ts");
const { generateClipPlan, ClipperValidationError, clipperPlatformCta } = require("../lib/clipper/clipper-engine.ts");
const { generateAffiliatePlan, AffiliateValidationError, affiliatePlatformCtas } = require("../lib/affiliate/affiliate-engine.ts");
const { generatePublishingPackage, PublishingValidationError } = require("../lib/publishing/publishing-engine.ts");
const { generatePerformanceRecommendation, AnalyticsValidationError } = require("../lib/analytics/analytics-engine.ts");
const { saveKnowledge, searchKnowledge } = require("../lib/knowledge-base/repository.ts");
const { requestTelegramApproval, updateTelegramApproval } = require("../lib/approval/telegram-approval.ts");
const { createCeoExecutionPlan } = require("../lib/agents/ceo-agent.ts");
const { orchestrateAgents, OrchestrationValidationError } = require("../lib/agents/orchestrator.ts");
const { runPolicyAgent } = require("../lib/agents/policy-agent.ts");
const { providerEnvironmentKey } = require("../lib/provider-environment.ts");
const { resolveTelegramEnvironmentConfig } = require("../lib/telegram-runtime.ts");

const url = "https://gemini.test/generate";
const briefInput = { niche: "Creator Economy", platform: "TIKTOK", contentObjective: "Increase engagement", targetAudience: "UMKM creators", language: "Bahasa Indonesia", contentType: "Short-form explainer", keyword: "AI workflow" };
const creatorInput = { niche: "Creator Economy", platform: "TIKTOK", contentObjective: "Increase engagement", targetAudience: "UMKM creators", language: "Bahasa Indonesia", contentType: "Short-form explainer", tone: "Professional", duration: "30 seconds" };
const clipperInput = { sourceType: "youtube_url", sourceTitle: "Creator workflow podcast", sourceUrl: "https://example.com/video", transcript: "Start with one audience problem, show a proof point, and end with a practical next step.", platform: "tiktok", language: "Bahasa Indonesia", contentObjective: "Find high-retention short clips", niche: "Creator Economy" };
const affiliateInput = { productName: "Portable Blender Pro", productCategory: "Kitchen Gadget", platform: "tiktok", targetAudience: "Active workers", priceRange: "Rp150.000 - Rp300.000", commissionRate: "12%", contentObjective: "Create soft-selling content", language: "Bahasa Indonesia" };
const publishingInput = { platform: "tiktok", contentTitle: "Affiliate product explainer", contentObjective: "Prepare manual export", language: "Bahasa Indonesia", approvalRequired: true };
const analyticsInput = { platform: "tiktok", contentTitle: "Affiliate product explainer", views: 250000, likes: 28000, comments: 1800, shares: 4200, saves: 5100, retentionRate: 78, clicks: 9200, conversions: 460, revenue: 2400000, contentObjective: "Increase affiliate conversion", niche: "Kitchen Gadget" };
const orchestrationInput = { objective: "Create educational short-form content", platform: "tiktok", niche: "Creator Economy", targetAudience: "UMKM creators", contentType: "Short-form explainer" };

test("Supabase offline contract keeps an empty UI-safe payload", () => {
  const payload = createFallbackPayload("DATABASE_UNAVAILABLE", "Database unavailable.", { projects: [] }, createEmptyState("projects"));
  assert.equal(payload.success, true);
  assert.equal(payload.source, "fallback");
  assert.equal(payload.fallback.reason, "DATABASE_UNAVAILABLE");
  assert.deepEqual(payload.projects, []);
  assert.equal(payload.emptyState.action.href, "/dashboard");
});

test("notification offline contract returns empty notifications", () => {
  const payload = createFallbackPayload("NOTIFICATION_UNAVAILABLE", "Database unavailable, using empty notifications.", { notifications: [], unreadCount: 0 });
  assert.deepEqual(payload.notifications, []);
  assert.equal(payload.unreadCount, 0);
  assert.equal(payload.fallback.retryable, true);
});

test("provider credential resolver reads Gemini environment configuration", () => {
  const previous = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "gemini-test-key";
  try {
    assert.equal(providerEnvironmentKey("GEMINI_VEO"), "gemini-test-key");
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test("Telegram runtime config uses environment fallback without a database row", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  const previousChatId = process.env.TELEGRAM_CHAT_ID;
  process.env.TELEGRAM_BOT_TOKEN = "telegram-test-token";
  process.env.TELEGRAM_CHAT_ID = "telegram-test-chat";
  try {
    const runtime = resolveTelegramEnvironmentConfig(null);
    assert.equal(runtime.configured, true);
    assert.equal(runtime.source, "env");
    assert.equal(runtime.chatId, "telegram-test-chat");
  } finally {
    if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = previousToken;
    if (previousChatId === undefined) delete process.env.TELEGRAM_CHAT_ID;
    else process.env.TELEGRAM_CHAT_ID = previousChatId;
  }
});

test("structured intelligence output includes the required core fields", () => {
  const output = buildCoreIntelligence({ topic: "AI product review", niche: "Affiliate", platform: "TIKTOK", trendSignal: 88, competitionLevel: "LOW" });
  for (const field of ["topic", "niche", "platform", "trend_score", "opportunity_score", "competition_level", "audience_intent", "recommended_angle", "hook_ideas", "content_format", "policy_risk", "knowledge_base_tags"]) {
    assert.ok(field in output, `missing ${field}`);
  }
  assert.equal(output.platform, "TIKTOK");
  assert.ok(output.knowledge_base_tags.includes("affiliate"));
});

test("Knowledge Base ingestion draft has a deterministic fingerprint", () => {
  const intelligence = buildCoreIntelligence({ topic: "AI product review", niche: "Affiliate", platform: "TIKTOK", trendSignal: 88, competitionLevel: "LOW" });
  const first = knowledgeEntryDraft(intelligence);
  const second = knowledgeEntryDraft(intelligence);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(first.category, "CONTENT_OPPORTUNITY");
  assert.ok(first.confidence >= 0 && first.confidence <= 100);
});

test("Gemini adapter client supports a real provider response", async () => {
  const data = await requestGeminiJson({
    apiKey: "test-key",
    url,
    payload: { prompt: "test" },
    fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "real response" }] } }] }), { status: 200 })
  });
  assert.equal(extractGeminiText(data), "real response");
  assert.equal(geminiExecutionMode("REAL", "test-key"), "REAL");
});

test("Gemini adapter client supports dummy fallback mode decision", () => {
  assert.equal(geminiExecutionMode("REAL", ""), "DUMMY");
  assert.equal(geminiExecutionMode("DUMMY", "test-key"), "DUMMY");
});

test("Gemini adapter classifies a missing API key", async () => {
  await assert.rejects(() => requestGeminiJson({ apiKey: "", url, payload: {} }), (error) => error.code === "API_KEY_MISSING" && error.retryable === false);
});

test("Gemini adapter classifies quota exceeded", async () => {
  await assert.rejects(() => requestGeminiJson({
    apiKey: "test-key",
    url,
    payload: {},
    fetchImpl: async () => new Response(JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED quota" } }), { status: 429 })
  }), (error) => error.code === "QUOTA_EXCEEDED" && error.retryable === true);
});

test("Gemini adapter classifies API timeout", async () => {
  await assert.rejects(() => requestGeminiJson({
    apiKey: "test-key",
    url,
    payload: {},
    timeoutMs: 5,
    fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError"))))
  }), (error) => error.code === "TIMEOUT");
});

test("Gemini adapter classifies invalid provider response", async () => {
  const data = await requestGeminiJson({
    apiKey: "test-key",
    url,
    payload: {},
    fetchImpl: async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 })
  });
  assert.throws(() => extractGeminiText(data), (error) => error.code === "INVALID_RESPONSE");
});

test("Gemini adapter classifies provider offline", async () => {
  await assert.rejects(() => requestGeminiJson({
    apiKey: "test-key",
    url,
    payload: {},
    fetchImpl: async () => { throw new TypeError("fetch failed: network offline"); }
  }), (error) => error.code === "PROVIDER_OFFLINE");
});

test("Intelligence Brief v1 returns a structured brief for valid input", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "DUMMY" });
  for (const field of ["topic", "niche", "platform", "trend_score", "opportunity_score", "competition_level", "audience_intent", "recommended_angle", "hook_ideas", "content_format", "suggested_duration", "caption_direction", "cta_direction", "policy_risk", "policy_notes", "originality_notes", "knowledge_base_tags", "next_actions"]) {
    assert.ok(field in result.data, `missing ${field}`);
  }
  assert.equal(result.meta.provider, "dummy");
  assert.equal(result.meta.mode, "fallback");
});

test("Intelligence Brief v1 rejects a missing niche", async () => {
  await assert.rejects(() => generateIntelligenceBrief({ ...briefInput, niche: "" }, { mode: "DUMMY" }), (error) => error instanceof IntelligenceBriefValidationError && error.code === "VALIDATION_ERROR");
});

test("Intelligence Brief v1 uses Gemini structured JSON in real mode", async () => {
  const responseBrief = { topic: "Gemini topic", niche: "Creator Economy", platform: "TIKTOK", trend_score: 91, opportunity_score: 88, competition_level: "low", audience_intent: "Learn", recommended_angle: "Proof first", hook_ideas: ["Hook"], content_format: "Short-form", suggested_duration: "30 seconds", caption_direction: "Concise", cta_direction: "Save", policy_risk: "low", policy_notes: ["Review"], originality_notes: ["Original"], knowledge_base_tags: ["gemini"], next_actions: ["Create"] };
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(responseBrief) }] } }] }), { status: 200 }) });
  assert.equal(result.meta.provider, "gemini");
  assert.equal(result.meta.mode, "real");
  assert.equal(result.data.topic, "Gemini topic");
});

test("Intelligence Brief v1 falls back when Gemini is unavailable", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => { throw new TypeError("fetch failed: provider offline"); } });
  assert.equal(result.meta.provider, "dummy");
  assert.equal(result.meta.error_reason, "PROVIDER_OFFLINE");
});

test("Intelligence Brief v1 falls back when Gemini quota is exceeded", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED quota" } }), { status: 429 }) });
  assert.equal(result.meta.error_reason, "QUOTA_EXCEEDED");
});

test("Intelligence Brief v1 falls back when Gemini times out", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError")))) });
  assert.equal(result.meta.error_reason, "TIMEOUT");
});

test("Intelligence Brief v1 falls back on invalid provider JSON", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
  assert.equal(result.meta.error_reason, "INVALID_RESPONSE");
});

test("Content Creator Engine v1 returns a structured content package", async () => {
  const result = await generateContentPackage(creatorInput, { mode: "DUMMY" });
  for (const field of ["title_options", "hook_options", "script", "scene_plan", "voice_over_direction", "subtitle_style", "caption", "hashtags", "description", "cta", "platform_metadata", "policy_check", "export_checklist", "next_actions"]) {
    assert.ok(field in result.data, `missing ${field}`);
  }
  assert.equal(result.meta.mode, "fallback");
});

test("Content Creator Engine v1 rejects a missing niche", async () => {
  await assert.rejects(() => generateContentPackage({ ...creatorInput, niche: "" }, { mode: "DUMMY" }), (error) => error instanceof ContentCreatorValidationError && error.code === "VALIDATION_ERROR");
});

test("Content Creator Engine v1 works without an intelligence brief", async () => {
  const result = await generateContentPackage(creatorInput, { mode: "DUMMY" });
  assert.ok(result.data.script.opening);
  assert.ok(result.data.scene_plan.length);
});

test("Content Creator Engine v1 falls back when Gemini is unavailable", async () => {
  const result = await generateContentPackage(creatorInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => { throw new TypeError("fetch failed: provider offline"); } });
  assert.equal(result.meta.error_reason, "PROVIDER_OFFLINE");
});

test("Content Creator Engine v1 falls back when quota is exceeded", async () => {
  const result = await generateContentPackage(creatorInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED quota" } }), { status: 429 }) });
  assert.equal(result.meta.error_reason, "QUOTA_EXCEEDED");
});

test("Content Creator Engine v1 falls back on timeout", async () => {
  const result = await generateContentPackage(creatorInput, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError")))) });
  assert.equal(result.meta.error_reason, "TIMEOUT");
});

test("Content Creator Engine v1 falls back on invalid provider JSON", async () => {
  const result = await generateContentPackage(creatorInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
  assert.equal(result.meta.error_reason, "INVALID_RESPONSE");
});

test("Content Creator Engine v1 uses platform-specific CTA", () => {
  assert.match(platformCta("YOUTUBE_SHORTS"), /subscribe/i);
  assert.match(platformCta("TIKTOK", true), /keranjang kuning/i);
  assert.match(platformCta("INSTAGRAM_REELS"), /DM/i);
  assert.match(platformCta("FACEBOOK_REELS"), /WhatsApp/i);
});

test("Clipper Engine v1 returns a structured clip plan from a transcript", async () => {
  const result = await generateClipPlan(clipperInput, { mode: "DUMMY" });
  for (const field of ["source_summary", "best_segments", "editing_direction", "platform_metadata", "policy_check", "export_checklist", "next_actions"]) assert.ok(field in result.data, `missing ${field}`);
  assert.match(result.data.source_summary, /Transcript/i);
  assert.ok(result.data.best_segments.length);
});

test("Clipper Engine v1 rejects a missing platform", async () => {
  await assert.rejects(() => generateClipPlan({ ...clipperInput, platform: "" }, { mode: "DUMMY" }), (error) => error instanceof ClipperValidationError && error.code === "VALIDATION_ERROR");
});

test("Clipper Engine v1 falls back for unavailable, quota, timeout, and invalid JSON provider responses", async () => {
  const unavailable = await generateClipPlan(clipperInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => { throw new TypeError("fetch failed: offline"); } });
  const quota = await generateClipPlan(clipperInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED quota" } }), { status: 429 }) });
  const timeout = await generateClipPlan(clipperInput, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError")))) });
  const invalid = await generateClipPlan(clipperInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
  assert.equal(unavailable.meta.error_reason, "PROVIDER_OFFLINE");
  assert.equal(quota.meta.error_reason, "QUOTA_EXCEEDED");
  assert.equal(timeout.meta.error_reason, "TIMEOUT");
  assert.equal(invalid.meta.error_reason, "INVALID_RESPONSE");
});

test("Clipper Engine v1 uses platform-specific CTA", () => {
  assert.match(clipperPlatformCta("youtube"), /subscribe/i);
  assert.match(clipperPlatformCta("tiktok"), /simpan/i);
  assert.match(clipperPlatformCta("instagram"), /DM/i);
  assert.match(clipperPlatformCta("facebook"), /WhatsApp/i);
});

test("Affiliate Engine v1 returns a structured affiliate plan", async () => {
  const result = await generateAffiliatePlan(affiliateInput, { mode: "DUMMY" });
  for (const field of ["product_research", "product_score", "content_strategy", "affiliate_cta", "campaign_plan", "risk_check", "next_actions"]) assert.ok(field in result.data, `missing ${field}`);
  assert.equal(result.data.campaign_plan.length, 5);
});

test("Affiliate Engine v1 rejects a missing product category", async () => {
  await assert.rejects(() => generateAffiliatePlan({ ...affiliateInput, productCategory: "" }, { mode: "DUMMY" }), (error) => error instanceof AffiliateValidationError && error.code === "VALIDATION_ERROR");
});

test("Affiliate Engine v1 falls back for unavailable, quota, timeout, and invalid JSON provider responses", async () => {
  const unavailable = await generateAffiliatePlan(affiliateInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => { throw new TypeError("fetch failed: offline"); } });
  const quota = await generateAffiliatePlan(affiliateInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED quota" } }), { status: 429 }) });
  const timeout = await generateAffiliatePlan(affiliateInput, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError")))) });
  const invalid = await generateAffiliatePlan(affiliateInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
  assert.equal(unavailable.meta.error_reason, "PROVIDER_OFFLINE");
  assert.equal(quota.meta.error_reason, "QUOTA_EXCEEDED");
  assert.equal(timeout.meta.error_reason, "TIMEOUT");
  assert.equal(invalid.meta.error_reason, "INVALID_RESPONSE");
});

test("Affiliate Engine v1 uses platform-specific CTA", () => {
  assert.match(affiliatePlatformCtas("tiktok").join(" "), /keranjang kuning/i);
  assert.match(affiliatePlatformCtas("youtube").join(" "), /deskripsi/i);
  assert.match(affiliatePlatformCtas("instagram").join(" "), /DM/i);
  assert.match(affiliatePlatformCtas("facebook").join(" "), /WhatsApp/i);
  assert.match(affiliatePlatformCtas("shopee").join(" "), /voucher/i);
});

test("Affiliate Engine v1 clamps provider product scores to 0-100", async () => {
  const providerPlan = { product_score: { demand_score: 142, competition_score: -10, commission_score: 500, content_potential_score: 101, overall_score: 999, recommendation: "scale" } };
  const result = await generateAffiliatePlan(affiliateInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(providerPlan) }] } }] }), { status: 200 }) });
  for (const value of Object.values(result.data.product_score).filter((item) => typeof item === "number")) assert.ok(value >= 0 && value <= 100);
});

test("Publishing Engine v1 returns a structured manual export package", async () => {
  const result = await generatePublishingPackage(publishingInput, { mode: "DUMMY" });
  for (const field of ["publishing_status", "platform", "final_metadata", "approval_flow", "export_package", "schedule_plan", "platform_checklist", "policy_check", "next_actions"]) assert.ok(field in result.data, `missing ${field}`);
  assert.equal(result.data.export_package.metadata_file_status, "ready");
});

test("Publishing Engine v1 rejects a missing platform", async () => {
  await assert.rejects(() => generatePublishingPackage({ ...publishingInput, platform: "" }, { mode: "DUMMY" }), (error) => error instanceof PublishingValidationError && error.code === "VALIDATION_ERROR");
});

test("Publishing Engine v1 falls back for unavailable, timeout, and invalid JSON provider responses", async () => {
  const unavailable = await generatePublishingPackage(publishingInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => { throw new TypeError("fetch failed: offline"); } });
  const timeout = await generatePublishingPackage(publishingInput, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError")))) });
  const invalid = await generatePublishingPackage(publishingInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
  assert.equal(unavailable.meta.error_reason, "PROVIDER_OFFLINE");
  assert.equal(timeout.meta.error_reason, "TIMEOUT");
  assert.equal(invalid.meta.error_reason, "INVALID_RESPONSE");
});

test("Publishing Engine v1 creates pending approval when approval is required", async () => {
  const result = await generatePublishingPackage({ ...publishingInput, approvalRequired: true }, { mode: "DUMMY" });
  assert.equal(result.data.approval_flow.required, true);
  assert.equal(result.data.approval_flow.status, "pending");
});

test("Analytics Engine v1 returns a structured recommendation", async () => {
  const result = await generatePerformanceRecommendation(analyticsInput, { mode: "DUMMY" });
  for (const field of ["performance_summary", "scorecard", "diagnosis", "recommendations", "decision", "knowledge_base_updates", "next_actions"]) assert.ok(field in result.data, `missing ${field}`);
});

test("Analytics Engine v1 rejects a missing platform", async () => {
  await assert.rejects(() => generatePerformanceRecommendation({ ...analyticsInput, platform: "" }, { mode: "DUMMY" }), (error) => error instanceof AnalyticsValidationError && error.code === "VALIDATION_ERROR");
});

test("Analytics Engine v1 falls back for unavailable, timeout, and invalid JSON provider responses", async () => {
  const unavailable = await generatePerformanceRecommendation(analyticsInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => { throw new TypeError("fetch failed: offline"); } });
  const timeout = await generatePerformanceRecommendation(analyticsInput, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError")))) });
  const invalid = await generatePerformanceRecommendation(analyticsInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
  assert.equal(unavailable.meta.error_reason, "PROVIDER_OFFLINE");
  assert.equal(timeout.meta.error_reason, "TIMEOUT");
  assert.equal(invalid.meta.error_reason, "INVALID_RESPONSE");
});

test("Analytics Engine v1 clamps provider scores to 0-100", async () => {
  const providerInsight = { scorecard: { reach_score: 200, engagement_score: -20, retention_score: 101, conversion_score: 500, overall_score: 120 } };
  const result = await generatePerformanceRecommendation(analyticsInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(providerInsight) }] } }] }), { status: 200 }) });
  for (const value of Object.values(result.data.scorecard)) assert.ok(value >= 0 && value <= 100);
});

test("Analytics Engine v1 recommends scale or repeat for high performance", async () => {
  const result = await generatePerformanceRecommendation({ ...analyticsInput, views: 1000000, likes: 180000, shares: 40000, saves: 50000, retentionRate: 92, clicks: 80000, conversions: 8000 }, { mode: "DUMMY" });
  assert.match(result.data.decision.action, /scale|repeat/);
});

test("Analytics Engine v1 recommends revise or stop for low performance", async () => {
  const result = await generatePerformanceRecommendation({ ...analyticsInput, views: 10, likes: 0, comments: 0, shares: 0, saves: 0, retentionRate: 4, clicks: 0, conversions: 0 }, { mode: "DUMMY" });
  assert.match(result.data.decision.action, /revise|stop/);
});

test("Knowledge Base v1 falls back to memory when Supabase and local JSON are unavailable", async () => {
  const saved = await saveKnowledge({ category: "hook-library", platform: "tiktok", niche: "creator", title: "Fast hook", content: "Show the outcome first.", tags: ["hook"], confidence_score: 86, source_type: "engine" }, { disableDatabase: true, disableLocalJson: true });
  assert.equal(saved.storage, "memory");
  const entries = await searchKnowledge("Fast hook", { disableDatabase: true, disableLocalJson: true });
  assert.ok(entries.some((entry) => entry.title === "Fast hook"));
});

test("Telegram approval v1 uses dummy mode when Telegram is not configured", async () => {
  const result = await requestTelegramApproval({ contentTitle: "Manual export draft", platform: "tiktok", objective: "Review content", riskLevel: "low", metadataSummary: "Metadata ready." }, { botToken: "", chatId: "" });
  assert.equal(result.approval.mode, "dummy");
  assert.equal(result.approval.status, "pending");
  assert.equal(updateTelegramApproval(result.approval.approval_id, "approved").status, "approved");
});

test("CEO Agent v1 selects the core workflow for a standard objective", () => {
  const plan = createCeoExecutionPlan(orchestrationInput);
  assert.deepEqual(plan.selected_agents, ["CEO Agent", "Research Agent", "Creator Agent", "Policy Agent", "Publishing Agent"]);
});

test("CEO Agent v1 adds optional Clipper, Affiliate, and Analytics agents when required", () => {
  const plan = createCeoExecutionPlan({ ...orchestrationInput, objective: "Create affiliate product video clips", transcript: "Long video transcript", productCategory: "Kitchen Gadget", metrics: { views: 1000 } });
  for (const agent of ["Clipper Agent", "Affiliate Agent", "Analytics Agent"]) assert.ok(plan.selected_agents.includes(agent));
});

test("Policy Agent v1 flags sensitive claims and recommends disclosure", () => {
  const result = runPolicyAgent({ caption: "Guaranteed finance profit with affiliate product" });
  assert.equal(result.risk_level, "medium");
  assert.equal(result.disclosure_recommendation, true);
});

test("Multi-Agent Orchestrator v1 completes a standard workflow in fallback mode", async () => {
  const result = await orchestrateAgents(orchestrationInput, { mode: "DUMMY" });
  assert.equal(result.status, "completed_with_fallback");
  assert.ok(result.outputs.research);
  assert.ok(result.outputs.creator);
  assert.ok(result.outputs.publishing);
  assert.equal(result.execution_logs.length, 5);
});

test("Multi-Agent Orchestrator v1 continues when an agent fails", async () => {
  const result = await orchestrateAgents(orchestrationInput, { mode: "DUMMY", failAgents: ["Creator Agent"] });
  assert.equal(result.status, "completed_with_fallback");
  assert.ok(result.execution_logs.some((log) => log.agent_name === "Creator Agent" && log.status === "failed"));
  assert.ok(result.outputs.publishing);
});

test("Multi-Agent Orchestrator v1 rejects a missing objective", async () => {
  await assert.rejects(() => orchestrateAgents({ ...orchestrationInput, objective: "" }, { mode: "DUMMY" }), (error) => error instanceof OrchestrationValidationError && error.code === "VALIDATION_ERROR");
});
