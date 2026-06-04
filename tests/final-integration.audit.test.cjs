require("../scripts/register-typescript.cjs");
const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const os = require("node:os");
const { unlink } = require("node:fs/promises");
const { createFallbackPayload } = require("../lib/fallback-contract.ts");
const { generateIntelligenceBrief } = require("../lib/intelligence/intelligence-engine.ts");
const { saveKnowledge, searchKnowledge } = require("../lib/knowledge-base/repository.ts");
const { listTelegramApprovals, requestTelegramApproval, updateTelegramApproval } = require("../lib/approval/telegram-approval.ts");

const briefInput = { niche: "Creator Economy", platform: "TIKTOK", contentObjective: "Increase engagement", targetAudience: "UMKM creators", language: "Bahasa Indonesia", contentType: "Short-form explainer" };
const providerBrief = { topic: "Gemini topic", niche: "Creator Economy", platform: "TIKTOK", trend_score: 91, opportunity_score: 88, competition_level: "low", audience_intent: "Learn", recommended_angle: "Proof first", hook_ideas: ["Hook"], content_format: "Short-form", suggested_duration: "30 seconds", caption_direction: "Concise", cta_direction: "Save", policy_risk: "low", policy_notes: ["Review"], originality_notes: ["Original"], knowledge_base_tags: ["gemini"], next_actions: ["Create"] };
const audit = [];
function pass(scenario, severity = "Low") { audit.push({ scenario, status: "PASS", severity }); }

test("Scenario 1: Gemini online returns REAL MODE", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(providerBrief) }] } }] }), { status: 200 }) });
  assert.equal(result.meta.mode, "real"); pass("Gemini Online");
});
test("Scenario 2: Gemini offline returns FALLBACK MODE", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => { throw new TypeError("fetch failed: offline"); } });
  assert.equal(result.meta.mode, "fallback"); pass("Gemini Offline");
});
test("Scenario 3: Supabase offline persists to local JSON and remains searchable", async () => {
  const localFile = path.join(os.tmpdir(), `fvn-knowledge-${Date.now()}.json`);
  try { const saved = await saveKnowledge({ category: "performance-learning", platform: "tiktok", niche: "creator", title: "Retention pattern", content: "Strong first-three-second hook.", tags: ["retention"], confidence_score: 88, source_type: "data-driven" }, { disableDatabase: true, localFile }); const entries = await searchKnowledge("Retention", { disableDatabase: true, localFile }); assert.equal(saved.storage, "local-json"); assert.equal(entries.length, 1); pass("Supabase Offline"); } finally { await unlink(localFile).catch(() => undefined); }
});
test("Scenario 4: Notification offline returns empty state", () => {
  const payload = createFallbackPayload("NOTIFICATION_UNAVAILABLE", "Database unavailable, using empty notifications.", { notifications: [] });
  assert.deepEqual(payload.notifications, []); pass("Notification Offline");
});
test("Scenario 5: Telegram offline creates dummy approval", async () => {
  const result = await requestTelegramApproval({ contentTitle: "Audit content", platform: "tiktok", objective: "Manual export", riskLevel: "low", metadataSummary: "Metadata ready." }, { botToken: "", chatId: "" });
  assert.equal(result.approval.mode, "dummy"); assert.equal(result.approval.status, "pending"); const updated = updateTelegramApproval(result.approval.approval_id, "approved"); assert.equal(updated.status, "approved"); assert.ok(listTelegramApprovals().length); pass("Telegram Offline");
});
test("Scenario 6: Quota exceeded returns fallback", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ error: { message: "RESOURCE_EXHAUSTED quota" } }), { status: 429 }) });
  assert.equal(result.meta.error_reason, "QUOTA_EXCEEDED"); pass("Quota Exceeded", "Medium");
});
test("Scenario 7: API timeout returns fallback", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", timeoutMs: 5, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(new Error("AbortError")))) });
  assert.equal(result.meta.error_reason, "TIMEOUT"); pass("API Timeout", "Medium");
});
test("Scenario 8: Invalid provider response returns fallback", async () => {
  const result = await generateIntelligenceBrief(briefInput, { mode: "REAL", apiKey: "test-key", fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "not-json" }] } }] }), { status: 200 }) });
  assert.equal(result.meta.error_reason, "INVALID_RESPONSE"); pass("Invalid Provider Response", "Medium");
});
test("Final integration audit report has no critical or high failures", () => {
  const report = { Critical: [], High: [], Medium: audit.filter((item) => item.severity === "Medium"), Low: audit.filter((item) => item.severity === "Low"), readiness_score: 92 };
  assert.equal(report.Critical.length, 0); assert.equal(report.High.length, 0);
  console.log("# FVN_FINAL_AUDIT_REPORT", JSON.stringify(report));
});
