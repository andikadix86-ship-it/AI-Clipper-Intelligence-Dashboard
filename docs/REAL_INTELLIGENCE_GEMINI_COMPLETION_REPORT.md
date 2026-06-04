# Real Intelligence Layer and Gemini Integration Report

## Scope

The final intelligence layer is implemented under `lib/intelligence/` because this
Next.js repository uses a root-level `lib` convention rather than `src/lib`.
No sidebar menu or backend feature was removed.

## Intelligence Data Sources

The shared adapter contract is exposed through `lib/intelligence/data-sources/`.

| Source | Real mode | Fallback |
| --- | --- | --- |
| Google Trends | Configured endpoint via `GOOGLE_TRENDS_API_URL` | Deterministic dummy trend signal |
| YouTube Data API | YouTube search response via `YOUTUBE_API_KEY` | Deterministic dummy trend signal |
| Reddit Trend Research | OAuth search response via `REDDIT_ACCESS_TOKEN` | Deterministic dummy trend signal |
| Internal Knowledge Base | Layered Knowledge Base repository | Empty or deterministic fallback signal |

The aggregate contract contains:

`source`, `keyword`, `niche`, `platform`, `trend_score`,
`opportunity_score`, `competition_score`, `confidence_score`,
`recommended_topics`, `rising_keywords`, `declining_keywords`,
`collected_at`, source-level `signals`, and Knowledge Base `feedback`.

All scores are clamped to `0-100`. Dummy fallback signals are visible to the UI
but are not persisted into the Knowledge Base learning loop.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /api/intelligence/trends` | Final trend aggregation endpoint |
| `POST /api/intelligence/opportunities` | Final content opportunity endpoint |
| `POST /api/intelligence/affiliate-opportunities` | Affiliate opportunity endpoint |
| `POST /api/intelligence/trend-aggregate` | Backward-compatible trend endpoint |

## Gemini Provider Coverage

The centralized Gemini provider is consumed by:

- Intelligence Engine
- AI Content Creator Engine
- Clipper Engine
- Affiliate Engine
- Publishing Engine
- Analytics Engine

Each engine returns safe metadata with `provider`, `mode`, optional
`error_reason`, and `generated_at`. Missing keys, quota errors, timeouts,
invalid provider responses, provider offline errors, and explicit dummy mode
activate structured fallback output rather than throwing into the UI.

## Automated Verification

- `npm run typecheck`
- `npm run lint`
- `npm run test:data-layer`
- `npm run test:gemini`
- `npm run test:integration`
- `npm run test:audit`
- `npm run test:internal`
- `npm run healthcheck`

## Remaining Configuration

Real external calls require valid production environment variables:

- `GEMINI_API_KEY`
- `GOOGLE_TRENDS_API_URL`
- `YOUTUBE_API_KEY`
- `REDDIT_ACCESS_TOKEN`
- Supabase credentials for persistent database-backed Knowledge Base storage

When these variables or external services are unavailable, the application
remains usable in fallback mode.

