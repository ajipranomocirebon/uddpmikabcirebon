-- ===================================================================
-- PETADONOR — Setup tabel penyimpanan terpusat di Supabase
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> tempel
-- semua isi file ini -> klik Run (cukup 1x saja, saat setup pertama).
-- ===================================================================

-- Satu tabel "key-value": tiap baris = 1 kumpulan data (master, kegiatan,
-- kecamatan, parameter, zona, user), disimpan sebagai JSON. Ini sengaja
-- dibuat sederhana (bukan banyak tabel relasional) supaya cocok dgn
-- struktur data aplikasi yang sudah ada, tanpa perlu menulis ulang
-- seluruh logika aplikasi.
create table if not exists app_kv (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Aktifkan Row Level Security (wajib di Supabase modern -- tanpa ini
-- tabel tidak bisa diakses sama sekali dari aplikasi).
alter table app_kv enable row level security;

-- Izinkan siapa saja yang bawa "anon key" aplikasi ini (yaitu aplikasi
-- PetaDonor kamu sendiri) untuk baca & tulis ke tabel ini. Catatan
-- keamanan: gerbang login (Administrator/User 1/User 2) di aplikasi ini
-- levelnya tampilan (UI), BUKAN penegakan keamanan di sisi database --
-- siapa pun yang punya anon key (terlihat di kode frontend) bisa
-- membaca/menulis tabel ini langsung. Untuk aplikasi internal skala
-- kecil ini biasanya cukup aman, tapi kalau nanti datanya makin
-- sensitif, langkah lanjutannya adalah pindah ke Supabase Auth +
-- policy per-user (bisa kita kerjakan kapan saja).
create policy "app_kv_select" on app_kv for select using (true);
create policy "app_kv_insert" on app_kv for insert with check (true);
create policy "app_kv_update" on app_kv for update using (true) with check (true);
