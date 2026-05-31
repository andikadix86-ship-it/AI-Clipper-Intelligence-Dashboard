# Roadmap

## MVP Beta Ready

- Creator content operations workflow
- Affiliate campaign database workflow
- Content Library, Approval Queue, Scheduler, Publishing Center
- Notification Center
- Recommendation Engine v2 deterministic scoring
- Telegram approval callback foundation
- Provider Settings with masked credential handling
- YouTube Data foundation and Google Trends demo adapter
- AI Team workflow foundation

## Manual Or Demo In MVP Beta

- Marketplace product intelligence
- Commission tracking
- TikTok, Instagram, and Facebook publishing
- Some image/video provider adapters
- Telegram webhook registration
- Performance input after manual publishing

## Recommended Next

1. Rotate local credentials and push clean baseline to GitHub.
2. Validate the committed Prisma baseline on a staging Supabase project before the next schema change.
3. Deploy dashboard to Vercel and media worker to VPS if FFmpeg processing is required.
4. Register Telegram webhook against production HTTPS URL.
5. Validate one real provider at a time.
