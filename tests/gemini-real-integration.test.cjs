require("../scripts/register-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const { generateIntelligenceBrief } = require("../lib/intelligence/intelligence-engine.ts");
const { generateContentPackage } = require("../lib/content-creator/content-creator-engine.ts");
const { generateClipPlan } = require("../lib/clipper/clipper-engine.ts");
const { generateAffiliatePlan } = require("../lib/affiliate/affiliate-engine.ts");
const { generatePublishingPackage } = require("../lib/publishing/publishing-engine.ts");
const { generatePerformanceRecommendation } = require("../lib/analytics/analytics-engine.ts");

const engines = [
  ["Intelligence", generateIntelligenceBrief, { niche: "personal finance", platform: "YouTube Shorts", contentObjective: "education", targetAudience: "beginner", language: "Bahasa Indonesia", contentType: "faceless video" }, ["topic", "trend_score", "hook_ideas"]],
  ["Content Creator", generateContentPackage, { niche: "personal finance", platform: "YouTube Shorts", contentObjective: "education", targetAudience: "beginner", language: "Bahasa Indonesia", contentType: "faceless video", tone: "educational", duration: "45 seconds" }, ["title_options", "script", "scene_plan"]],
  ["Clipper", generateClipPlan, { sourceType: "upload", transcript: "A useful transcript", platform: "tiktok", language: "Bahasa Indonesia", contentObjective: "awareness" }, ["best_segments", "platform_metadata", "policy_check"]],
  ["Affiliate", generateAffiliatePlan, { productCategory: "electronics", productName: "CCTV Outdoor 4MP", platform: "tiktok", targetAudience: "home owners", contentObjective: "conversion", language: "Bahasa Indonesia" }, ["product_score", "campaign_plan", "risk_check"]],
  ["Publishing", generatePublishingPackage, { platform: "youtube", contentTitle: "Finance Tips", contentObjective: "education", language: "Bahasa Indonesia", approvalRequired: true }, ["final_metadata", "approval_flow", "export_package"]],
  ["Analytics", generatePerformanceRecommendation, { platform: "youtube", contentTitle: "Finance Tips", contentObjective: "education", views: 1000, likes: 100, retentionRate: 65 }, ["scorecard", "recommendations", "decision"]]
];

const geminiResponse = (payload = {}) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }), { status: 200 });
const quotaResponse = () => new Response(JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED quota exceeded" } }), { status: 429 });
const timeoutFetch = async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError"))));

for (const [name, engine, input, requiredFields] of engines) {
  test(`${name}: Gemini REAL mode returns typed structured output`, async () => {
    const result = await engine(input, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => geminiResponse({}) });
    assert.equal(result.meta.provider, "gemini");
    assert.equal(result.meta.mode, "real");
    assert.ok(result.meta.generated_at);
    for (const field of requiredFields) assert.ok(field in result.data, `${name} missing ${field}`);
  });

  test(`${name}: missing key activates fallback output`, async () => {
    const result = await engine(input, { mode: "REAL", apiKey: "" });
    assert.equal(result.meta.provider, "dummy");
    assert.equal(result.meta.mode, "fallback");
    assert.equal(result.meta.error_reason, "API_KEY_MISSING");
    for (const field of requiredFields) assert.ok(field in result.data, `${name} fallback missing ${field}`);
  });

  test(`${name}: quota exceeded activates fallback output`, async () => {
    const result = await engine(input, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => quotaResponse() });
    assert.equal(result.meta.error_reason, "QUOTA_EXCEEDED");
    assert.equal(result.meta.mode, "fallback");
  });

  test(`${name}: timeout activates fallback output`, async () => {
    const result = await engine(input, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: timeoutFetch });
    assert.equal(result.meta.error_reason, "TIMEOUT");
    assert.equal(result.meta.mode, "fallback");
  });

  test(`${name}: invalid response activates fallback output`, async () => {
    const result = await engine(input, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
    assert.equal(result.meta.error_reason, "INVALID_RESPONSE");
    assert.equal(result.meta.mode, "fallback");
  });

  test(`${name}: explicit DUMMY mode returns fallback output`, async () => {
    const result = await engine(input, { mode: "DUMMY", apiKey: "test-key" });
    assert.equal(result.meta.provider, "dummy");
    assert.equal(result.meta.mode, "fallback");
    assert.equal(result.meta.error_reason, "DUMMY_MODE_REQUESTED");
  });
}
