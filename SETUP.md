# MVP Beta Setup

## 1. Prerequisites

- Node.js LTS
- npm
- Supabase project
- Git dan GitHub repository kosong

## 2. Local Installation

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma db push
npm run dev
```

Buka `http://localhost:3000`.

## 3. Environment

Salin `ENV.example` atau `.env.example` menjadi `.env`. Jangan commit `.env`.

Gunakan:

- `DATABASE_URL`: Supabase pooler untuk runtime.
- `DIRECT_URL`: direct/session connection untuk schema management.
- `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` saat lokal dan URL HTTPS publik saat production.
- Provider/OAuth/Telegram credential: opsional. Jika kosong, aplikasi tetap jalan dengan dummy/manual mode.
- `ENCRYPTION_KEY`: wajib diisi nilai panjang dan unik sebelum menyimpan credential production.

## 4. Supabase

1. Buat project Supabase.
2. Ambil pooler URL dan direct URL dari database settings.
3. Isi `.env`.
4. Jalankan `npx prisma db push` untuk MVP Beta internal.
5. Buat Storage bucket: `videos`, `thumbnails`, `outputs`, `subtitles`.
6. Backup database sebelum perubahan schema.

Schema MVP Beta sudah dibaseline pada migration `20260531202500_baseline_mvp_beta`. Untuk deployment berikutnya gunakan `npx prisma migrate deploy`. Migration historis sebelum baseline tetap tersedia sebagai arsip referensi di `prisma/migrations_legacy_pre_baseline_20260531`.

## 5. GitHub Source Of Truth

Workspace belum otomatis memiliki remote GitHub. Setelah rotasi credential:

```bash
git init
git add .
git status
git commit -m "Prepare MVP beta"
git branch -M main
git remote add origin <github-repository-url>
git push -u origin main
```

Sebelum commit, pastikan `.env`, folder `API_KEY/`, log, PID, dan file credential lokal tidak muncul pada `git status`.

## 6. Vercel

1. Import repository GitHub di Vercel.
2. Gunakan preset Next.js.
3. Set environment variable di Vercel Dashboard.
4. Gunakan `npm install` sebagai install command.
5. Gunakan `npm run build` sebagai build command.
6. Deploy lalu cek `GET /api/health`.

Jangan menjalankan upload media berat di serverless tanpa storage/worker terpisah. Untuk clipper FFmpeg intensif, VPS atau worker adalah target produksi yang lebih tepat.

## 7. VPS

```bash
git clone <github-repository-url>
cd <repository-folder>
npm install
npx prisma generate
npm run build
npm install -g pm2
pm2 start npm --name ai-clipper -- start
pm2 save
```

## 8. Production Smoke Test

1. Cek `/api/health`.
2. Buat project.
3. Generate asset dummy atau real.
4. Cek Content Library.
5. Kirim content ke Approval Queue.
6. Approve, schedule, dan manual publish.
7. Cek notification bell serta analytics.
8. Buat campaign affiliate dan generate content factory output.
