# FVN AI Studio Healthcheck Report

Generated: 2026-06-02T13:32:45.755Z

- PASS: 18
- WARNING: 1
- FAIL: 0

## Checks
- PASS: Sidebar route inventory - 12 sidebar pages are present.
- PASS: API endpoint inventory - 144 API route handlers have exported methods.
- PASS: Gemini real adapter - Mocked REAL mode returned a Gemini response.
- PASS: Gemini fallback adapter - Missing API key produces API_KEY_MISSING for engine fallback.
- PASS: Structured engine contracts - All core engines and orchestration returned structured outputs.
- PASS: Engine score bounds - All structured score fields remain within 0-100.
- PASS: Supabase local fallback - Knowledge Base used local JSON when database access was disabled.
- PASS: Supabase memory fallback - Memory fallback is available.
- PASS: Telegram dummy approval - Missing token uses dummy approval.
- PASS: Telegram real adapter - Mocked connected mode returned REAL metadata.
- PASS: Notification fallback contract - Notification fallback returns an empty list safely.
- PASS: Production build - npm run build completed successfully.
- PASS: Production runtime - Next.js production server is reachable on http://127.0.0.1:3017.
- PASS: Runtime page routes - 12 sidebar routes return safe responses.
- WARNING: Supabase runtime fallback - Database is offline; /api/health returned a structured 503 while the app remains available.
- PASS: Runtime safe APIs - 17 read endpoints return safe responses.
- PASS: Runtime intelligence data APIs - 3 opportunity endpoints return structured responses.
- PASS: Runtime notification fallback - Notifications endpoint returned source=fallback.
- PASS: Unhandled runtime errors - No unhandled runtime exception signature was detected.

## Blockers
- None

## Recommendations
- Restore Supabase connectivity before enabling database-backed production workflows.
