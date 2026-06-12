require("../scripts/register-typescript.cjs");

const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const os = require("node:os");
const { unlink } = require("node:fs/promises");
const { googleTrendsDataAdapter, youtubeDataAdapter, redditTrendAdapter, knowledgeBaseTrendAdapter } = require("../lib/intelligence/data-layer/adapters.ts");
const { aggregateTrendSignals } = require("../lib/intelligence/data-layer/aggregator.ts");
const { generateAffiliateOpportunities, generateContentOpportunities } = require("../lib/intelligence/data-layer/opportunities.ts");
const { saveKnowledge, searchKnowledge } = require("../lib/knowledge-base/repository.ts");

const input = { niche: "creator economy", platform: "tiktok", keyword: "AI content workflow" };
const noDatabase = { disableDatabase: true, disableLocalJson: true };
const response = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });

test("Google Trends adapter uses configured online endpoint", async () => {
  const rows = await googleTrendsDataAdapter.collect(input, { env: { GOOGLE_TRENDS_API_URL: "https://trends.test/signals" }, fetchImpl: async () => response({ signals: [{ keyword: "AI workflow", trend_score: 91, confidence_score: 84 }] }) });
  assert.equal(rows[0].source, "Google Trends");
  assert.equal(rows[0].mode, "real");
  assert.equal(rows[0].trend_score, 91);
});

test("Google Trends adapter falls back for offline and invalid responses", async () => {
  const offline = await googleTrendsDataAdapter.collect(input, { env: { GOOGLE_TRENDS_API_URL: "https://trends.test/signals" }, fetchImpl: async () => { throw new TypeError("fetch failed"); } });
  const invalid = await googleTrendsDataAdapter.collect(input, { env: { GOOGLE_TRENDS_API_URL: "https://trends.test/signals" }, fetchImpl: async () => response({}) });
  assert.ok(offline.every((item) => item.mode === "fallback"));
  assert.ok(invalid.every((item) => item.mode === "fallback"));
});

test("YouTube adapter uses Data API response and clamps scores", async () => {
  const rows = await youtubeDataAdapter.collect(input, { env: { YOUTUBE_API_KEY: "test-key" }, fetchImpl: async () => response({ items: [{ snippet: { title: "AI Workflow Tutorial" } }, { snippet: { title: "Faceless Video Workflow" } }] }) });
  assert.equal(rows[0].source, "YouTube");
  assert.equal(rows[0].mode, "real");
  assert.ok(rows.every((item) => item.trend_score >= 0 && item.trend_score <= 100));
});

test("YouTube adapter is disabled when key is missing", async () => {
  const rows = await youtubeDataAdapter.collect(input, { env: {} });
  assert.equal(rows.length, 0);
});

test("Reddit adapter supports OAuth search with online responses", async () => {
  let call = 0;
  const rows = await redditTrendAdapter.collect(input, {
    env: { REDDIT_CLIENT_ID: "id", REDDIT_CLIENT_SECRET: "secret", REDDIT_USER_AGENT: "fvn-test" },
    fetchImpl: async () => ++call === 1 ? response({ access_token: "token" }) : response({ data: { children: [{ data: { title: "AI creator stack", score: 320, num_comments: 42 } }] } })
  });
  assert.equal(rows[0].source, "Reddit");
  assert.equal(rows[0].mode, "real");
});

test("Reddit adapter falls back on timeout", async () => {
  const rows = await redditTrendAdapter.collect(input, {
    env: { REDDIT_CLIENT_ID: "id", REDDIT_CLIENT_SECRET: "secret", REDDIT_USER_AGENT: "fvn-test" },
    timeoutMs: 5,
    fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError"))))
  });
  assert.ok(rows.every((item) => item.mode === "fallback"));
});

test("Reddit adapter is optional when credentials are blank", async () => {
  const rows = await redditTrendAdapter.collect(input, { env: { REDDIT_CLIENT_ID: "", REDDIT_CLIENT_SECRET: "", REDDIT_USER_AGENT: "" } });
  assert.equal(rows.length, 0);
});

test("Knowledge Base adapter returns matching internal signals", async () => {
  await saveKnowledge({ category: "algorithm-knowledge", platform: "tiktok", niche: "creator economy", title: "AI content workflow pattern", content: "Use proof-led hooks.", tags: ["ai"], confidence_score: 88, source_type: "data-driven" }, noDatabase);
  const rows = await knowledgeBaseTrendAdapter.collect(input, { knowledgeOptions: noDatabase });
  assert.equal(rows[0].source, "Knowledge Base");
  assert.equal(rows[0].mode, "knowledge");
  assert.equal(rows[0].trend_score, 88);
});

test("Trend aggregator combines sources and persists only scores at least 80", async () => {
  const localFile = path.join(os.tmpdir(), `fvn-trends-${Date.now()}.json`);
  const adapter = { source: "YouTube", collect: async () => [
    { source: "YouTube", keyword: "rising AI workflow", trend_score: 91, confidence_score: 84, collected_at: new Date().toISOString(), mode: "real", message: "test" },
    { source: "YouTube", keyword: "declining generic tips", trend_score: 62, confidence_score: 70, collected_at: new Date().toISOString(), mode: "real", message: "test" }
  ] };
  try {
    const result = await aggregateTrendSignals(input, { adapters: [adapter], knowledgeOptions: { disableDatabase: true, localFile } });
    const knowledge = await searchKnowledge("rising AI workflow", { disableDatabase: true, localFile });
    assert.equal(result.feedback.saved, 1);
    assert.equal(result.feedback.skipped, 1);
    assert.ok(result.rising_keywords.includes("rising AI workflow"));
    assert.ok(result.declining_keywords.includes("declining generic tips"));
    assert.equal(knowledge.length, 1);
    assert.equal(knowledge[0].source_type, "real");
  } finally { await unlink(localFile).catch(() => undefined); }
});

test("Content and affiliate opportunity engines return structured recommendations", async () => {
  const adapter = { source: "Google Trends", collect: async () => [{ source: "Google Trends", keyword: "CCTV outdoor setup", trend_score: 88, confidence_score: 82, collected_at: new Date().toISOString(), mode: "real", message: "test" }] };
  const content = await generateContentOpportunities({ niche: "electronics", platform: "tiktok", keyword: "CCTV Outdoor 4MP" }, { adapters: [adapter], persistFeedback: false });
  const affiliate = await generateAffiliateOpportunities({ productCategory: "electronics", platform: "tiktok" }, { adapters: [adapter], persistFeedback: false });
  assert.ok(content[0].topic);
  assert.ok(content[0].score >= 0 && content[0].score <= 100);
  assert.equal(affiliate.product_category, "electronics");
  assert.ok(affiliate.demand_score >= 0 && affiliate.demand_score <= 100);
  assert.ok(affiliate.suggested_content_angles.length);
});
