# FVN AI Studio - Real Connection Audit

Audit date: 2026-06-13

Audit rules used:

- Only `REAL` and `NOT CONNECTED` are used.
- A menu is `REAL` only when the primary user-visible flow reads/writes real Prisma/Supabase data or calls a real provider API successfully.
- If demo, dummy, mock, static, localStorage, or fallback data can appear as the primary visible result for that menu, the menu is marked `NOT CONNECTED`.
- Runtime working status is based on the local running app health/provider endpoints, not only `.env` presence.

## Summary

* Total menus audited: 16
* REAL: 3
* NOT CONNECTED: 13
* Real Connection Score: 18.75%

REAL menus:

- Dashboard
- Scheduler
- Approval / Telegram

NOT CONNECTED menus:

- Projects
- Trending Center / Intelligence Center
- AI Analysis
- Clipper Workflow
- Creative Studio
- Content Library
- Social Accounts
- Analytics
- Settings
- Prompt Center
- Affiliate Center
- Product Intelligence / Recommendation Engine
- Saved Opportunities

## API Key / Env Readiness

Runtime checks used:

- `GET /api/health`: database `ok`; YouTube source `real`; Google Trends `disabled`; Reddit `disabled`; Gemini env `real` by key presence.
- `GET /api/providers/status`: Telegram Bot `Ready`; YouTube OAuth `Ready`; Gemini `Error` with timeout; OpenAI `Error` with quota; TikTok OAuth `Not Configured`; Meta OAuth `Not Configured`.
- `GET /api/intelligence/youtube?keyword=AI%20tools&regionCode=ID&maxResults=1`: returned `READY` with 1 real YouTube result.

| Service | Env Name | Exists in .env.example | Used in Code | Real Endpoint Working | Status |
| --- | --- | --- | --- | --- | --- |
| YouTube Data API | `YOUTUBE_API_KEY` | Yes | Yes | Yes | REAL |
| YouTube Data API alias | `YOUTUBE_DATA_API_KEY` | Yes | Yes | No, absent in current `.env`; `YOUTUBE_API_KEY` is used instead | NOT CONNECTED |
| Google Trends | `GOOGLE_TRENDS_API_URL` | Yes | Yes | No | NOT CONNECTED |
| Gemini API | `GEMINI_API_KEY` | Yes | Yes | No, last runtime provider test timed out | NOT CONNECTED |
| OpenAI API | `OPENAI_API_KEY` | Yes | Yes | No, last runtime provider test hit quota/billing error | NOT CONNECTED |
| Supabase Database | `DATABASE_URL` / `DIRECT_URL` | Yes | Yes | Yes | REAL |
| Google OAuth / YouTube OAuth | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes | Yes | Yes, provider status is Ready | REAL |
| TikTok OAuth | `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | Yes | Yes | No, provider status is Not Configured/DUMMY | NOT CONNECTED |
| Meta OAuth | `META_APP_ID` / `META_APP_SECRET` | Yes | Yes | No, provider status is Not Configured/DUMMY | NOT CONNECTED |
| Reddit OAuth | `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | Yes | Yes | No, runtime health reports Reddit disabled/optional | NOT CONNECTED |
| Telegram Bot | `TELEGRAM_BOT_TOKEN` | Yes | Yes | Yes, provider status is Ready | REAL |
| Shopee Source | Shopee related env/API | No | No | No | NOT CONNECTED |
| Tokopedia Source | Tokopedia related env/API | No | No | No | NOT CONNECTED |

## Menu Connection Audit Table

| Menu | Status | Current Data Source | API/DB Used | Demo/Mock Indicators Found | Files | Required Fix |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | REAL | Prisma operational counts and recent audit data | Prisma/Supabase | Empty fallback only when DB fails | `app/api/dashboard/operations/route.ts`, `components/dashboard-home.tsx` | Keep fallback as explicit error/empty state only. |
| Projects | NOT CONNECTED | Prisma projects, but dummy projects are returned when DB table is empty | Prisma/Supabase | `dummyProjects` used as primary result when no rows exist | `app/api/projects/route.ts`, `lib/dummy-creative.ts`, `app/projects/page.tsx` | Return empty state when DB has no projects; move dummy projects behind explicit demo mode. |
| Trending Center / Intelligence Center | NOT CONNECTED | YouTube real search plus demo Google Trends/TikTok/marketplace and static workspace metrics | YouTube Data API, Prisma cache, demo adapters | Demo Google Trends, Product Hunter demo source, hardcoded Intelligence Center stats | `app/trending-center/page.tsx`, `app/api/trending/route.ts`, `lib/intelligence/service.ts`, `components/centers/intelligence-center-workspace.tsx` | Make real source first across all visible panels; demo only via explicit user-selected fallback. |
| AI Analysis | NOT CONNECTED | Default sample trend and generated recommendation fields; optional provider call | Gemini/OpenAI via `runTextWorkflow`, Prisma job log | `defaultTrend`, `isDemo: true`, default provider mode `DUMMY`, sample input notes | `app/ai-analysis/page.tsx`, `app/api/ai-analysis/generate/route.ts`, `lib/text-ai-service.ts` | Require real trend payload or explicit demo selection; default to real provider mode only when provider test passes. |
| Clipper Workflow | NOT CONNECTED | Local upload/fallback clips and Gemini fallback plan | Prisma, local file fallback, optional Gemini | `fallbackClips`, `demoPlaceholder`, dummy clip plan | `app/clipper/page.tsx`, `app/api/clips/generate/route.ts`, `lib/media/processor.ts`, `lib/clipper/clipper-engine.ts` | Separate local/demo clip suggestions from real media processing; show empty/error on provider failure. |
| Creative Studio | NOT CONNECTED | Provider adapters plus dummy provider fallback; generated assets saved to DB | Prisma, Gemini/OpenAI adapters | `dummyProvider`, dummy preview/fallback, Veo video adapter not implemented | `app/creative-studio/page.tsx`, `app/api/creative/generate/route.ts`, `lib/providers/dummy.ts`, `lib/providers/gemini.ts`, `lib/providers/openai.ts` | Block or clearly label real generation until provider test succeeds; do not save dummy as provider output. |
| Content Library | NOT CONNECTED | Prisma content items seeded from fallback demo library when empty | Prisma/Supabase | `ensureLibrarySeed()` creates `fallbackLibraryItems` with `DEMO_SAMPLE` | `lib/library-service.ts`, `lib/content-library.ts`, `app/library/page.tsx`, `app/api/library/route.ts` | Stop auto-seeding demo content as normal library data; show empty state or explicit demo import. |
| Scheduler | REAL | Prisma `postingSchedule` rows and campaign-plan draft schedules | Prisma/Supabase | Empty DB fallback only; legacy TEST labels exist | `app/api/scheduler/route.ts`, `lib/scheduler-service.ts`, `app/schedule/page.tsx`, `app/api/affiliate/schedules/route.ts` | Keep TEST/DEMO labels visible; connect publish APIs separately from scheduling. |
| Social Accounts | NOT CONNECTED | Prisma CRUD for accounts, but detail view and OAuth/publishing are not fully real | Prisma/Supabase, prepared OAuth routes | Detail fallback account, dummy analytics, TikTok/Meta OAuth not configured, real upload disabled | `app/social-accounts/page.tsx`, `app/social-accounts/[id]/page.tsx`, `app/api/social-accounts/route.ts`, `lib/social-oauth-flow.ts` | Keep manual DB account manager, but remove dummy detail analytics and require connected OAuth before calling accounts real. |
| Analytics | NOT CONNECTED | Prisma/manual analytics when rows exist, otherwise fallback sample metrics | Prisma/Supabase, rule-based recommendations | `fallbackMetrics`, dummy/rule-based analyst insight, sample tables | `app/analytics/dashboard/page.tsx`, `lib/analytics/analytics-engine.ts`, `components/centers/analytics-center-workspace.tsx` | Use empty/manual-input state when no real/manual metrics; do not display sample KPIs as current analytics. |
| Settings | NOT CONNECTED | Main settings page is frontend-only preview; provider subpage reads env/DB | Prisma/Supabase for `/settings/providers`; local browser preview for `/settings` | Dummy credits, frontend-only settings, local preview | `app/settings/page.tsx`, `components/centers/settings-branding-workspace.tsx`, `app/settings/providers/page.tsx` | Make main Settings persist to DB or clearly split it as Preview; keep Provider Settings as the real configuration page. |
| Prompt Center | NOT CONNECTED | Static prompt knowledge library | None for main data | Static arrays/templates in `lib/prompt-intelligence.ts` | `app/prompt-center/page.tsx`, `lib/prompt-intelligence.ts` | Persist templates/guides in DB or label as static internal library. |
| Affiliate Center | NOT CONNECTED | Product Intelligence plus hardcoded center stats/modules and marketplace demo sources | Prisma/Supabase for manual/CSV products; no marketplace API | Hardcoded stats, "clean dummy signals", marketplace not connected | `app/affiliate-center/page.tsx`, `components/centers/affiliate-center-workspace.tsx`, `components/affiliate/product-intelligence-center.tsx` | Remove hardcoded stats as primary truth; show source status per panel and connect real marketplace/import/manual data only. |
| Product Intelligence / Recommendation Engine | NOT CONNECTED | Manual/CSV/DB product layer exists, but demo fallback and marketplace stubs remain | Prisma/Supabase; no Shopee/Tokopedia API | Demo product fallback, `sourceType: DEMO`, demo marketplace/TikTok adapters | `app/api/affiliate/product-intelligence/route.ts`, `lib/affiliate/product-intelligence.ts`, `lib/intelligence/products.ts`, `app/api/intelligence/recommendations/route.ts` | Keep MANUAL/CSV_IMPORT as valid; make DEMO explicit and never use it as active source when real/manual/CSV data exists. |
| Saved Opportunities | NOT CONNECTED | Prisma route exists, but UI/client merges DB rows with localStorage fallback rows | Prisma/Supabase plus localStorage | `Local Draft`, localStorage opportunity/campaign fallback | `lib/intelligence/affiliate-persistence.ts`, `lib/intelligence/action-flow.ts`, `app/trending-center/page.tsx`, `app/api/affiliate/opportunities/route.ts` | For production mode, do not merge localStorage records into active DB view; require migration or show separate local draft panel. |
| Approval / Telegram | REAL | Prisma approval queue and Telegram bot runtime | Prisma/Supabase, Telegram Bot API | Separate dummy/in-memory approval helper exists | `app/approval/page.tsx`, `app/api/approval/route.ts`, `lib/telegram-service.ts`, `lib/approval/telegram-approval.ts` | Keep real Telegram route primary; isolate dummy approval helper behind explicit demo/test mode. |

## Detailed Findings

### Dashboard

* Status: REAL
* Current data source: Operational summary from Prisma counts and recent audit log rows.
* API/database used: `prisma.contentItem`, `prisma.postingSchedule`, `prisma.aIAgent`, `prisma.auditLog`, `prisma.notification`.
* Demo/mock/local fallback found: Empty fallback summary only when database fails.
* Files:
  * `app/api/dashboard/operations/route.ts`
  * `components/dashboard-home.tsx`
* Required fix: Keep fallback explicit as an error/empty state; do not add sample KPI data.

### Projects

* Status: NOT CONNECTED
* Current data source: Prisma project rows when present; `dummyProjects` when table is empty or DB fails.
* API/database used: Prisma/Supabase for create and list.
* Demo/mock/local fallback found: `dummyProjects` from `lib/dummy-creative.ts` returned by `GET /api/projects` when no real rows exist.
* Files:
  * `app/api/projects/route.ts`
  * `app/projects/page.tsx`
  * `lib/dummy-creative.ts`
* Required fix: Return an empty state for zero DB rows; expose dummy projects only through explicit demo mode.

### Trending Center / Intelligence Center

* Status: NOT CONNECTED
* Current data source: YouTube real search works, but the menu still contains demo Google Trends, demo product hunter, and static Intelligence Center workspace metrics.
* API/database used: YouTube Data API, Prisma cache tables, demo adapters for Google Trends/TikTok/Shopee/Tokopedia.
* Demo/mock/local fallback found: Google Trends demo adapter, manual demo dataset adapters, demo product hunter, hardcoded stats.
* Files:
  * `app/trending-center/page.tsx`
  * `app/api/trending/route.ts`
  * `app/api/intelligence/search/route.ts`
  * `app/api/intelligence/google-trends/route.ts`
  * `app/api/intelligence/products/route.ts`
  * `app/api/intelligence/recommendations/route.ts`
  * `lib/intelligence/service.ts`
  * `lib/intelligence/google-trends.ts`
  * `lib/intelligence/search-engine/intelligence-search-service.ts`
  * `lib/intelligence/search-engine/adapters/google-trends-adapter.ts`
  * `lib/intelligence/search-engine/adapters/demo-tiktok-adapter.ts`
  * `lib/intelligence/search-engine/adapters/demo-marketplace-adapter.ts`
  * `components/intelligence-search-panel.tsx`
  * `components/centers/intelligence-center-workspace.tsx`
* Required fix: Keep YouTube as default real result when available; disable automatic demo cards after real search; make Google Trends and marketplace cards explicit demo only until real API exists.

### AI Analysis

* Status: NOT CONNECTED
* Current data source: Default sample trend and generated fields; optional provider call can run but default UI uses `DUMMY`.
* API/database used: `runTextWorkflow`, Gemini/OpenAI provider adapters, Prisma generation job log.
* Demo/mock/local fallback found: `defaultTrend` with `AI Automation`, `isDemo: true`, `Sample analysis input`, dummy provider mode.
* Files:
  * `app/ai-analysis/page.tsx`
  * `app/api/ai-analysis/generate/route.ts`
  * `lib/text-ai-service.ts`
* Required fix: Require real trend/intelligence input or explicit demo mode; make default provider mode follow provider readiness and fail visibly in real mode.

### Clipper Workflow

* Status: NOT CONNECTED
* Current data source: Local media upload and fallback clip suggestions.
* API/database used: Prisma media/video records, local file fallback, optional Gemini clip plan.
* Demo/mock/local fallback found: `fallbackClips`, `demoPlaceholder`, dummy clip plan, local upload fallback.
* Files:
  * `app/clipper/page.tsx`
  * `app/api/clips/generate/route.ts`
  * `app/api/clips/process/route.ts`
  * `app/api/clipper/plan/route.ts`
  * `lib/media/processor.ts`
  * `lib/clipper/clipper-engine.ts`
  * `lib/dummy-clips.ts`
  * `lib/demo-placeholder.ts`
* Required fix: Separate local demo clip suggestions from real processor output; show API/storage errors instead of returning generated fallback clips as active results.

### Creative Studio

* Status: NOT CONNECTED
* Current data source: Provider adapter output saved to Prisma; dummy provider fallback remains active and visible as generated output.
* API/database used: Prisma generation jobs/assets/content items; Gemini/OpenAI provider adapters.
* Demo/mock/local fallback found: `dummyProvider`, dummy preview, dummy fallback, Gemini Veo video/motion not implemented.
* Files:
  * `app/creative-studio/page.tsx`
  * `app/api/creative/generate/route.ts`
  * `lib/providers/index.ts`
  * `lib/providers/dummy.ts`
  * `lib/providers/gemini.ts`
  * `lib/providers/openai.ts`
  * `lib/dummy-creative.ts`
* Required fix: For real mode, fail with clear provider error until the provider test is `READY`; keep dummy preview behind explicit user selection.

### Content Library

* Status: NOT CONNECTED
* Current data source: Prisma content library, but the library is auto-seeded from fallback demo items if empty.
* API/database used: Prisma/Supabase.
* Demo/mock/local fallback found: `ensureLibrarySeed()` calls `fallbackLibraryItems`, `DEMO_SAMPLE`, item detail fallback.
* Files:
  * `lib/library-service.ts`
  * `lib/content-library.ts`
  * `app/api/library/route.ts`
  * `app/api/library/[id]/route.ts`
  * `app/library/page.tsx`
  * `app/library/[id]/page.tsx`
* Required fix: Do not auto-create demo library records as normal data; use empty state or explicit demo import.

### Scheduler

* Status: REAL
* Current data source: Prisma `postingSchedule` rows; campaign-plan schedules are saved as draft rows.
* API/database used: Prisma/Supabase.
* Demo/mock/local fallback found: Empty fallback only on DB failure; legacy TEST detection exists.
* Files:
  * `app/api/scheduler/route.ts`
  * `app/api/affiliate/schedules/route.ts`
  * `lib/scheduler-service.ts`
  * `app/schedule/page.tsx`
* Required fix: Keep TEST/DEMO/CAMPAIGN_PLAN labels visible; connect actual publish APIs separately from scheduling.

### Social Accounts

* Status: NOT CONNECTED
* Current data source: Prisma account CRUD exists, but account detail includes dummy analytics and external OAuth/publishing is not fully active.
* API/database used: Prisma/Supabase for account storage; prepared OAuth routes for YouTube/TikTok/Meta.
* Demo/mock/local fallback found: `fallbackAccount`, `dummyAnalytics`, TikTok/Meta OAuth provider status not configured, publish adapters warn real upload disabled.
* Files:
  * `app/social-accounts/page.tsx`
  * `app/social-accounts/[id]/page.tsx`
  * `app/api/social-accounts/route.ts`
  * `lib/social-oauth-flow.ts`
  * `lib/publishing/tiktok.ts`
  * `lib/publishing/instagram.ts`
  * `lib/publishing/facebook.ts`
* Required fix: Remove dummy analytics from account detail or label it TEST; require connected OAuth token before showing account as real connected.

### Analytics

* Status: NOT CONNECTED
* Current data source: Prisma/manual analytics when real rows exist; otherwise sample fallback metrics and rule-based insights.
* API/database used: Prisma/Supabase; no external analytics API.
* Demo/mock/local fallback found: `fallbackMetrics`, hardcoded table rows, dummy/rule-based analyst card.
* Files:
  * `app/analytics/dashboard/page.tsx`
  * `components/centers/analytics-center-workspace.tsx`
  * `components/centers/analytics-engine-panel.tsx`
  * `lib/analytics/analytics-engine.ts`
  * `lib/recommendation-service.ts`
* Required fix: Show "manual input required" or empty state when no performance rows exist; do not show sample metrics as active analytics.

### Settings

* Status: NOT CONNECTED
* Current data source: Main Settings page is frontend-only preview; Provider Settings subpage uses env/Prisma.
* API/database used: Prisma/env for `/settings/providers`; local browser state for `/settings`.
* Demo/mock/local fallback found: Dummy credits, dummy settings groups, local preview only.
* Files:
  * `app/settings/page.tsx`
  * `components/centers/settings-branding-workspace.tsx`
  * `app/settings/providers/page.tsx`
  * `app/api/settings/google-oauth/route.ts`
  * `app/api/settings/oauth-providers/route.ts`
  * `app/api/settings/intelligence-providers/route.ts`
* Required fix: Persist main settings to DB or label page as preview; keep provider settings as server-only secret management.

### Prompt Center

* Status: NOT CONNECTED
* Current data source: Static in-code prompt knowledge and templates.
* API/database used: None for primary content.
* Demo/mock/local fallback found: Static arrays/templates.
* Files:
  * `app/prompt-center/page.tsx`
  * `lib/prompt-intelligence.ts`
* Required fix: Move prompt templates/guides to DB or label as static internal knowledge base.

### Affiliate Center

* Status: NOT CONNECTED
* Current data source: Product Intelligence component plus hardcoded stats/modules and workflow panels.
* API/database used: Prisma/Supabase for product/manual/CSV/campaign/account flows.
* Demo/mock/local fallback found: Hardcoded stats, "clean dummy signals", marketplace API not connected status.
* Files:
  * `app/affiliate-center/page.tsx`
  * `components/centers/affiliate-center-workspace.tsx`
  * `components/affiliate/product-intelligence-center.tsx`
  * `components/affiliate/affiliate-workflow-panels.tsx`
  * `components/centers/affiliate-engine-panel.tsx`
* Required fix: Make every panel derive numbers from selected source or DB; label modules without real provider as MVP Preview/NOT CONNECTED.

### Product Intelligence / Recommendation Engine

* Status: NOT CONNECTED
* Current data source: Manual/CSV/DB products are supported, but demo fallback and marketplace stubs remain.
* API/database used: Prisma/Supabase product intelligence table; no Shopee/Tokopedia real API.
* Demo/mock/local fallback found: Demo product insights, demo marketplace/TikTok adapters, `Marketplace API not connected. Showing demo data only.`
* Files:
  * `app/api/affiliate/product-intelligence/route.ts`
  * `lib/affiliate/product-intelligence.ts`
  * `lib/affiliate/product-scoring.ts`
  * `lib/affiliate/product-content-strategy.ts`
  * `lib/affiliate/product-campaign-planner.ts`
  * `components/affiliate/product-intelligence-center.tsx`
  * `components/affiliate/product-opportunity-cards.tsx`
  * `lib/intelligence/products.ts`
  * `lib/intelligence/recommendation-engine.ts`
* Required fix: Keep MANUAL/CSV_IMPORT/REAL_API source selection; remove demo as active fallback whenever any non-demo source exists; add real marketplace connector before claiming marketplace data is real.

### Saved Opportunities

* Status: NOT CONNECTED
* Current data source: Prisma saved opportunities plus localStorage fallback merged into the same UI list.
* API/database used: Prisma/Supabase route exists.
* Demo/mock/local fallback found: `localStorage`, `Local Draft`, client-side fallback campaign/opportunity storage.
* Files:
  * `app/api/affiliate/opportunities/route.ts`
  * `lib/intelligence/affiliate-persistence.ts`
  * `lib/intelligence/action-flow.ts`
  * `app/trending-center/page.tsx`
* Required fix: Separate local drafts from DB-backed opportunities and make production active view DB-only unless user explicitly opens Local Drafts.

### Approval / Telegram

* Status: REAL
* Current data source: Approval queue from Prisma content items and Telegram bot runtime.
* API/database used: Prisma/Supabase and Telegram Bot API.
* Demo/mock/local fallback found: Standalone `lib/approval/telegram-approval.ts` can create in-memory dummy approvals if Telegram is not configured.
* Files:
  * `app/approval/page.tsx`
  * `app/api/approval/route.ts`
  * `app/api/approval/telegram/route.ts`
  * `lib/telegram-service.ts`
  * `lib/approval/telegram-approval.ts`
  * `components/centers/telegram-approval-queue.tsx`
* Required fix: Keep real Telegram approval as primary flow; isolate dummy/in-memory approval route as explicit test/demo mode.

## Global Files Still Using Demo/Mock

Scan scope: `app`, `components`, `lib`, `prisma`, `scripts`, `tests`. This list contains every file matched by the audit indicators (`demo`, `dummy`, `mock`, `sample`, `example`, `fallback`, `localStorage`, `Local Draft`, hardcoded/demo terms, and named demo products/topics). Some matches are safe error handling or tests, but every file below should be reviewed before production mode is claimed.

```text
app/agents/[id]/page.tsx
app/ai-analysis/page.tsx
app/analysis/[id]/page.tsx
app/analytics/dashboard/page.tsx
app/api/affiliate/campaigns/route.ts
app/api/affiliate/generated-content/route.ts
app/api/affiliate/opportunities/route.ts
app/api/affiliate/plan/route.ts
app/api/affiliate/product-intelligence/route.ts
app/api/affiliate/schedules/route.ts
app/api/agents/center/route.ts
app/api/agents/orchestrate/route.ts
app/api/ai-analysis/generate/route.ts
app/api/analytics/recommendation/route.ts
app/api/approval/history/route.ts
app/api/approval/route.ts
app/api/assets/collections/route.ts
app/api/auth/youtube/callback/route.ts
app/api/auth/youtube/refresh/route.ts
app/api/automation-plans/route.ts
app/api/clipper/plan/route.ts
app/api/clips/generate/route.ts
app/api/clips/process/route.ts
app/api/content/create-similar/route.ts
app/api/content/save-from-analysis/route.ts
app/api/content/save-similar/route.ts
app/api/content-creator/generate/route.ts
app/api/creative/generate/route.ts
app/api/dashboard/operations/route.ts
app/api/generate/image/route.ts
app/api/generate/motion/route.ts
app/api/generate/video/route.ts
app/api/intelligence/analyses/route.ts
app/api/intelligence/brief/route.ts
app/api/intelligence/google-trends/route.ts
app/api/intelligence/recommendations/route.ts
app/api/intelligence/youtube-quota/route.ts
app/api/knowledge-base/route.ts
app/api/library/[id]/route.ts
app/api/library/route.ts
app/api/media/jobs/route.ts
app/api/media/upload/route.ts
app/api/notifications/route.ts
app/api/projects/[id]/route.ts
app/api/projects/route.ts
app/api/providers/route.ts
app/api/providers/status/route.ts
app/api/providers/test/meta/route.ts
app/api/providers/test/route.ts
app/api/providers/test/telegram/route.ts
app/api/providers/test/tiktok/route.ts
app/api/providers/test/youtube/route.ts
app/api/publishing/package/route.ts
app/api/publishing/providers/route.ts
app/api/publishing/route.ts
app/api/publishing/start/route.ts
app/api/recommendations/route.ts
app/api/scheduler/route.ts
app/api/settings/google-oauth/route.ts
app/api/settings/intelligence-providers/route.ts
app/api/settings/oauth-providers/route.ts
app/api/social-accounts/route.ts
app/api/video/preview/route.ts
app/campaigns/[id]/page.tsx
app/campaigns/page.tsx
app/clipper/page.tsx
app/content-factory/page.tsx
app/creative-studio/page.tsx
app/library/[id]/page.tsx
app/library/page.tsx
app/projects/[id]/page.tsx
app/projects/page.tsx
app/publishing/page.tsx
app/schedule/page.tsx
app/settings/providers/page.tsx
app/social-accounts/[id]/page.tsx
app/social-accounts/page.tsx
app/trending-center/page.tsx
app/winning-products/page.tsx
components/affiliate/affiliate-workflow-panels.tsx
components/affiliate/campaign-creation-modal.tsx
components/affiliate/product-intelligence-center.tsx
components/affiliate/product-opportunity-cards.tsx
components/affiliate-content-factory.tsx
components/analysis-detail-actions.tsx
components/branding-engine.tsx
components/centers/affiliate-center-workspace.tsx
components/centers/affiliate-engine-panel.tsx
components/centers/agent-orchestration-panel.tsx
components/centers/ai-agents-workspace.tsx
components/centers/analytics-center-workspace.tsx
components/centers/analytics-engine-panel.tsx
components/centers/integrations-center-workspace.tsx
components/centers/intelligence-brief-panel.tsx
components/centers/intelligence-center-workspace.tsx
components/centers/knowledge-base-workspace.tsx
components/centers/publishing-center-workspace.tsx
components/centers/publishing-engine-panel.tsx
components/centers/real-intelligence-panel.tsx
components/centers/settings-branding-workspace.tsx
components/centers/system-health-panel.tsx
components/centers/telegram-approval-queue.tsx
components/clipper-center/clip-intelligence-grid.tsx
components/clipper-center/clipper-engine-panel.tsx
components/clipper-center/policy-guardrail.tsx
components/clipper-center/recent-clip-projects.tsx
components/clipper-center/source-panel.tsx
components/content-creator/content-creator-engine-panel.tsx
components/dashboard/ai-agents-panel.tsx
components/dashboard-home.tsx
components/intelligence-search-panel.tsx
components/notification-center.tsx
components/provider-runtime-status.tsx
components/recent-analysis-list.tsx
components/studio-section-page.tsx
components/workspace-mode.tsx
lib/affiliate/affiliate-engine.ts
lib/affiliate/product-campaign-planner.ts
lib/affiliate/product-content-strategy.ts
lib/affiliate/product-intelligence.ts
lib/affiliate/product-scoring.ts
lib/agent-service.ts
lib/agents/ceo-agent.ts
lib/agents/orchestration-types.ts
lib/agents/orchestrator.ts
lib/analytics/analytics-engine.ts
lib/api-response.ts
lib/approval/telegram-approval.ts
lib/clipper/clipper-engine.ts
lib/content-creator/content-creator-engine.ts
lib/content-library.ts
lib/demo/demoRecommendations.ts
lib/demo-placeholder.ts
lib/dummy-clips.ts
lib/dummy-creative.ts
lib/env.ts
lib/fallback-contract.ts
lib/intelligence/action-flow.ts
lib/intelligence/affiliate-persistence.ts
lib/intelligence/analysis-engine/data-driven-engine.ts
lib/intelligence/analysis-engine/recommendation-builder.ts
lib/intelligence/analysis-engine/repository.ts
lib/intelligence/analysis-engine/risk-analysis.ts
lib/intelligence/analysis-engine/types.ts
lib/intelligence/data-layer/adapters.ts
lib/intelligence/data-layer/aggregator.ts
lib/intelligence/data-layer/fallback-data.ts
lib/intelligence/data-layer/feedback-loop.ts
lib/intelligence/data-layer/opportunities.ts
lib/intelligence/data-layer/types.ts
lib/intelligence/google-trends.ts
lib/intelligence/intelligence-engine.ts
lib/intelligence/knowledge-base.ts
lib/intelligence/products.ts
lib/intelligence/provider-settings.ts
lib/intelligence/recommendation-engine.ts
lib/intelligence/reddit-oauth.ts
lib/intelligence/scoring.ts
lib/intelligence/search-engine/adapters/demo-marketplace-adapter.ts
lib/intelligence/search-engine/adapters/demo-tiktok-adapter.ts
lib/intelligence/search-engine/adapters/google-trends-adapter.ts
lib/intelligence/search-engine/adapters/reddit-adapter.ts
lib/intelligence/search-engine/adapters/youtube-adapter.ts
lib/intelligence/search-engine/intelligence-search-service.ts
lib/intelligence/search-engine/normalization.ts
lib/intelligence/search-engine/types.ts
lib/intelligence/service.ts
lib/intelligence/source-status.ts
lib/intelligence/source-utils.ts
lib/intelligence/types.ts
lib/knowledge-base/repository.ts
lib/library-service.ts
lib/media/processor.ts
lib/media/subtitle.ts
lib/notification-service.ts
lib/observability/error-registry.ts
lib/observability/system-health.ts
lib/prompt-intelligence.ts
lib/provider-status.ts
lib/provider-test-service.ts
lib/providers/dummy.ts
lib/providers/gemini-client.ts
lib/providers/gemini.ts
lib/providers/index.ts
lib/providers/luma.ts
lib/providers/openai.ts
lib/providers/pika.ts
lib/providers/runway.ts
lib/providers/structured-text.ts
lib/providers/types.ts
lib/publishing/facebook.ts
lib/publishing/instagram.ts
lib/publishing/publishing-engine.ts
lib/publishing/tiktok.ts
lib/publishing/youtube.ts
lib/publishing-job-service.ts
lib/publishing-service.ts
lib/recommendation-service.ts
lib/scheduler-service.ts
lib/social-oauth-flow.ts
lib/telegram-service.ts
lib/text-ai-service.ts
lib/types.ts
prisma/migrations/20260531202500_baseline_mvp_beta/migration.sql
prisma/migrations/20260531225500_intelligence_search_engine/migration.sql
prisma/migrations/20260603114000_product_intelligence_engine/migration.sql
prisma/migrations/20260612120000_product_source_type_normalization/migration.sql
prisma/schema.prisma
scripts/healthcheck.cjs
tests/core-engine.integration.test.cjs
tests/final-integration.audit.test.cjs
tests/gemini-real-integration.test.cjs
tests/internal-testing.acceptance.test.cjs
tests/real-intelligence-data-layer.test.cjs
```

Named demo/static indicators confirmed:

- `Portable Mini Blender`, `Magnetic Car Holder`, `Nuvo Family Soap Hijau`, and `Sunscreen Spray SPF 50` are in `lib/intelligence/products.ts`.
- `AI Automation`, `Product Visual AI`, and `Podcast Highlights` are in demo/default intelligence inputs.
- `example.com` remains in tests/placeholders, including `tests/core-engine.integration.test.cjs` and `components/clipper-center/source-panel.tsx`.

## Final Real Connection Score

* Total menu: 16
* Jumlah REAL: 3
* Jumlah NOT CONNECTED: 13
* Persentase koneksi real aplikasi: 18.75%

Formula:

`Real Connection Score = REAL menu / Total menu x 100%`

`3 / 16 x 100% = 18.75%`

## Priority Fix Plan

### 1. Critical

Menu yang terlihat seperti real tapi masih dapat menampilkan demo/mock sebagai hasil utama:

1. Content Library: stop `ensureLibrarySeed()` from creating demo content as normal library data.
2. Projects: stop returning `dummyProjects` when the real table is empty.
3. Trending Center / Intelligence Center: keep YouTube real results as active data and prevent demo cards from appearing automatically after real search succeeds.
4. Product Intelligence / Recommendation Engine: ensure DEMO is never active when MANUAL, CSV_IMPORT, or REAL_API exists.
5. Analytics: remove fallback sample metrics from the active dashboard; show manual-input/empty state instead.
6. Social Accounts: remove dummy analytics/fallback account from account detail or mark it TEST.

### 2. High

Menu utama yang harus memakai API/database real:

1. Trending Center: connect Google Trends real endpoint or keep it disabled; keep TikTok/Shopee/Tokopedia as explicit demo until real APIs exist.
2. Creative Studio: make real mode strict; Gemini/OpenAI failures should return visible errors, not dummy outputs saved as active assets.
3. Affiliate Center: replace hardcoded stats with Product Intelligence source summary and DB counts.
4. Content Library: convert demo seed data into explicit optional demo import.
5. Scheduler: keep DB-backed schedule flow; add real publishing status only after OAuth upload is connected.
6. Social Accounts: finish real OAuth validation and remove fake detail analytics.
7. Analytics: connect real/manual performance data only; no fallback sample KPIs.

### 3. Medium

Menu pendukung:

1. Dashboard: keep it database-only and retain empty fallback as explicit warning.
2. Projects: DB-only list plus empty state.
3. Prompt Center: move static templates to DB or clearly label as static internal knowledge.
4. Settings: persist main settings to DB or label the page as frontend preview; keep provider secrets server-side only.

