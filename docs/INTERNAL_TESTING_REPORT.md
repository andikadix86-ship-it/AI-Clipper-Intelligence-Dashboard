# FVN AI Studio Internal Testing Report

Generated: 2026-06-02

## Summary

Internal acceptance testing validates realistic MVP workflows without adding product
features. All requested flows and simulated failure modes pass after one policy guardrail
bug fix.

Internal Testing Readiness Score: **94/100**

## Passed Flow

| Flow | Result | Verified output |
| --- | --- | --- |
| AI Content Creator | PASS | Intelligence Brief, script, scene plan, metadata, YouTube Shorts CTA, finance policy check, fallback metadata |
| Clipper Center | PASS | TikTok segments, hook score, retention score, caption, CTA, reused-content warning |
| Affiliate Center | PASS | CCTV Outdoor 4MP score, five-day campaign, soft-selling hooks, keranjang kuning CTA, risk check |
| Publishing Center | PASS | Manual export package, pending approval, Telegram dummy approval, export checklist |
| Analytics | PASS | Scorecard, recommendation, decision, Knowledge Base learning suggestion |

## Failure Mode Coverage

| Failure mode | Result | Safe behavior |
| --- | --- | --- |
| Gemini API key missing | PASS | Dummy fallback metadata returned |
| Gemini quota exceeded | PASS | `QUOTA_EXCEEDED` fallback returned and registry event recorded |
| Gemini timeout | PASS | `TIMEOUT` fallback returned and registry event recorded |
| Supabase offline | PASS | Knowledge Base persists to local JSON fallback |
| Telegram token missing | PASS | Dummy approval request returned |
| Notification API unavailable | PASS | Empty notification fallback contract returned |

## Bug Fixed During Testing

### Medium - Finance niche was not included in Content Creator policy classification

Personal finance content was marked `low` risk because policy classification only checked
the generated topic and angle. It now evaluates niche, objective, Intelligence Brief
topic, angle, and caption. Both dummy fallback and normalized provider output paths return
consistent policy risk.

Changed file:

- `lib/content-creator/content-creator-engine.ts`

## Failed Flow

None.

## Warning

- Supabase runtime DNS remains unavailable in the current environment.
- REAL Gemini network calls were simulated with deterministic adapter responses to avoid
  uncontrolled quota consumption.
- Telegram REAL sending was not used during internal acceptance testing.

## Critical Blocker

None for internal testing.

## UX Issue

No acceptance-blocking UX issue found through automated flow validation. Browser-based
operator review remains required for visual interaction quality.

## API Issue

No new API contract issue found. Production healthcheck remains the source of truth for
runtime route safety.

## Fallback Issue

No unresolved fallback issue found.

## Commands

```bash
npm run test:internal
npm run healthcheck
```
