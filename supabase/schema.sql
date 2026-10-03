-- Jalankan seluruh file ini di Supabase > SQL Editor.

create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default '',
  seats int default 4,
  driver text default '',
  description text default '',
  image_url text default '',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text default '',
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

alter table cars enable row level security;
alter table articles enable row level security;
alter table settings enable row level security;
alter table admins enable row level security;

-- Tamu: hanya baca. Admin: baca/tulis semua.
create policy "cars read" on cars for select using (active or is_admin());
create policy "cars write" on cars for all using (is_admin()) with check (is_admin());
create policy "articles read" on articles for select using (true);
create policy "articles write" on articles for all using (is_admin()) with check (is_admin());
create policy "settings read" on settings for select using (true);
create policy "settings write" on settings for all using (is_admin()) with check (is_admin());
create policy "admins self" on admins for select using (user_id = auth.uid());

-- Bucket gambar (publik untuk dibaca, hanya admin yang boleh mengunggah)
insert into storage.buckets (id, name, public) values ('images', 'images', true)
on conflict (id) do nothing;
create policy "images insert" on storage.objects for insert with check (bucket_id = 'images' and is_admin());
create policy "images update" on storage.objects for update using (bucket_id = 'images' and is_admin());
create policy "images delete" on storage.objects for delete using (bucket_id = 'images' and is_admin());

-- Data awal
insert into settings (key, value) values
  ('wa', '"6281234567890"'),
  ('banner', '{"title":"Perjalanan Nyaman, Tanpa Repot","sub":"Pesan mobil dengan sopir berpengalaman. Cukup beberapa langkah, lalu lanjut lewat WhatsApp.","img":""}')
on conflict (key) do nothing;

insert into cars (name, type, seats, driver, description) values
  ('Toyota Avanza', 'MPV', 6, 'Termasuk sopir', 'Nyaman untuk keluarga, AC dingin, bagasi luas.'),
  ('Toyota Innova Reborn', 'MPV Premium', 7, 'Termasuk sopir', 'Kursi lega, cocok untuk perjalanan jauh.'),
  ('Toyota Alphard', 'Van Mewah', 6, 'Termasuk sopir', 'Kursi captain seat, sangat nyaman.');

insert into articles (title, body) values
  ('5 Tips Perjalanan Jauh yang Nyaman', E'1. Istirahat setiap 2 jam agar badan tidak pegal.\n2. Bawa air minum dan obat pribadi.\n3. Duduk dengan bantal penyangga punggung.\n4. Beri tahu sopir tujuan dan rencana berhenti.\n5. Berangkat pagi supaya jalanan lebih lancar.'),
  ('Cara Memesan Mobil di Jackpot', 'Pilih mobil yang Anda suka, tekan tombol Pesan, isi tanggal dan tujuan, lalu tekan Kirim ke WhatsApp. Admin kami akan membalas untuk konfirmasi jadwal.');

-- SETELAH membuat user admin di Authentication > Users, jadikan admin dengan:
-- insert into admins (user_id) select id from auth.users where email = 'EMAIL_ADMIN_ANDA';
