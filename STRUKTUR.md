# Struktur Kode — PetaDonor v3 (dirapikan)

Sebelumnya semua HTML, CSS, dan ~1100 baris JavaScript menumpuk jadi satu
file `index.html` (± 1800 baris). Sekarang dipecah jadi beberapa file kecil
per fungsi, isinya **sama persis** (sudah dicek — tidak ada kode yang
hilang/berubah), hanya susunannya yang dirapikan.

```
peta-donor-app-v3-rapi/
├── index.html          ← hanya struktur HTML (tag <head>/<body>), memanggil
│                          file css/js di bawah ini
├── manifest.json        (tidak berubah)
├── sw.js                 service worker — sudah diupdate agar meng-cache
│                          semua file baru untuk mode offline
├── icon-192.png / icon-512.png   (tidak berubah)
│
├── css/
│   └── styles.css       seluruh tampilan/desain aplikasi
│
└── js/                  logika aplikasi, dipecah sesuai fungsinya
    ├── state.js          state global & daftar kategori pencarian
    ├── storage.js        penyimpanan data (IndexedDB/localStorage) + backup
    ├── map.js             inisialisasi peta Leaflet & marker
    ├── geocoding.js       ambil koordinat dari nama tempat (Nominatim)
    ├── search.js          kotak pencarian lokasi di atas peta
    ├── overpass.js        "Jelajahi kategori di area peta" (Overpass API)
    ├── helpers.js          fungsi bantu umum (format tanggal, toast, dst)
    ├── auth.js             layar Login/Registrasi & tab "Administrator" (Data User, hak akses tab)
    ├── tabs.js             perpindahan antar tab
    ├── topbar.js           statistik ringkas di header
    ├── master-data.js     tab "Master Data" (form + tabel)
    ├── kegiatan.js         tab "Input Kegiatan & Epidemiologi"
    ├── laporan.js          tab "Laporan"
    └── init.js             render awal saat aplikasi pertama dibuka
```

## Kenapa dipecah begini?
- **Satu file = satu tanggung jawab.** Kalau mau ubah tampilan pencarian
  peta misalnya, langsung buka `js/search.js`, tidak perlu scroll di antara
  1800 baris untuk cari bagiannya.
- **Urutan pemanggilan di `index.html` penting** — file di atas dipanggil
  duluan karena file di bawahnya bergantung pada variabel/fungsi yang
  dideklarasikan sebelumnya (misalnya `map.js` butuh `state` dari
  `state.js`). Jangan diacak urutannya.
- Semua file JS ini masih pakai `<script src="...">` biasa (bukan ES
  module), jadi seluruh variabel/fungsi tetap saling terlihat antar file
  seperti sebelumnya — tidak perlu `import`/`export`, aplikasi jalan persis
  sama seperti versi satu-file.

## Yang TIDAK berubah
- Semua fitur, alur, dan perilaku aplikasi **identik** dengan versi
  sebelumnya (v3). Ini murni perapian struktur file, bukan perubahan fitur.
