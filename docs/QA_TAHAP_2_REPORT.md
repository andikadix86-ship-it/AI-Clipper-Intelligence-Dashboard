# QA Tahap 2 Report

Tanggal QA: 2026-06-02  
Scope: Dashboard -> Upload Video -> AI Analysis -> Generate Metadata -> Content Library

## Ringkasan

Workflow Tahap 2 stabil pada mode development dan fallback. Tidak ditemukan crash, white screen, atau file upload lokal yatim setelah persistence gagal.

Verifikasi persistence Supabase real dan refresh data real masih **BLOCKED** karena `.env` memakai hostname placeholder:

- `DATABASE_URL`: `aws-xxx.pooler.supabase.com`
- `DIRECT_URL`: `aws-xxx.pooler.supabase.com`

Aplikasi mendeteksi konfigurasi tersebut sebelum Prisma membuka koneksi dan mengembalikan error yang jelas.

## Fitur Yang Dites

| Fitur | Hasil | Catatan |
| --- | --- | --- |
| Start dev server dengan `npm run dev` | PASS | Next.js ready pada port QA `3022`. |
| Dashboard | PASS | `/dashboard` mengembalikan `200`. Feature card Clipper menuju `/clipper`. |
| Clipper Workflow | PASS | `/clipper` mengembalikan `200`. Sidebar active-state mencakup `/clipper`. |
| Pilih file upload | PASS | Input menerima `.mp4`, `.mov`, `.webm`, `.mkv`. |
| Validasi format video | PASS | File non-video ditolak dengan `400`. |
| Upload loading/progress | PASS | UI memakai `XMLHttpRequest.upload.progress`, progress bar, dan spinner. |
| Upload metadata ke Supabase | BLOCKED | Upload video valid return `503` terstruktur karena hostname Supabase placeholder. |
| Cleanup upload gagal | PASS | File lokal dibersihkan; orphan count `0`. |
| AI Analysis mode dummy eksplisit | PASS | Endpoint return `200`, metadata lengkap, badge mode `DUMMY`. |
| Generate metadata | PASS | Title, hook, caption, hashtag, description, dan CTA tersedia. |
| CTA YouTube Shorts | PASS | Like, subscribe, comment, watch next. |
| CTA TikTok affiliate | PASS | Follow, like, save, comment, keranjang kuning. |
| CTA Instagram Reels | PASS | Save, share, follow, DM/comment. |
| CTA Facebook Reels | PASS | Share, comment, follow Page, group, WhatsApp. |
| REAL provider tidak fallback diam-diam | PASS | Provider REAL belum siap return `502`; response menyatakan tidak ada dummy fallback. |
| Content Library | PASS | `/library` mengembalikan `200`; fallback kosong tampil aman. |
| Content Library refresh | PASS untuk fallback | Dua request berturut-turut return empty fallback yang konsisten. |
| Refresh data Supabase real | BLOCKED | Membutuhkan hostname Supabase asli. |
| Loading, error, empty state | PASS | Clipper dan Library memiliki state eksplisit. |

## Hasil Smoke Test

```text
page./dashboard=200
page./clipper=200
page./ai-analysis=200
page./library=200
upload.invalid=400
upload.valid-db-offline=503
library.first.source=fallback items=0
library.refresh.source=fallback items=0
upload.cleanup.orphans=0
realStrict=502
```

## Bug Yang Ditemukan

### Pesan REAL strict kontradiktif

Saat provider REAL belum siap, workflow sudah berhenti dengan `502` dan tidak menghasilkan output dummy. Namun detail error masih mewarisi teks lama `Dummy fallback used`, sehingga operator dapat salah membaca status.

## Bug Yang Diperbaiki

`lib/text-ai-service.ts` sekarang menghasilkan pesan strict yang konsisten:

```text
Provider REAL belum siap. Periksa API key dan status provider sebelum menjalankan AI Analysis.
```

Response endpoint:

```text
AI Analysis REAL gagal. Tidak ada dummy fallback yang digunakan.
```

## File Yang Diubah Saat QA

- `lib/text-ai-service.ts`
- `docs/QA_TAHAP_2_REPORT.md`

## File Workflow Tahap 2 Yang Diverifikasi

- `app/clipper/page.tsx`
- `app/ai-analysis/page.tsx`
- `app/library/page.tsx`
- `app/api/media/upload/route.ts`
- `app/api/ai-analysis/generate/route.ts`
- `app/api/library/route.ts`
- `lib/media/upload-policy.ts`
- `lib/text-ai-service.ts`

## Pemeriksaan Build

Sebelum laporan QA dibuat:

```text
npm run lint       PASS
npm run typecheck  PASS
npx prisma validate PASS
npm run build      PASS
npm run healthcheck PASS=18 WARNING=1 FAIL=0
```

Warning tunggal adalah Supabase offline karena konfigurasi placeholder.

## Sisa Pekerjaan Berikutnya

1. Ganti `DATABASE_URL` dan `DIRECT_URL` dengan hostname Supabase pooler asli.
2. Ulangi upload video valid sampai endpoint return `200`.
3. Jalankan AI Analysis dari `videoSourceId` hasil upload dan pastikan Draft tersimpan.
4. Refresh `/library` dan pastikan Draft yang sama tetap tampil dari Supabase.
5. Jalankan Gemini REAL strict dengan credential aktif dan pantau quota.

## Status Trial

**Siap trial fallback/local.**

**Belum siap trial persistence Supabase real** sampai environment database asli tersedia.
