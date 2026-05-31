# Changelog

## MVP Beta - 2026-05-31

### Added

- Recommendation Engine v2 for Creator and Affiliate workflows.
- Notification Center with dashboard counters and 60-second refresh.
- Telegram approval callback actions: approve, reject, and send back.
- Deployment documentation for GitHub, Vercel, VPS, and Supabase.
- Safe `ENV.example` template.
- Prompt Intelligence Center with provider playbooks, camera language, cinematic language, visual styles, and Creator/Affiliate templates.
- Intelligence Search Engine with quota-aware cache, source transparency, YouTube real-data adapter reuse, Google Trends demo adapter, Reddit OAuth foundation, and persisted data-driven analysis.
- YouTube quota estimate monitoring, Reddit server-side OAuth configuration status, persisted analysis detail pages, and reusable analysis filters.

### Changed

- Demo thumbnail sources now use deterministic placeholders instead of random image services.
- Telegram dashboard button is only sent for public HTTPS URLs.
- Security policy now requires credential rotation after local plaintext exposure.

### Security

- Removed local plaintext credential notes from the workspace.
- Expanded `.gitignore` to exclude local credential notes and environment variants.

### Database

- Added Prisma baseline migration `20260531202500_baseline_mvp_beta`.
- Archived pre-baseline migration history under `docs/database-history/pre-baseline-20260531` so `prisma/migrations` remains the only production migration source.
- Marked the baseline as applied on the synchronized Supabase database without executing destructive DDL.
