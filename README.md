# AI Clipper Intelligence Dashboard

Dashboard SaaS dark mode untuk content operations:
Dashboard -> Projects -> Trending Center -> AI Analysis -> Content Library -> Clipper Workflow / Creative Studio -> Approval -> Scheduler -> Publishing Center -> Analytics.

## MVP Beta Status

- Creator workflow aktif dari intelligence, asset generation, approval, scheduler, publishing manual, hingga analytics.
- Affiliate workflow aktif untuk demo product intelligence, campaign database, content factory, dan handoff ke Creative Studio.
- Data demo selalu diberi label. Thumbnail fallback memakai placeholder deterministic, bukan gambar random.
- OpenAI text, Gemini generation, YouTube data, Telegram, OAuth, dan FFmpeg hanya menjadi real jika credential serta mode real tersedia.
- TikTok, Instagram, Facebook publishing, marketplace commission tracking, dan beberapa provider video masih preparation/manual.

## Install

```bash
npm install
npx prisma generate
```

## Setup Supabase

1. Buat project Supabase dan ambil connection string PostgreSQL.
2. Gunakan pooler transaction untuk runtime Next.js (`DATABASE_URL`).
3. Gunakan direct/session connection untuk Prisma migration (`DIRECT_URL`).
4. Pastikan SSL aktif. Runtime Prisma memakai pool singleton dan SSL `rejectUnauthorized: false` agar aman untuk pooler Supabase di Windows.
5. Buat Supabase Storage bucket berikut jika memakai upload/clipper workflow: `videos`, `thumbnails`, `outputs`, `subtitles`.

## Setup `.env`

Buat `.env` di root project. Semua nilai ini hanya untuk server, jangan expose ke client component.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&sslmode=require&uselibpqcompat=true&connection_limit=1"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require&uselibpqcompat=true"

# Optional. Jika kosong, aplikasi tetap jalan di dummy/manual mode.
OPENAI_API_KEY=""
GEMINI_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/youtube/callback"
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""
TIKTOK_REDIRECT_URI="http://localhost:3000/api/auth/tiktok/callback"
META_APP_ID=""
META_APP_SECRET=""
META_REDIRECT_URI="http://localhost:3000/api/auth/meta/callback"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
ENCRYPTION_KEY=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Secret juga bisa disimpan dari menu Settings. UI hanya menampilkan masked value, bukan token asli.

Untuk Telegram approval, gunakan chat ID admin atau grup yang sudah mengirim `/start` ke bot. Jangan memakai bot ID sebagai `TELEGRAM_CHAT_ID`. Tombol `Open Dashboard` hanya ditambahkan pada pesan Telegram jika `NEXT_PUBLIC_APP_URL` memakai URL publik HTTPS.

## Database

Development:

```bash
npx prisma validate
npx prisma generate
npx prisma db push
```

Production dengan migration:

```bash
npx prisma generate
npx prisma migrate deploy
```

Database MVP Beta sudah memiliki baseline migration `20260531202500_baseline_mvp_beta`. Gunakan `npx prisma migrate deploy` untuk deployment berikutnya. Migration historis sebelum baseline disimpan sebagai arsip referensi di `docs/database-history/pre-baseline-20260531` dan tidak dibaca oleh Prisma CLI.

## Run Lokal

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Deployment Modes

### A. Localhost Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Gunakan `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

### B. VPS Deployment

Contoh setup Node.js LTS + PM2:

```bash
git clone <repo-url>
cd ai-clipper-intelligence-dashboard
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm install -g pm2
pm2 start npm --name ai-clipper -- start
pm2 save
```

Set env variable di server, PM2 ecosystem file, atau secret manager. Jangan upload `.env` ke GitHub.

### C. Vercel Deployment

Project cocok untuk Vercel selama semua provider real dipanggil dari route server dan database memakai Supabase pooler.

- Set semua env variable di Vercel Dashboard.
- `DATABASE_URL` gunakan Supabase pooler/transaction connection.
- `DIRECT_URL` dipakai untuk migration/db push dari development atau CI yang aman.
- Jalankan `npx prisma migrate deploy` di deployment pipeline jika migration tersedia.
- Jangan commit `.env`, `.env.local`, atau credential ke repository.
- Pastikan `NEXT_PUBLIC_APP_URL` memakai domain Vercel/production.
- Build command: `npm run build`.
- Install command: `npm install`.
- Framework preset: Next.js.

### D. Supabase Cloud Database

- Gunakan Supabase PostgreSQL untuk database utama.
- Gunakan Supabase Storage bucket: `videos`, `thumbnails`, `outputs`, `subtitles`.
- Backup database sebelum migration besar.
- Untuk Windows runtime, Supabase pooler + SSL sudah didukung oleh Prisma singleton di aplikasi ini.

## Health Check

Endpoint production:

```text
GET /api/health
```

Response berisi status app, database, provider mode, dan timestamp. Tidak ada secret yang ditampilkan.

## Dummy Mode vs Real Mode

- Dummy/manual mode aktif jika API key, OAuth credential, token, FFmpeg, atau provider real belum tersedia.
- OpenAI text workflow dapat memakai real API jika provider OpenAI diset `REAL` dan key tersedia.
- Settings memiliki Provider Test Center untuk OpenAI, Gemini, Telegram, YouTube OAuth, TikTok OAuth, dan Meta OAuth.
- OpenAI/Gemini test memakai server route dan mencatat hasil ke `GenerationJob`/`AuditLog`; jika key kosong atau error, dummy fallback tetap aktif.
- Creative image/video provider selain OpenAI masih adapter-ready dan fallback dummy.
- Clipper memakai FFmpeg jika tersedia; jika tidak, job tetap berjalan dengan dummy processing.
- YouTube OAuth dan upload Shorts disiapkan server-side. Upload real hanya jalan setelah admin klik Publish Now dan semua syarat approval/token/video terpenuhi.
- TikTok, Instagram, dan Facebook masih OAuth preparation dan dummy publishing provider.
- Tidak ada auto-posting tanpa approval admin.

## Security Notes

- API key, token, OAuth secret, dan database URL tidak pernah dikirim mentah ke client.
- Secret input di Settings memakai field password dan response API mengembalikan masked value.
- Jangan simpan credential di file catatan, screenshot, atau folder lokal yang ikut masuk repository.
- Semua route Prisma memakai Node.js runtime.
- Response API baru mengikuti format standar:

```json
{
  "success": true,
  "message": "Action completed.",
  "data": {}
}
```

Route lama tetap diberi field legacy seperti `project`, `providers`, atau `error` agar UI existing tidak rusak.

## Workflow Aplikasi

1. Buat Project untuk niche, brand, atau campaign.
2. Tambahkan Social Account dan hubungkan ke Project.
3. Cari trend di Trending Center.
4. Kirim trend ke AI Analysis.
5. Simpan hasil analisis ke Project sebagai ContentItem Draft.
6. Kirim content ke Review, lalu Approve atau Reject.
7. Content Approved masuk Scheduler.
8. Publishing Center membantu manual/semi-auto/auto-ready posting.
9. Mark as Posted dan input performance manual.
10. Analytics, Dashboard, Agent, dan Recommendation membaca data performance.

## Checklist Testing

```bash
npx prisma validate
npx prisma generate
npx prisma db push
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Smoke test route:

- `/`
- `/projects`
- `/trending-center`
- `/ai-analysis`
- `/clipper`
- `/creative-studio`
- `/library`
- `/schedule`
- `/publishing`
- `/social-accounts`
- `/analytics`
- `/settings`
- `/api/health`

Dokumentasi tambahan:

- [`SETUP.md`](./SETUP.md)
- [`SECURITY.md`](./SECURITY.md)
- [`ROADMAP.md`](./ROADMAP.md)
- [`CHANGELOG.md`](./CHANGELOG.md)

Write flow yang perlu dites:

- Create Project
- Save provider/OAuth settings
- Approve Content
- Create Schedule
- Mark as Posted
- Provider Test
- YouTube Publish Now guard/error handling
