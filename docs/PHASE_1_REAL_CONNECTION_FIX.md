# Phase 1 Real Connection Fix

Date: 2026-06-13

## Objective

Make real-capable flows use real APIs or the database first, and make non-real sources explicit with `NOT CONNECTED` labels. Demo/sample data remains available only as a manual or fallback mode and must not be shown as real.

## REAL Menus And Flows

- Trending Center: YouTube Data API search uses `YOUTUBE_API_KEY` through the server route `/api/intelligence/youtube`.
- Intelligence Search: YouTube is selected by default and is treated as the only real public search source in Phase 1.
- Content Library: content is read from Prisma/Supabase records. Empty database now shows an empty state instead of auto-seeding sample content.
- Saved Opportunities: saves go to Prisma first. LocalStorage is only used when the database request fails.
- Creative Studio: status is `REAL` only when the selected provider returns a real provider response.

## NOT CONNECTED Menus And Flows

- Google Trends: not connected to a real endpoint. Manual fallback only.
- Reddit: optional and disabled unless connected separately. Missing Reddit credentials do not force global demo mode.
- TikTok, Shopee, Tokopedia, Lazada marketplace data: not connected to real APIs. Sample products are labeled `NOT CONNECTED - sample data`.
- Gemini/OpenAI failures: shown as `NOT CONNECTED`, with explicit provider errors.
- LocalStorage saved opportunities: shown as `Local Draft / NOT CONNECTED`.

## YouTube Real Flow Proof

- YouTube real results are mapped with `source: "youtube_real"`, `sourceStatus: "REAL"`, `status: "REAL"`, `isDemo: false`, and raw fields including `title`, `channelTitle`, `publishedAt`, `viewCount`, `likeCount`, `commentCount`, and `videoUrl` via `sourceUrl`.
- `/api/intelligence/youtube` rejects missing keywords, returns YouTube API errors without demo results, and guards responses with `assertNoDemoAsReal`.
- Trending Center does not load demo recommendations after successful YouTube search. Demo fallback is only opened through explicit user action.
- Smoke test: `/api/intelligence/youtube?keyword=AI%20tools&regionCode=ID&maxResults=1&order=relevance` returned HTTP 200, `status: READY`, `source: youtube_real`, `sourceStatus: REAL`, `status: REAL`, `isDemo: false`, and YouTube public metrics.
- Smoke test: `/api/intelligence/recommendations?source=real` returned 2 recommendations, `demoCount: 0`, and sources `youtube_real`.

## Fallback Behavior

- YouTube API missing/error/quota: shows `YouTube API gagal atau quota habis. Data real tidak tersedia.` and returns no dummy cards.
- Gemini timeout: shows `Gemini API timeout. Provider belum stabil.`
- OpenAI quota/billing: shows `OpenAI quota/billing error. Provider belum tersedia.`
- Product marketplace API unavailable: shows `Marketplace API not connected. Showing NOT CONNECTED sample data only.`
- Content Library empty: shows empty state; no automatic `DEMO_SAMPLE` insertion.

## Main Files Changed

- `lib/intelligence/source-utils.ts`
- `lib/intelligence/types.ts`
- `lib/intelligence/service.ts`
- `lib/intelligence/youtube.ts`
- `app/api/intelligence/youtube/route.ts`
- `app/trending-center/page.tsx`
- `components/intelligence-search-panel.tsx`
- `app/ai-analysis/page.tsx`
- `app/api/ai-analysis/generate/route.ts`
- `app/api/content/save-from-analysis/route.ts`
- `lib/library-service.ts`
- `app/library/page.tsx`
- `app/library/[id]/page.tsx`
- `lib/intelligence/affiliate-persistence.ts`
- `app/api/affiliate/opportunities/route.ts`
- `app/creative-studio/page.tsx`
- `app/api/creative/generate/route.ts`
- `components/affiliate/product-intelligence-center.tsx`
- `components/affiliate/product-opportunity-cards.tsx`
- `app/winning-products/page.tsx`
- `app/api/affiliate/product-intelligence/route.ts`
- `lib/affiliate/product-intelligence.ts`
- `lib/intelligence/products.ts`
- `lib/intelligence/google-trends.ts`
- `lib/intelligence/search-engine/adapters/demo-tiktok-adapter.ts`
- `lib/intelligence/search-engine/adapters/demo-marketplace-adapter.ts`
- `lib/demo/demoRecommendations.ts`

## Test Result

- `npm run lint`: passed, no ESLint warnings or errors.
- `npm run build`: passed after stopping a stale local Next dev server that locked `.next/trace`.
- Local API smoke test: passed for YouTube real endpoint and real-only recommendations.
