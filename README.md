# Jackpot – Pemesanan Mobil (React + Supabase + Vercel)

Tamu mengisi nama (disimpan di localStorage), memilih mobil, lalu pesanan diteruskan ke WhatsApp admin. Admin mengelola mobil, artikel, banner, dan nomor WhatsApp dari menu **Admin** di footer.

## 1. Siapkan Supabase
1. Buat project di https://supabase.com.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**. Ini membuat tabel, aturan keamanan (RLS), bucket gambar `images`, dan data contoh.
3. Buka **Authentication > Users > Add user**, buat akun admin (email + kata sandi, centang *Auto Confirm*).
4. Di SQL Editor jalankan (ganti emailnya):
   ```sql
   insert into admins (user_id) select id from auth.users where email = 'EMAIL_ADMIN_ANDA';
   ```
5. Disarankan: **Authentication > Sign In / Providers > matikan "Allow new users to sign up"**.
6. Salin **Project URL** dan **anon public key** dari **Project Settings > API**.

## 2. Jalankan lokal
```bash
cp .env.example .env     # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## 3. Deploy ke Vercel
Proyek ini sudah dilengkapi `vercel.json` (Vite, folder `dist`, fallback SPA, dan header keamanan), jadi tidak perlu pengaturan build manual.

**Lewat GitHub (disarankan)**
1. Upload folder ini ke GitHub, lalu di Vercel pilih **Add New > Project** dan impor repo tersebut (framework Vite terdeteksi otomatis).
2. Di **Environment Variables** isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
3. Klik **Deploy**. Setiap `git push` berikutnya otomatis terbit ulang.

**Lewat Vercel CLI (tanpa GitHub)**
```bash
npm i -g vercel
vercel            # ikuti pertanyaan, lalu tambahkan env:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

Setelah terbit, buka `https://domain-anda.vercel.app`, masuk lewat **Admin** di footer, lalu ganti nomor WhatsApp di tab *Banner & WhatsApp*.

## Keamanan
Kunci `anon` memang publik. Yang melindungi data adalah RLS di `schema.sql`: semua orang hanya bisa membaca, sedangkan menulis (mobil, artikel, pengaturan, unggah gambar) hanya untuk user yang ada di tabel `admins`.
