const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

require("./register-typescript.cjs");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.HEALTHCHECK_PORT || 3017);
const baseUrl = `http://127.0.0.1:${port}`;
const checks = [];
const blockers = [];
const recommendations = [];
const serverLogs = [];

const pageRoutes = [
  "/dashboard",
  "/intelligence",
  "/ai-content-creator",
  "/clipper-center",
  "/affiliate-center",
  "/publishing-center",
  "/analytics",
  "/content-library",
  "/ai-agents",
  "/knowledge-base",
  "/integrations",
  "/settings",
];

const safeGetApis = [
  "/api/health",
  "/api/system-health",
  "/api/errors",
  "/api/notifications",
  "/api/approval/telegram",
  "/api/knowledge-base?take=3",
  "/api/providers/status",
  "/api/publishing/providers",
  "/api/intelligence/youtube-quota",
  "/api/agents/center",
  "/api/dashboard/operations",
  "/api/media/jobs",
  "/api/publishing",
  "/api/recommendations",
  "/api/scheduler",
  "/api/library",
  "/api/automation-plans",
];

const safePostApis = [
  ["/api/intelligence/trends", { niche: "creator economy", platform: "tiktok", keyword: "AI content workflow" }],
  ["/api/intelligence/opportunities", { niche: "creator economy", platform: "tiktok", keyword: "AI content workflow" }],
  ["/api/intelligence/affiliate-opportunities", { productCategory: "electronics", platform: "tiktok" }],
];

function record(name, status, detail, meta) {
  checks.push({ name, status, detail, ...(meta ? { meta } : {}) });
  const symbol = status === "PASS" ? "[PASS]" : status === "WARNING" ? "[WARNING]" : "[FAIL]";
  console.log(`${symbol} ${name}: ${detail}`);
}

function fail(name, detail) {
  blockers.push(detail);
  record(name, "FAIL", detail);
}

function warn(name, detail, recommendation) {
  if (recommendation) recommendations.push(recommendation);
  record(name, "WARNING", detail);
}

function walkFiles(directory, filename) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(target, filename);
    return entry.name === filename ? [target] : [];
  });
}

function toRoute(file, baseDirectory) {
  const relative = path.relative(baseDirectory, path.dirname(file)).replaceAll("\\", "/");
  return relative ? `/${relative}` : "/";
}

function extractMethods(file) {
  const source = fs.readFileSync(file, "utf8");
  return [
    ...source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g),
    ...source.matchAll(/export\s*\{\s*(GET|POST|PUT|PATCH|DELETE)\s*\}/g),
  ].map((match) => match[1]);
}

function assertFields(value, fields, label) {
  const missing = fields.filter((field) => !(field in value));
  if (missing.length) throw new Error(`${label} missing fields: ${missing.join(", ")}`);
}

function collectInvalidScores(value, parent = "") {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => {
    const label = parent ? `${parent}.${key}` : key;
    const current =
      typeof child === "number" && /score/i.test(key) && (child < 0 || child > 100)
        ? [`${label}=${child}`]
        : [];
    return current.concat(collectInvalidScores(child, label));
  });
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 8000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 20000) {
    try {
      const response = await request(`${baseUrl}/dashboard`, { timeout: 1500 });
      if (response.status < 500) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function runBuild() {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["run", "build"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 240000,
    windowsHide: true,
  });
  if (result.status !== 0) {
    const detail = result.error?.message || result.stderr?.slice(-1200) || "Production build failed.";
    fail("Production build", detail);
    return false;
  }
  record("Production build", "PASS", "npm run build completed successfully.");
  return true;
}

async function verifyInventory() {
  const pages = walkFiles(path.join(root, "app"), "page.tsx").map((file) =>
    toRoute(file, path.join(root, "app")),
  );
  const missingPages = pageRoutes.filter((route) => !pages.includes(route));
  if (missingPages.length) fail("Sidebar route inventory", `Missing pages: ${missingPages.join(", ")}`);
  else record("Sidebar route inventory", "PASS", `${pageRoutes.length} sidebar pages are present.`);

  const apiFiles = walkFiles(path.join(root, "app", "api"), "route.ts");
  const invalid = apiFiles.filter((file) => extractMethods(file).length === 0);
  if (invalid.length) {
    fail("API endpoint inventory", `Handlers missing exported methods: ${invalid.join(", ")}`);
  } else {
    record("API endpoint inventory", "PASS", `${apiFiles.length} API route handlers have exported methods.`);
  }
}

async function verifyContracts() {
  const { requestGeminiJson } = require("../lib/providers/gemini-client.ts");
  const { generateIntelligenceBrief } = require("../lib/intelligence/intelligence-engine.ts");
  const { generateContentPackage } = require("../lib/content-creator/content-creator-engine.ts");
  const { generateClipPlan } = require("../lib/clipper/clipper-engine.ts");
  const { generateAffiliatePlan } = require("../lib/affiliate/affiliate-engine.ts");
  const { generatePublishingPackage } = require("../lib/publishing/publishing-engine.ts");
  const { generatePerformanceRecommendation } = require("../lib/analytics/analytics-engine.ts");
  const { orchestrateAgents } = require("../lib/agents/orchestrator.ts");
  const { saveKnowledge, searchKnowledge } = require("../lib/knowledge-base/repository.ts");
  const { requestTelegramApproval } = require("../lib/approval/telegram-approval.ts");
  const { createFallbackPayload } = require("../lib/fallback-contract.ts");

  const input = {
    niche: "creator economy",
    platform: "TikTok",
    contentObjective: "education",
    targetAudience: "small business owners",
    language: "id",
    contentType: "short-video",
    keyword: "content workflow",
  };

  const fakeGemini = async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  const geminiReal = await requestGeminiJson({
    apiKey: "healthcheck-key",
    url: "https://example.invalid/gemini-healthcheck",
    payload: { prompt: "healthcheck" },
    fetchImpl: fakeGemini,
  });
  if (geminiReal.candidates?.length) {
    record("Gemini real adapter", "PASS", "Mocked REAL mode returned a Gemini response.");
  } else fail("Gemini real adapter", "REAL mode did not return Gemini metadata.");

  try {
    await requestGeminiJson({ apiKey: "", url: "https://example.invalid", payload: {} });
    fail("Gemini fallback adapter", "Missing API key did not produce an adapter fallback signal.");
  } catch (error) {
    if (error.code === "API_KEY_MISSING") {
      record("Gemini fallback adapter", "PASS", "Missing API key produces API_KEY_MISSING for engine fallback.");
    } else fail("Gemini fallback adapter", `Unexpected adapter error: ${error.message}`);
  }

  const brief = await generateIntelligenceBrief(input, { mode: "DUMMY" });
  assertFields(brief.data, [
    "topic",
    "trend_score",
    "opportunity_score",
    "hook_ideas",
    "policy_risk",
    "knowledge_base_tags",
  ], "Intelligence brief");
  const content = await generateContentPackage({ ...input, tone: "professional", duration: "45 seconds" }, { mode: "DUMMY" });
  const clip = await generateClipPlan({
    sourceTitle: "Healthcheck Webinar",
    platform: "youtube",
    language: "id",
    contentObjective: "education",
    sourceType: "webinar_url",
    transcript: "A practical opening hook followed by actionable workflow steps.",
  }, { mode: "DUMMY" });
  const affiliate = await generateAffiliatePlan({
    productName: "Creator Toolkit",
    productCategory: "digital product",
    platform: "tiktok",
    targetAudience: "new creators",
    contentObjective: "conversion",
    language: "id",
  }, { mode: "DUMMY" });
  const publishing = await generatePublishingPackage({
    contentTitle: "Healthcheck Package",
    platform: "instagram",
    contentObjective: "education",
    language: "id",
    contentPackage: content.data,
  }, { mode: "DUMMY" });
  const analytics = await generatePerformanceRecommendation({
    platform: "instagram",
    niche: "creator economy",
    contentTitle: "Healthcheck Result",
    contentObjective: "education",
    views: 1200,
    likes: 90,
    comments: 12,
    shares: 8,
    retentionRate: 63,
  }, { mode: "DUMMY" });
  const orchestration = await orchestrateAgents({
    objective: "create a practical short video",
    platform: "TikTok",
    niche: "creator economy",
    targetAudience: "small business owners",
    contentType: "short-video",
  }, { mode: "DUMMY" });

  assertFields(content.data, ["title_options", "script", "scene_plan", "platform_metadata", "policy_check"], "Content package");
  assertFields(clip.data, ["best_segments", "policy_check", "export_checklist"], "Clip plan");
  assertFields(affiliate.data, ["product_score", "campaign_plan", "content_strategy"], "Affiliate plan");
  assertFields(publishing.data, ["publishing_status", "platform", "final_metadata", "approval_flow"], "Publishing package");
  assertFields(analytics.data, ["performance_summary", "recommendations", "knowledge_base_updates"], "Analytics recommendation");
  assertFields(orchestration, ["workflow_id", "execution_plan", "selected_agents", "outputs", "recommendations"], "Orchestration workflow");

  const payloads = { brief: brief.data, content: content.data, clip: clip.data, affiliate: affiliate.data, publishing: publishing.data, analytics: analytics.data, orchestration };
  const invalidScores = collectInvalidScores(payloads);
  if (invalidScores.length) fail("Engine score bounds", `Scores outside 0-100: ${invalidScores.join(", ")}`);
  else record("Structured engine contracts", "PASS", "All core engines and orchestration returned structured outputs.");
  if (!invalidScores.length) record("Engine score bounds", "PASS", "All structured score fields remain within 0-100.");

  const localFile = path.join(os.tmpdir(), `fvn-healthcheck-${Date.now()}.json`);
  const knowledgeInput = {
    category: "algorithm-knowledge",
    platform: "TikTok",
    niche: "creator economy",
    title: "Healthcheck pattern",
    content: "Use a clear hook before the explanation.",
    tags: ["healthcheck"],
    confidence_score: 81,
    source_type: "manual",
  };
  const local = await saveKnowledge(knowledgeInput, { disableDatabase: true, localFile });
  const found = await searchKnowledge("Healthcheck", { localFile, disableDatabase: true });
  if (local.storage === "local-json" && found.length) {
    record("Supabase local fallback", "PASS", "Knowledge Base used local JSON when database access was disabled.");
  } else fail("Supabase local fallback", "Knowledge Base local JSON fallback did not persist searchable data.");
  const memory = await saveKnowledge(knowledgeInput, { disableDatabase: true, disableLocalJson: true });
  if (memory.storage === "memory") record("Supabase memory fallback", "PASS", "Memory fallback is available.");
  else fail("Supabase memory fallback", "Memory fallback was not selected.");
  if (fs.existsSync(localFile)) fs.unlinkSync(localFile);

  const dummyApproval = await requestTelegramApproval({
    contentTitle: "Healthcheck Approval",
    platform: "TikTok",
    objective: "education",
    riskLevel: "low",
    metadataSummary: "Dummy request",
  }, { botToken: "", chatId: "" });
  if (dummyApproval.fallback && dummyApproval.approval.mode === "dummy") record("Telegram dummy approval", "PASS", "Missing token uses dummy approval.");
  else fail("Telegram dummy approval", "Missing token did not activate dummy approval.");

  const realApproval = await requestTelegramApproval({
    contentTitle: "Healthcheck Approval",
    platform: "TikTok",
    objective: "education",
    riskLevel: "low",
    metadataSummary: "Mocked real request",
  }, {
    botToken: "healthcheck-token",
    chatId: "healthcheck-chat",
    fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
  });
  if (!realApproval.fallback && realApproval.approval.mode === "telegram") record("Telegram real adapter", "PASS", "Mocked connected mode returned REAL metadata.");
  else fail("Telegram real adapter", "Mocked connected mode did not return REAL metadata.");

  const notifications = createFallbackPayload("NOTIFICATION_UNAVAILABLE", "Database unavailable, using empty notifications.", { notifications: [] });
  if (notifications.source === "fallback" && Array.isArray(notifications.notifications)) {
    record("Notification fallback contract", "PASS", "Notification fallback returns an empty list safely.");
  } else fail("Notification fallback contract", "Notification fallback contract is invalid.");
}

async function verifyRuntime() {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: root,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => serverLogs.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverLogs.push(chunk.toString()));

  try {
    if (!(await waitForServer())) {
      fail("Production runtime", `Next.js server did not become ready on ${baseUrl}.`);
      return;
    }
    record("Production runtime", "PASS", `Next.js production server is reachable on ${baseUrl}.`);

    const failedPages = [];
    for (const route of pageRoutes) {
      try {
        const response = await request(`${baseUrl}${route}`);
        if (response.status >= 400) failedPages.push(`${route} (${response.status})`);
      } catch (error) {
        failedPages.push(`${route} (${error.message})`);
      }
    }
    if (failedPages.length) fail("Runtime page routes", `Unsafe pages: ${failedPages.join(", ")}`);
    else record("Runtime page routes", "PASS", `${pageRoutes.length} sidebar routes return safe responses.`);

    const failedApis = [];
    for (const route of safeGetApis) {
      try {
        const response = await request(`${baseUrl}${route}`);
        if (route === "/api/health" && response.status === 503) {
          const payload = await response.json().catch(() => undefined);
          if (payload?.data?.app?.status === "ok" && payload?.data?.database?.status === "error") {
            warn("Supabase runtime fallback", "Database is offline; /api/health returned a structured 503 while the app remains available.", "Restore Supabase connectivity before enabling database-backed production workflows.");
            continue;
          }
        }
        if (response.status >= 500) failedApis.push(`${route} (${response.status})`);
      } catch (error) {
        failedApis.push(`${route} (${error.message})`);
      }
    }
    if (failedApis.length) fail("Runtime safe APIs", `Unsafe API responses: ${failedApis.join(", ")}`);
    else record("Runtime safe APIs", "PASS", `${safeGetApis.length} read endpoints return safe responses.`);

    const failedPostApis = [];
    for (const [route, body] of safePostApis) {
      try {
        const response = await request(`${baseUrl}${route}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), timeout: 12000 });
        const payload = await response.json().catch(() => undefined);
        if (response.status >= 500 || !payload?.success) failedPostApis.push(`${route} (${response.status})`);
      } catch (error) {
        failedPostApis.push(`${route} (${error.message})`);
      }
    }
    if (failedPostApis.length) fail("Runtime intelligence data APIs", `Unsafe API responses: ${failedPostApis.join(", ")}`);
    else record("Runtime intelligence data APIs", "PASS", `${safePostApis.length} opportunity endpoints return structured responses.`);

    const notificationResponse = await request(`${baseUrl}/api/notifications`);
    const notificationPayload = await notificationResponse.json();
    if (notificationResponse.status < 500 && Array.isArray(notificationPayload.notifications)) {
      record("Runtime notification fallback", "PASS", `Notifications endpoint returned source=${notificationPayload.source || "database"}.`);
    } else fail("Runtime notification fallback", "Notifications endpoint did not return a safe list.");
  } finally {
    server.kill();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const joinedLogs = serverLogs.join("\n");
  const runtimeError = joinedLogs.match(/UnhandledPromiseRejection|uncaughtException|ReferenceError:|TypeError:/i);
  if (runtimeError) {
    fail("Unhandled runtime errors", `Runtime logs contain ${runtimeError[0]}.`);
  } else {
    record("Unhandled runtime errors", "PASS", "No unhandled runtime exception signature was detected.");
  }
}

function writeReport() {
  const summary = {
    PASS: checks.filter((check) => check.status === "PASS").length,
    WARNING: checks.filter((check) => check.status === "WARNING").length,
    FAIL: checks.filter((check) => check.status === "FAIL").length,
  };
  const report = {
    generated_at: new Date().toISOString(),
    target_coverage: { automated: "80%", manual: "20%" },
    summary,
    blockers,
    recommendations: [...new Set(recommendations)],
    checks,
  };
  const reportsDirectory = path.join(root, "reports");
  fs.mkdirSync(reportsDirectory, { recursive: true });
  fs.writeFileSync(path.join(reportsDirectory, "healthcheck-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  const markdown = [
    "# FVN AI Studio Healthcheck Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    `- PASS: ${summary.PASS}`,
    `- WARNING: ${summary.WARNING}`,
    `- FAIL: ${summary.FAIL}`,
    "",
    "## Checks",
    ...checks.map((check) => `- ${check.status}: ${check.name} - ${check.detail}`),
    "",
    "## Blockers",
    ...(blockers.length ? blockers.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Recommendations",
    ...(report.recommendations.length ? report.recommendations.map((item) => `- ${item}`) : ["- None"]),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(reportsDirectory, "healthcheck-report.md"), markdown);
  console.log(`\nSummary: PASS=${summary.PASS} WARNING=${summary.WARNING} FAIL=${summary.FAIL}`);
  console.log("Reports: reports/healthcheck-report.json and reports/healthcheck-report.md");
  return summary;
}

async function main() {
  console.log("FVN AI Studio stabilization healthcheck\n");
  await verifyInventory();
  await verifyContracts();
  if (runBuild()) await verifyRuntime();
  else warn("Runtime smoke test", "Skipped because production build failed.", "Resolve production build errors before runtime QA.");
  const summary = writeReport();
  process.exitCode = summary.FAIL ? 1 : 0;
}

main().catch((error) => {
  fail("Healthcheck runner", error.stack || error.message);
  writeReport();
  process.exitCode = 1;
});
