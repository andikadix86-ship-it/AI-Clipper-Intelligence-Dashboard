# Security Policy

## Secret Handling

- Jangan commit `.env`, production credentials, OAuth token, API key, atau database password.
- Jangan simpan credential dalam file `.txt`, folder `API_KEY/`, screenshot, atau dokumen project.
- Jangan expose API key/token ke client component, browser console, atau response API.
- Semua input secret di UI harus menggunakan `type="password"` atau masked value.
- Gunakan `ENCRYPTION_KEY` yang panjang dan unik untuk production. Rotasi key/token jika ada indikasi bocor.
- Jangan log `DATABASE_URL`, API key, OAuth token, Telegram bot token, access token, refresh token, atau client secret.

## Production Checklist

- Jalankan aplikasi hanya lewat HTTPS di production.
- Set environment variable langsung di VPS, PM2 ecosystem, Docker secret, atau Vercel Dashboard.
- Gunakan Supabase pooler untuk runtime `DATABASE_URL`.
- Gunakan `DIRECT_URL` hanya untuk Prisma migration/deploy.
- Aktifkan backup Supabase berkala dan uji restore secara periodik.
- Batasi akses ke server/VPS dengan SSH key, firewall, dan user non-root.
- Rotasi token OAuth/API jika laptop, repository, atau server pernah terekspos.

## Storage

Supabase Storage bucket yang perlu tersedia:

- `videos`
- `thumbnails`
- `outputs`
- `subtitles`

Gunakan policy yang sesuai kebutuhan production. Jangan membuat bucket public untuk asset sensitif tanpa review.

## Incident Response

1. Cabut atau rotasi key/token yang bocor.
2. Update env production.
3. Restart aplikasi.
4. Audit `AuditLog`, `PublishingLog`, dan provider logs.
5. Review access log server/Vercel/Supabase.

## Required Rotation Before Production

Audit MVP Beta menemukan credential plaintext pada file catatan lokal dan file tersebut sudah dihapus dari workspace. Sebelum deployment atau push pertama ke GitHub:

1. Rotasi OpenAI API key yang pernah tersimpan lokal.
2. Rotasi Supabase database password dan secret key yang pernah tersimpan lokal.
3. Periksa `.env` aktif dan update dengan credential baru.
4. Pastikan file sensitif tidak masuk staging Git.
