# FVN AI Studio Stabilization Checklist

Run the automated audit with:

```bash
npm run healthcheck
```

The command builds the production app, starts a temporary Next.js production server,
checks sidebar routes and safe read endpoints, validates engine contracts, and writes:

- `reports/healthcheck-report.json`
- `reports/healthcheck-report.md`

## Automated Coverage - 80%

- [ ] Sidebar route inventory and runtime responses
- [ ] API handler inventory and safe read endpoint responses
- [ ] Gemini REAL adapter with an isolated mock response
- [ ] Gemini dummy fallback when the API key is missing
- [ ] Supabase local JSON and memory fallback
- [ ] Notification empty-list fallback contract and runtime endpoint
- [ ] Telegram REAL adapter mock and dummy approval fallback
- [ ] Structured Intelligence, Creator, Clipper, Affiliate, Publishing, Analytics, and Orchestration outputs
- [ ] Score fields remain within 0-100
- [ ] Production build succeeds
- [ ] Runtime logs do not expose unhandled exception signatures

## Manual QA - 20%

Use the dashboard in a browser after `npm run dev`.

- [ ] Generate Intelligence Brief
- [ ] Generate AI Content
- [ ] Generate Clip Plan
- [ ] Generate Affiliate Plan
- [ ] Generate Publishing Package
- [ ] Generate Analytics Recommendation
- [ ] Test Approval Dummy
- [ ] Test Knowledge Base Search

## Report Interpretation

- `PASS`: verified automatically.
- `WARNING`: fallback is active or a manual follow-up is recommended.
- `FAIL`: blocker that must be fixed before release.

Provider network health remains environment-specific. The healthcheck verifies adapter
behavior without sending real content, Telegram messages, or Gemini requests.
