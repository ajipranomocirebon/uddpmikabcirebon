# Perubahan PetaDonor — Revisi Penyimpanan & Pencarian Kategori

# Perubahan PetaDonor — Revisi Penyimpanan & Pencarian Kategori

## 29. User 2 — Tab 3 (Laporan Epidemiologi) ditampilkan versi ringkas
- Khusus untuk akun dengan Level Akses "User 2" (yang datanya diatur lewat
  Tab 6 Administrator): kartu ringkasan jumlah reaktif per parameter
  (HBSAG, HCV, HIV, SIFILIS) di atas tabel sekarang **disembunyikan total**.
- Tabel detail di bawahnya juga disederhanakan -- hanya menampilkan kolom
  **Tanggal, Tempat, Wilayah, Kecamatan, Zona**. Kolom No. Kantong, Jenis
  Donor, Metode Pengujian, dan Parameter Reaktif (yang berisi hasil
  skrining per-donor, lebih sensitif) ikut disembunyikan utk User 2.
- Administrator dan User 1 tetap melihat laporan lengkap seperti sebelumnya
  (kartu ringkasan + 8 kolom tabel, termasuk parameter reaktif per kantong).
- Tampilan ini otomatis menyesuaikan begitu Tab 3 dibuka (tidak perlu klik
  "Tampilkan Laporan" dulu) -- lihat `isUser2()` di `js/laporan.js`.

## 28. Seluruh pencarian data sendiri diubah jadi "awalan per-kata" (word-prefix)
- Sebelumnya pencarian (Nama Tempat Tab 1 & 2, Daftar Lokasi Terdaftar,
  Riwayat Kegiatan, pencarian lokasi di peta, dropdown Kecamatan/Wilayah/
  Zona Wilayah) mencocokkan kata kunci di SEMBARANG posisi teks (substring).
  Sekarang diganti jadi cocok berdasarkan **awalan tiap kata** (word-prefix
  match, huruf besar/kecil dianggap sama) -- fungsi baru bersama
  `wordPrefixMatch()` di `js/helpers.js`.
- Contoh: mencari "Desa Tegalkarang" -- ketik huruf **"T"** langsung
  memunculkan data yang salah satu katanya diawali huruf T (mis.
  "Tegalkarang"); ketik lagi jadi **"Te"** hasil makin menyempit ke yang
  diawali "Te"; begitu seterusnya huruf demi huruf sampai admin memilih
  data yang dimaksud. Kata kunci pencarian yg terdiri dari beberapa kata
  (mis. "desa te") tetap didukung -- tiap kata kunci dicocokkan ke kata
  manapun pada data yang diawalinya.
- Pencarian eksternal (Nominatim/Photon di kotak cari lokasi pada peta)
  TIDAK diubah -- perubahan ini hanya berlaku utk pencarian di data sendiri
  (state.master/state.kegiatan/opsi dropdown), krn layanan eksternal
  punya mesin pencariannya sendiri di luar kendali aplikasi ini.

## 27. Tab 2 — field "Cari Nama Tempat" bukan lagi dropdown, jadi field pencarian biasa
- Sebelumnya field ini pakai `<input list>` + `<datalist>` bawaan browser,
  yang tampilannya menyerupai dropdown (ada ikon panah di kanan field).
  Sekarang diganti jadi field teks biasa dengan pencarian langsung (custom
  autocomplete) -- pola sama seperti "Nama Tempat" di Tab 1: sambil
  mengetik, muncul daftar saran nama lokasi terdaftar yg cocok tepat di
  bawah field (bukan dropdown bawaan browser). Klik salah satu saran akan
  mengisi field & memuat kartu info lokasinya (kecamatan/wilayah/PIC)
  persis seperti sebelumnya.

## 26. Tab 1 (Master Data) — posisi panel ditukar + form Tambah Lokasi wajib cari dulu
- **Posisi panel ditukar**: "Daftar Lokasi Terdaftar" sekarang di posisi
  pertama (kiri di desktop / atas di layar sempit), "Tambah Lokasi Baru"
  di posisi kedua (kanan/bawah) -- kebalikan dari sebelumnya.
- **Cegah data ganda — form Tambah Lokasi Baru terkunci by default**: form
  ini (semua kolom & tombol Simpan/Batal) nonaktif dan tertutup overlay
  🔒 sampai admin lebih dulu mencari nama tempatnya di kolom pencarian
  panel "Daftar Lokasi Terdaftar".
  - Kalau admin berhenti mengetik dan ternyata **tidak ada hasil**, muncul
    pop-up konfirmasi di tengah layar: **"Apakah data yang Anda cari
    tidak ada?"**. Klik **"Iya"** akan membuka (unlock) form Tambah Lokasi
    Baru dengan kolom Nama Tempat langsung terisi dari kata kunci
    pencarian tadi. Klik **"Tidak"** menutup pop-up & form tetap terkunci.
  - Kalau pencarian justru **menemukan data**, form tetap terkunci --
    admin diarahkan pakai tombol **Edit** di tabel, bukan menambah baru.
  - Membuka data yang sudah ada lewat tombol **Edit** (atau klik saran
    autocomplete di kolom Nama Tempat) tetap langsung membuka form seperti
    biasa, karena itu bukan aksi tambah data baru.
  - Form otomatis terkunci lagi setiap kali selesai Simpan atau klik
    Batal, supaya siklus cari-dulu berlaku lagi utk entri berikutnya.

## 25. Login/Registrasi wajib tiap buka aplikasi + Tab 6 "Administrator"
- **Layar Login/Registrasi**: setiap kali aplikasi ini aktif/mulai dibuka,
  layar Login menimpa (overlay) seluruh tampilan lebih dulu -- tidak ada
  sesi yang diingat otomatis antar sesi buka-aplikasi. Belum punya akun?
  Ada pilihan **Daftar di sini** dengan form: ID User (auto-increment,
  primary key, terisi otomatis & tersembunyi), Nama Lengkap, Password, dan
  Ulangi Password -- sistem memeriksa kedua Password harus sama persis
  sebelum registrasi dianggap berhasil. Akun baru hasil registrasi mandiri
  otomatis tersimpan sbg data User dgn Level Akses awal **"User 2"**
  (paling terbatas) & langsung muncul pada Tab 6.
- **Tab 6 "Administrator"** (baru): berisi **Data User** (tabel ID User,
  Nama Lengkap, Username, Password) yang bisa diubah/dihapus oleh
  Administrator, termasuk mengubah **Level Akses** tiap user (User 1 /
  User 2) sesuai kebutuhan.
- **Hak akses per Level**:
  - **User 1**: hanya bisa membuka Tab 1 (Master Data), Tab 2 (Input
    Kegiatan & Epidemiologi), Tab 3 (Laporan Epidemiologi) + peta. Tab 4,
    Tab 5, Tab 6 terkunci/disabled (tombolnya tidak bisa diklik).
  - **User 2**: hanya bisa membuka Tab 3 (Laporan Epidemiologi) + terlihat
    peta. Tab 1, 2, 4, 5, 6 terkunci/disabled.
  - **Administrator**: bisa membuka SEMUA tab (1-6) tanpa batasan.
- **Akun Administrator bersifat tetap & tunggal**: hanya username
  `ajipranomo` dengan password `udd3209` yang bisa login sebagai
  Administrator. Username ini dicadangkan -- tidak bisa dipakai/didaftarkan
  oleh akun User mana pun (baik lewat Registrasi mandiri maupun ditambahkan
  Administrator sendiri lewat Tab 6), sehingga tidak ada user lain yang
  bisa menyamar menjadi Administrator.
- Tombol **Keluar** ditambahkan di pojok kanan atas (topbar) setelah login,
  menampilkan nama & level user yang sedang aktif, dan mengembalikan ke
  layar Login kalau diklik.
- Data User (state.userList) ikut disertakan pada **Unduh Cadangan (.json)**
  & **Pulihkan dari Cadangan** di Tab 4, dengan aturan yang sama seperti
  data Kecamatan/Parameter/Zona (mode Gabung melewati username yang sudah
  ada; username `ajipranomo` selalu dilewati krn dicadangkan utk
  Administrator).

## 24. Tab 2 — pop-up konfirmasi "Kondisi Aman" sebelum menyimpan
- Melengkapi aturan otomatis "Aman" pada poin 23: sekarang, kalau admin
  klik **Simpan** pada Tab 2 sementara **Epidemiologi (skrining reaktif)
  dikosongkan** (tidak ada Nomor Kantong ditambahkan), sistem **belum
  langsung menyimpan** — muncul dulu **pop-up di tengah layar** berjudul
  **"Kondisi Aman"** dengan pesan: *"Epidemiologi (skrining reaktif) Anda
  kosongkan — kondisi di tempat ini akan dicatat sebagai 'Aman' karena
  tidak ada hasil pengujian yang reaktif."*
- Data **baru benar-benar disimpan setelah admin klik tombol "OK,
  Simpan"** pada pop-up tsb. Kalau admin klik **"Batal"**, form tidak
  jadi tersimpan — admin bisa kembali mengisi Epidemiologi dulu kalau
  ternyata memang ada hasil reaktif yang terlewat.
- Kalau Epidemiologi **sudah diisi** (ada minimal satu Nomor Kantong),
  perilaku Simpan **tidak berubah** — langsung tersimpan tanpa pop-up
  ini seperti sebelumnya (Zona-nya pun tetap wajib dipilih manual sesuai
  aturan poin 23).

## 23. Tab 2 — Zona otomatis terisi "Aman" kalau Epidemiologi kosong
- **Aturan baru**: kalau admin **tidak menambahkan Nomor Kantong** apa pun
  di bagian **Epidemiologi (skrining reaktif)**, dropdown **Zona** di
  bawahnya sekarang **otomatis terisi "Aman"** dan **dikunci** (tidak
  bisa diubah manual) — admin tidak perlu memilih Zona sendiri untuk
  kegiatan yang memang tidak ada hasil reaktifnya.
- Begitu admin klik **"+ Tambah Nomor Kantong"** (menambah minimal satu
  data reaktif), dropdown Zona **otomatis terbuka kembali & dikosongkan**
  — wajib dipilih manual sesuai kondisi sebenarnya (Hijau/Kuning/Merah/
  dst), karena "Aman" tidak relevan lagi kalau ada hasil reaktif.
  Menghapus semua Nomor Kantong yang sudah ditambahkan (balik ke kosong)
  akan mengunci Zona ke "Aman" lagi secara otomatis.
- **Saat mengubah (Edit) kegiatan lama**: kalau kegiatan itu memang tidak
  punya data Epidemiologi, Zona ikut terkunci ke "Aman" (menyamakan
  dengan aturan baru ini). Kalau kegiatan itu punya data Epidemiologi,
  Zona tersimpan sebelumnya tetap dimuat apa adanya seperti biasa (tidak
  berubah).
- **Migrasi otomatis**: kalau di data zona (tab ⚙️ Setting → Input Zona)
  belum ada zona bernama **"Aman"** sama sekali (baik instalasi baru
  maupun yang sudah lama dipakai), sistem akan **menambahkannya sendiri
  sekali** (warna default teal) saat aplikasi pertama kali dibuka setelah
  pembaruan ini — supaya aturan otomatis di atas langsung berfungsi tanpa
  admin perlu membuatnya manual dulu. Kalau admin sudah pernah membuat
  zona "Aman" sendiri sebelumnya, data itu dipakai apa adanya (tidak
  diduplikasi/ditimpa).

## 22. Pencarian lokasi pada peta diperkuat (data sendiri + Photon sbg pelengkap)
Sebelumnya pencarian nama/tempat pada peta murni bergantung pada Nominatim
(OpenStreetMap) sendirian — kalau data OSM di lokasi tsb belum lengkap
(umum terjadi utk desa kecil, UMKM, sekolah swasta di pedesaan), hasil
sering nihil. Sekarang pencarian dicoba lewat 3 sumber berurutan:
- **1) Data Master sendiri** — kotak pencarian peta & auto-geocode di
  Tab 1 sekarang **mengecek dulu ke lokasi yang sudah pernah
  disimpan/ditandai admin di aplikasi ini** (nama/alamat/kecamatan/
  wilayah). Kalau cocok, langsung dipakai koordinatnya (tanpa internet,
  ditandai badge abu-abu "Terdaftar" di hasil pencarian peta) — sumber
  ini otomatis makin lengkap seiring makin banyak lokasi yang diinput.
- **2) Nominatim** — pencarian umum ke OpenStreetMap seperti sebelumnya.
- **3) Photon** *(baru, photon.komoot.io)* — dicoba **hanya kalau
  Nominatim tidak menemukan apa pun**. Photon sama-sama berbasis data
  OpenStreetMap & gratis tanpa API key, tapi mesin pencariannya lebih
  toleran terhadap typo/ejaan berbeda, jadi bisa menemukan lokasi yang
  terlewat oleh Nominatim.
- Kalau internet bermasalah, hasil dari Data Master sendiri (poin 1)
  tetap ditampilkan — pencarian tidak langsung buntu total.
- **Catatan jujur**: kalau suatu tempat memang belum pernah dipetakan
  sama sekali di OpenStreetMap (baik lewat Nominatim maupun Photon) dan
  belum pernah diinput manual di aplikasi ini, pencarian tetap tidak
  akan menemukannya — solusinya tetap pakai "📍 Tandai manual di peta".
  Perubahan ini memperbesar peluang ketemu, bukan menjamin 100% selalu
  ketemu, karena sumber datanya tetap gratis/terbuka.

## 21. Tab 5 (Setting) — panel baru "Input Zona" (nama + warna, dinamis)
- Ditambahkan panel/folder baru **🚦 Input Zona** di tab Setting (sesudah
  panel "Input Parameter"), dengan pola yang sama persis dgn panel "Input
  Data Kecamatan" & "Input Parameter": form di kiri, tabel daftar di kanan.
- Form terdiri dari:
  1. **ID Zona** — auto-increment, tersembunyi (tidak perlu diisi admin).
  2. **Zona** — nama zona bebas (huruf/angka/spasi, cth. Hijau/Kuning/
     Merah atau nama baru lainnya), berdampingan dengan **kotak pilihan
     warna** berisi **24 pilihan warna berbeda** (lebih dari minimal 20)
     yang bisa diklik langsung — tidak perlu mengetik kode hex manual.
- Dropdown **"Zona"** pada Tab 2 (Input Kegiatan & Epidemiologi) dan
  filter **"Jenis Zona"** pada Tab 3 (Laporan) sekarang **terisi otomatis**
  dari daftar Zona di panel ini (sebelumnya daftar tetap/hardcode Hijau/
  Kuning/Merah) — nambah/ubah/hapus zona di sini langsung ikut memperbarui
  kedua dropdown tsb, warna pin lokasi di peta, badge Zona pada tabel
  Riwayat Kegiatan & Laporan, dan Legenda peta, semuanya dari SATU sumber
  data yang sama (state.zonaList) supaya konsisten di semua tempat.
- **Migrasi aman**: instalasi yang sudah punya data sebelumnya otomatis
  mendapat 3 zona bawaan (Hijau/Kuning/Merah) dengan warna PERSIS sama
  dengan warna tetap versi sebelumnya, jadi tampilan pin peta & badge pada
  riwayat kegiatan LAMA tidak berubah setelah pembaruan ini.
- **Proteksi data**: nama zona tidak boleh dobel; mengubah nama sebuah
  zona otomatis menyesuaikan seluruh riwayat kegiatan yang sudah memakai
  nama lama; menghapus zona yang masih dipakai riwayat kegiatan akan
  diberi peringatan dulu (riwayat kegiatan TIDAK ikut terhapus, hanya
  pin/badge terkait jadi netral/abu-abu sampai diubah ke zona lain).
- Kedepannya kalau perlu menambah zona baru dengan warna berbeda, admin
  tinggal tambah lewat panel ini saja — tidak perlu mengubah kode aplikasi.

## 20. Tab 2 — tombol Unduh Excel/PDF di modal "Detail Kegiatan"
- Ditambahkan dua tombol baru di bagian bawah modal "Detail Kegiatan"
  (dibuka lewat tombol 🔍 di tabel Riwayat Kegiatan): **⬇️ Excel (.xlsx)**
  dan **⬇️ PDF** — user bisa memilih salah satu format sesuai kebutuhan.
- Isi file unduhan sama persis dengan yang tampil di modal: Jumlah
  Perolehan per Golongan Darah (A/B/AB/O + Sub Total), Gagal Pengambilan
  (A/B/AB/O + Sub Total), Jumlah Keseluruhan, dan tabel rincian
  Epidemiologi (No. Kantong & Parameter Reaktif).
- Nama file otomatis memuat nama lokasi & tanggal unduh, contoh:
  `detail-kegiatan_desa-gintung-kidul_2026-08-06.xlsx`.
- Excel dibuat memakai pustaka **SheetJS**, PDF memakai **jsPDF +
  jspdf-autotable** (keduanya dimuat via CDN seperti html2canvas yang
  sudah dipakai sebelumnya untuk fitur screenshot laporan) — perlu
  koneksi internet saat pertama kali dipakai; kalau pustaka gagal
  dimuat, muncul toast error yang meminta cek koneksi lalu coba lagi.

## 19. Tab 2 — satu tombol Detail (🔍) gabungan di tabel Riwayat Kegiatan
- Ditambahkan tombol ikon baru **🔍 (kaca pembesar/lup)** di kolom paling
  kanan tabel Riwayat Kegiatan, diletakkan **sebelum** tombol ✏️ Edit.
- Tombol **🔎 Detail** yang sebelumnya ada di kolom Reaktif **dipindahkan**
  jadi jadi satu dengan tombol 🔍 baru ini — sekarang cukup **satu**
  tombol Detail untuk seluruh rincian kegiatan (kolom Reaktif hanya
  menampilkan angkanya saja, tanpa tombol lagi).
- Klik tombol 🔍 membuka satu modal "Detail Kegiatan" berisi:
  - **Jumlah Perolehan per Golongan Darah** (A/B/AB/O) + Sub Totalnya.
  - **Gagal Pengambilan** (A/B/AB/O) + Sub Totalnya.
  - **Jumlah Keseluruhan** (Berhasil + Gagal Pengambilan).
  - **Epidemiologi (skrining reaktif)**: rincian nomor kantong & parameter
    reaktif per kantong (perilaku sama seperti modal Detail sebelumnya).

## 18. Tab 2 — status wajib/opsional field & kolom baru Riwayat Kegiatan
- **Wajib diisi**: Cari Nama Tempat, Tanggal Kegiatan, dan Jumlah Perolehan
  per Golongan Darah sekarang ditandai wajib (`*`) — untuk Golongan Darah,
  wajib artinya tiap kotak A/B/AB/O harus terisi angka (boleh **0**),
  karena pada kenyataannya bisa saja salah satu golongan darah memang
  tidak ada pendonornya pada kegiatan tsb. Jadi TIDAK ada syarat totalnya
  harus lebih dari 0 — mengisi 0 di semua kotak tetap sah/valid.
- **Opsional**: Gagal Pengambilan dan Epidemiologi (skrining reaktif)
  ditandai "(opsional)" dan tetap boleh dikosongkan — sesuai kondisi
  nyata, bisa saja suatu kegiatan tidak ada pengambilan yang gagal dan
  tidak ada hasil reaktif dari pengujian lab.
- **Total Pengambilan** (form) tetap = Sub Total Perolehan Pengambilan +
  Sub Total Gagal Pengambilan (perilaku ini sudah benar sebelumnya, tidak
  berubah).
- **Tabel Riwayat Kegiatan**: kolom "Kantong" diganti nama jadi
  **"Berhasil"** (Sub Total Perolehan Pengambilan), ditambah dua kolom
  baru: **"Gagal Pengambilan"** (Sub Total Gagal Pengambilan) dan
  **"Jumlah Keseluruhan"** (Berhasil + Gagal Pengambilan).
- **Reaktif tidak dijumlahkan**: kolom "Reaktif" tetap terpisah dan tidak
  ikut dijumlahkan ke kolom manapun (Berhasil/Gagal/Jumlah Keseluruhan) —
  karena reaktif adalah penanda hasil uji lab pada sebagian nomor kantong
  yang sudah termasuk di dalam Berhasil, bukan data tambahan di luar itu.

## 17. Konfirmasi: pencarian & filter periode Riwayat Kegiatan bisa dipakai sendiri-sendiri (revisi terbaru)
- Ditegaskan/dipastikan ulang perilaku kombinasi kotak **pencarian nama
  tempat** dan **filter periode (Dari Tanggal -- Sampai Tanggal)** pada
  Riwayat Kegiatan Tab 2, sesuai yang diminta: kalau admin **tidak mengisi
  kotak pencarian** dan **hanya mengisi periode tanggal**, sistem tetap
  mencari/menampilkan riwayat murni berdasarkan **rentang periode
  tersebut** (tanpa perlu nama tempat sama sekali) -- sudah diverifikasi
  berjalan dengan benar.
- Ditambahkan kalimat penjelasan singkat di bawah judul panel Riwayat
  Kegiatan supaya perilaku ini lebih jelas terlihat langsung di
  aplikasinya (bukan cuma di kode): kedua kotak filter bisa dipakai
  sendiri-sendiri atau digabung.

## 16. Filter tanggal Riwayat Kegiatan (Tab 2) kini rentang periode
- Filter tanggal di atas tabel **Riwayat Kegiatan** (Tab 2) sebelumnya
  cuma 1 date picker (mencocokkan tanggal persis). Sekarang jadi **2 date
  picker: "Dari Tanggal" -- "Sampai Tanggal"**, jadi bisa mencari
  berdasarkan **rentang periode**, bukan cuma satu tanggal persis.
- Pencarian tetap berbasis **Nama Tempat** seperti sebelumnya; kalau
  admin **mengisi periode**, filter periode berlaku **DI ATAS** hasil
  pencarian nama tempat itu (kombinasi keduanya, sama seperti perilaku
  filter tanggal sebelumnya).
- Kalau admin **tidak memilih periode sama sekali** (kedua date picker
  kosong), pencarian murni berdasarkan **nama tempat saja** -- persis
  seperti yang diminta.
- Kalau cuma salah satu diisi (mis. hanya "Dari Tanggal"), filter tetap
  jalan sebagai batas terbuka di sisi yang kosong (mis. isi "Dari" saja
  berarti tanggal tsb dan seterusnya, tanpa batas akhir).
- Satu tombol "✕" di ujung tetap tersedia untuk membersihkan kedua batas
  tanggal sekaligus.

## 15. Tab 5 (Setting) — panel baru "Input Parameter"
- Ditambahkan panel/folder baru **"Input Parameter"** di Tab 5 (Setting),
  di bawah panel "Input Data Kecamatan", dengan pola yang **sama persis**:
  form input **Nama Parameter** (ID Parameter otomatis/tersembunyi) di
  sebelah kiri, dan tabel **Daftar Parameter Terdaftar** (Edit/Hapus) di
  sebelah kanan.
- Sebelumnya daftar parameter reaktif (HBsAg, HIV, HCV, Sifilis) bersifat
  **tetap/hardcode**. Sekarang daftar ini **diatur admin lewat tab
  Setting** -- isi form dengan nama parameter (mis. HBsAg, HIV, HCV,
  Sifilis, atau parameter lain yang dibutuhkan ke depannya).
- Dampaknya ke **Tab 2 (Input Kegiatan & Epidemiologi)**: pada bagian
  Epidemiologi (skrining reaktif), setelah menambah Nomor Kantong, tombol
  **"+ Tambah Parameter"** di dalamnya sekarang menampilkan pilihan
  **persis dari data yang diinput di Tab 5 → Input Parameter** ini
  (bukan daftar tetap lagi) -- sama konsepnya dengan Kecamatan/Wilayah/
  Zona Wilayah pada Tab 1 yang sumbernya juga dari Tab 5.
- Dampaknya ke **Tab 3 (Laporan Epidemiologi)**: kartu ringkasan jumlah
  reaktif per parameter juga otomatis mengikuti daftar Parameter yang
  aktif di Tab 5.
- **Ubah nama parameter**: seluruh riwayat kegiatan yang sudah memakai
  nama parameter lama pada data reaktifnya otomatis ikut disesuaikan ke
  nama baru (mirip perilaku ubah nama Kecamatan yang menyinkronkan data
  Master Data terkait).
- **Hapus parameter**: kalau parameter tsb masih tercatat dipakai di
  riwayat kegiatan, ditampilkan peringatan dulu -- riwayat kegiatan lama
  TIDAK terhapus, hanya parameter tsb tidak lagi muncul sebagai pilihan
  baru.
- Data Parameter juga ikut disertakan pada **Export/Import Cadangan JSON**
  (Tab 4. Data & Cadangan), sama seperti data Kecamatan.
- Instalasi yang sudah berjalan sebelumnya (belum pernah punya data
  Parameter tersimpan) otomatis diisi 4 parameter bawaan (HBsAg, HIV, HCV,
  Sifilis) saat pertama kali dibuka setelah update ini, supaya Tab 2 tidak
  mendadak kosong -- setelah itu daftar sepenuhnya bisa diubah bebas lewat
  Tab 5.

## 14. Tab 5 (Setting) kini berupa panel/folder yang bisa dibuka-tutup (revisi terbaru)
- Form **"Input Data Kecamatan"** beserta tabel **"Daftar Kecamatan
  Terdaftar"** di Tab 5 (Setting) sekarang dibungkus dalam satu
  **panel/folder** berjudul **"Input Data Kecamatan"**. Panel ini
  tertutup secara default -- klik judul panel (atau ikon 🗺️/chevron ▾
  di sampingnya) untuk membuka dan menampilkan form & tabelnya; klik
  lagi untuk menutup.
- Ini murni pengelompokan tampilan (mirip folder yang bisa dibuka-tutup)
  supaya Tab 5 tetap rapi -- **tidak ada perubahan** pada field, alur
  input, validasi, maupun data yang tersimpan. Semua ID elemen, fungsi,
  dan logika form/tabel kecamatan yang sudah berjalan sebelumnya tetap
  identik, hanya dibungkus dalam panel yang bisa dilipat.
- Pola panel ini (class `.settings-group`) dibuat generik supaya
  **sub-menu Setting lain yang akan ditambahkan ke depannya** tinggal
  memakai pola pembungkus yang sama, tanpa perlu fungsi baru.

## 13. Pencarian, Filter Tanggal, Pagination & Rincian Parameter pada Riwayat Kegiatan Tab 2
- Panel **Riwayat Kegiatan** (Tab 2) kini punya kotak **pencarian nama
  tempat**, sama seperti pola Daftar Lokasi Terdaftar di Tab 1. Selain
  itu, di sampingnya ditambahkan **date picker** untuk memfilter
  berdasarkan tanggal kegiatan.
  - Kalau admin **tidak memilih tanggal**, tidak masalah — sistem tetap
    menampilkan **seluruh riwayat tanggal kegiatan** dari nama tempat
    yang cocok dengan pencarian.
  - Kalau tanggal **diisi**, filter tanggal berlaku di atas hasil
    pencarian nama tempat (kombinasi keduanya).
  - Tombol ✕ di masing-masing kotak untuk membersihkan pencarian/filter
    dengan cepat.
- **Pagination Prev/Next** ditambahkan di bawah tabel Riwayat Kegiatan.
  Sama seperti Tab 1, pagination baru aktif kalau **total kegiatan
  tercatat sudah minimal 10** — di bawah itu semua baris langsung
  ditampilkan tanpa navigasi halaman.
- **Rincian Parameter Reaktif per Nomor Kantong**: kolom "Reaktif" pada
  tabel sekarang menampilkan angka (jumlah nomor kantong yang reaktif)
  ditambah tombol **"🔎 Detail"**. Mengklik tombol ini membuka jendela
  berisi tabel rincian: **No. Kantong** dan **Parameter Reaktif**nya
  (badge HBsAg/HIV/HCV/Sifilis, bisa lebih dari satu per kantong) —
  supaya jelas bedanya antara jumlah kantong reaktif dengan jumlah
  kemunculan parameter. Contoh: reaktif 2 kantong, tapi kalau salah satu
  kantong reaktif di 2 parameter sekaligus (mis. HBsAg + Sifilis), total
  kemunculan parameternya jadi 3 — rincian ini menampilkan itu per
  kantong secara eksplisit.
- Data yang ditampilkan tabel & rincian ini sepenuhnya dari data yang
  sudah tersimpan (kompatibel dengan data format lama lewat
  `normalizeEpiRow`) — tidak ada perubahan pada struktur data maupun
  alur input.

## 12. Dropdown Kecamatan/Wilayah/Zona Wilayah pada Tab 1 kini bisa dicari (revisi terbaru)
- Dropdown **Kecamatan, Wilayah, dan Zona Wilayah** pada Tab 1 (Master
  Data) sekarang berupa **kotak ketik yang bisa mencari** (searchable
  dropdown/combobox), bukan dropdown biasa lagi — supaya admin tidak
  perlu men-scroll daftar panjang ketika data Kecamatan yang diinput di
  Tab 5 (Setting) sudah lebih dari 20.
- Cara pakai: klik kotaknya untuk melihat semua pilihan, atau langsung
  ketik sebagian nama untuk memfilter daftar secara instan. Bisa juga
  dinavigasi dengan tombol panah atas/bawah + Enter di keyboard. Kalau
  ketikan tidak cocok dengan pilihan manapun, otomatis kembali ke
  pilihan terakhir saat kotaknya ditinggalkan (klik di luar) — supaya
  data yang tersimpan tetap konsisten dengan daftar yang diatur admin
  di tab Setting (tidak bisa asal ketik bebas).
- Perilaku lain tidak berubah: memilih Kecamatan tetap otomatis mengisi
  Wilayah & Zona Wilayah terkait, dan data yang tersimpan di Master
  Data formatnya tetap sama persis seperti sebelumnya.

## 11. Field baru "Zona Wilayah" pada Tab 5 (Setting) & Tab 1 (Master Data)
- Form **"Input Data Kecamatan"** di Tab 5 (Setting) kini punya field
  ketiga: **Zona Wilayah** (setelah Kecamatan & Wilayah), dengan aturan
  format yang sama (huruf, angka, spasi saja) dan wajib diisi. Tabel
  daftar kecamatan ikut menampilkan kolom Zona Wilayah.
- **Tab 1 (Master Data)** kini punya dropdown baru **Zona Wilayah**,
  diletakkan tepat setelah dropdown Wilayah. Isinya diambil otomatis
  dari kumpulan nilai Zona Wilayah unik yang diinput admin lewat data
  Kecamatan di tab Setting — sama pola dengan dropdown Wilayah.
- Memilih Kecamatan di Tab 1 otomatis mengisi Wilayah **dan** Zona
  Wilayah terkait sekaligus.
- Kalau Zona Wilayah sebuah Kecamatan diubah (Edit) di tab Setting,
  lokasi di Master Data yang sudah memakai Kecamatan tersebut ikut
  disesuaikan otomatis (sama seperti sinkronisasi Wilayah sebelumnya).
- Data Zona Wilayah ikut tersimpan di penyimpanan lokal (IndexedDB) dan
  ikut disertakan dalam Unduh/Pulihkan Cadangan (.json) di Tab 4.

## 10. Tab baru "⚙️ Setting" — Input Data Kecamatan & Wilayah
- Ditambahkan tab ke-5 **"⚙️ Setting"** berisi form **"Input Data
  Kecamatan"**: ID Kecamatan (auto-increment, tersimpan tersembunyi),
  field **Kecamatan**, field **Wilayah**, tombol Simpan & Batal — beserta
  tabel daftar kecamatan yang sudah diinput (Edit/Hapus).
- **Kecamatan pada Tab 1 (Master Data)** yang sebelumnya kolom teks
  bebas (dengan autocomplete) sekarang menjadi **dropdown**, isinya
  diambil dari data yang diinput admin di tab Setting. Memilih Kecamatan
  otomatis mengisi Wilayah terkait.
- **Wilayah pada Tab 1 & filter Wilayah Tab 3** sebelumnya daftar tetap
  (Kota Cirebon, Kabupaten Cirebon, Kuningan, Majalengka, Indramayu,
  Lain-lain) — daftar ini **dihapus semua**. Sekarang dropdown Wilayah
  terisi otomatis dari kumpulan nama Wilayah unik yang pernah diinput
  admin lewat data Kecamatan di tab Setting.
- Nama Kecamatan tidak boleh dobel. Kalau nama/Wilayah sebuah Kecamatan
  diubah (Edit), lokasi di Master Data yang sudah memakai Kecamatan
  tersebut ikut disesuaikan otomatis supaya tidak ada data yang tidak
  cocok lagi dengan pilihan dropdown.
- Data Kecamatan ikut tersimpan di penyimpanan lokal (IndexedDB) dan
  ikut disertakan dalam Unduh/Pulihkan Cadangan (.json) di Tab 4.

## 9. Tombol Screenshot Peta & Laporan pada Tab 3
- Tombol baru **"📸 Screenshot Peta & Laporan"** di filter-bar Tab 3.
  Setelah laporan ditampilkan (sesuai periode/wilayah/zona yang dipilih),
  tombol ini menangkap **peta** (dengan pin lokasi hasil filter yang
  sedang tampil) dan **kartu ringkasan + tabel laporan** sekaligus,
  menggabungkan keduanya jadi **satu file gambar PNG**, lalu otomatis
  terunduh ke perangkat (nama file: `laporan-epidemiologi_YYYY-MM-DD.png`).
- Gambar hasil punya header berisi nama aplikasi, ringkasan filter yang
  aktif (periode/wilayah/zona), dan waktu unduh — supaya tetap jelas
  konteksnya kalau dibuka terpisah (mis. dikirim lewat WhatsApp/email
  untuk laporan ke pihak lain).
- Saat proses screenshot, tabel laporan sementara ditampilkan penuh
  (tanpa scroll) supaya seluruh baris ikut tertangkap di gambar, lalu
  kembali seperti semula setelah selesai.
- Dipakai pustaka `html2canvas` (dimuat via CDN). Catatan: bila
  penyedia tile peta yang sedang aktif tidak mengizinkan CORS, tampilan
  peta pada gambar bisa saja tidak sempurna — sistem akan menampilkan
  pesan kegagalan agar user bisa mencoba lagi.

## 8. Filter Jenis Zona pada Tab 3 (Laporan Epidemiologi)
- Ditambahkan filter **Jenis Zona** setelah filter Wilayah: Semua,
  Zona Hijau, Zona Kuning, Zona Merah. Berlaku bersamaan dengan filter
  periode tanggal & wilayah yang sudah ada — tabel, kartu ringkasan
  parameter, dan peta laporan semuanya mengikuti kombinasi ketiga
  filter tersebut.

## 7. Data reaktif Tab 2 kini per Nomor Kantong dengan banyak Parameter sekaligus
- **Model data epidemiologi diubah total**: sebelumnya satu baris "Tambah"
  = satu jenis pemeriksaan (jadi kalau satu kantong reaktif di 2 parameter,
  harus input 2 baris terpisah dengan nomor kantong yang sama diketik
  ulang). Sekarang **satu baris "+ Tambah Nomor Kantong" = satu nomor
  kantong/satu donor**, dan di dalam baris itu ada **sub-tombol
  "+ Tambah Parameter"** untuk memilih satu per satu parameter yang
  reaktif pada kantong tersebut (HBsAg, HIV, HCV, Sifilis) — tampil
  sebagai chip yang bisa dihapus lagi (×) kalau salah pilih. Sesuai
  cerita: kantong 320987A cukup 1 chip "HBsAg", kantong 3209555A bisa
  punya 2 chip "HBsAg" + "HIV", dst — tanpa mengetik ulang nomor
  kantongnya.
- Field "Jumlah Reaktif" (angka) pada baris lama dihapus karena sudah
  tidak relevan — jumlah reaktif per parameter sekarang otomatis
  dihitung dari banyaknya nomor kantong yang punya parameter tsb.
- Validasi baru saat Simpan: nomor kantong wajib diisi, minimal 1
  parameter wajib dipilih per nomor kantong, dan nomor kantong tidak
  boleh diinput dobel dalam satu kegiatan yang sama.
- **Data lama tetap terbaca** (kompatibel mundur) — format lama
  `{jumlahReaktif, nomorKantong, jenis}` otomatis diterjemahkan jadi
  1 parameter per nomor kantong saat dibuka/diedit atau ditampilkan di
  Laporan, jadi tidak perlu migrasi manual.
- **Tabel Laporan (Tab 3)** ikut disesuaikan: kolom "Jenis" & "Jml
  Reaktif" diganti jadi "No. Kantong" + "Parameter Reaktif" (badge,
  bisa lebih dari satu per baris). Kartu ringkasan per parameter di
  bagian atas tetap ada, dihitung dari total kemunculan tiap parameter
  di seluruh nomor kantong yang cocok filter.

## 6. Autocomplete Nama Tempat & Kecamatan pada Tab 1 (revisi terbaru)
- Saat mengetik di kolom **Nama Tempat**, sistem mencari ke data master
  yang sudah tersimpan dan menampilkan daftar tempat dengan nama serupa
  (lengkap dengan Kecamatan & Wilayah-nya) di bawah kolom. Klik salah
  satu saran akan memuat data lokasi tersebut ke form (mode "Ubah",
  sama seperti tombol Edit di tabel) — supaya user memeriksa/mengubah
  data yang sudah ada, bukan menginput ulang tempat yang sebenarnya
  sama.
- Saat mengetik di kolom **Kecamatan**, sistem menyarankan nama
  kecamatan yang sudah pernah diinput sebelumnya (beserta Wilayah &
  jumlah lokasi terdaftar). Klik salah satu saran mengisi ulang kolom
  Kecamatan (dan Wilayah bila masih kosong) supaya penulisan nama
  kecamatan konsisten dan tidak terjadi duplikat karena beda ejaan.
- Pencarian ini murni lokal (ke data yang sudah ada di database
  perangkat ini), tidak memerlukan koneksi internet dan tidak
  memengaruhi pencarian koordinat otomatis (Nominatim) yang sudah ada.

## 5. Longitude/Latitude bisa diisi manual & tombol "Tandai manual" kembali ke Tab 1
- **Tombol "📍 Tandai manual di peta" dikembalikan ke Tab 1 (Master
  Data)**, diletakkan tepat setelah kolom Longitude & Latitude (sempat
  dipindah ke Tab 2 di revisi sebelumnya — sekarang dikembalikan sesuai
  permintaan).
- **Kolom Longitude & Latitude kini bisa diketik manual** (sebelumnya
  selalu terkunci/`disabled`, hanya terisi otomatis). Tiga cara
  menentukan koordinat sekarang tersedia sekaligus di Tab 1:
  1. **Otomatis** — terisi begitu Nama Tempat, Kecamatan & Wilayah
     lengkap (seperti sebelumnya).
  2. **Tandai manual di peta** — klik tombol, lalu klik titik di peta
     (seperti sebelumnya).
  3. **Ketik langsung** *(baru)* — isi kolom Longitude/Latitude dengan
     angka desimal. Peta otomatis mengikuti/menampilkan titik pratinjau
     begitu **kedua** kolom terisi dan valid. Boleh mengisi salah satu
     dulu (urutan bebas) — sistem akan menunggu dan memberi tahu lewat
     status di bawah kolom sampai keduanya lengkap, baru titik muncul
     di peta.
  - Input dibatasi hanya boleh angka, satu tanda minus di depan (untuk
    koordinat negatif), dan satu titik desimal — karakter lain otomatis
    tertolak saat diketik.

## 4. Validasi format field & pemindahan tombol "Tandai manual di peta"
- **Validasi format input di Tab 1 (Master Data):**
  - Field **Nama Tempat, Alamat Lengkap, Kecamatan, Nama PIC** sekarang
    hanya menerima **huruf (besar/kecil), angka, dan spasi** (termasuk
    gabungan huruf & angka, mis. "Blok A1"). Karakter selain itu
    (tanda baca, simbol, dll) otomatis **terhapus saat diketik/ditempel**,
    dan submit form juga tetap diperiksa ulang sebagai lapisan kedua.
  - Field **Contact Person PIC** sekarang hanya menerima **angka 0–9**
    (keyboard di HP otomatis beralih ke numerik). Karakter lain otomatis
    terhapus saat diketik/ditempel.
  - Validasi ini murni soal format karakter yang diperbolehkan — field
    yang memang opsional (Alamat, Nama PIC, Contact Person PIC) tetap
    boleh dikosongkan.
- ~~Tombol "📍 Tandai manual di peta" dipindah dari Tab 1 (Master Data) ke
  Tab 2 (Input Kegiatan & Epidemiologi)~~ — **lihat poin 5 di atas,
  tombol ini sudah dikembalikan ke Tab 1.**

## 3. Rapikan kontrol di atas peta
Pencarian pada peta (Nominatim + Overpass, lihat bagian 2 di bawah) tetap
jalan seperti sebelumnya — bagian ini hanya merapikan tata letaknya supaya
tidak saling menutupi:
- **Tombol zoom peta (+/−)** sebelumnya memakai posisi bawaan Leaflet
  (kiri-atas), persis bertumpukan dengan kotak pencarian yang juga ada di
  kiri-atas — sehingga tombol zoom menutupi field pencarian. Sekarang
  dipindah ke pojok **kiri-bawah** peta, satu-satunya sudut yang masih
  kosong (kanan-atas dipakai legenda, kanan-bawah dipakai pilihan
  lapisan/layer peta).
- **Baris chip kategori** (Perusahaan, Desa/Kel, Kecamatan, Kesehatan,
  Pendidikan, UMKM, Organisasi) beserta tombol "🌐 Jelajahi kategori ini
  di area peta" sebelumnya selalu tampil menempel di atas peta, sehingga
  ikut menutupi tampilan peta terus-menerus meski admin sedang tidak
  mencari apa pun. Sekarang baris ini **disembunyikan secara default** dan
  baru muncul (dengan animasi rapi) saat kotak pencarian memang sedang
  aktif dipakai (diklik/diketik) — begitu selesai, otomatis tersembunyi
  lagi. Semua kategori & fungsinya tidak berubah, hanya cara
  menampilkannya yang dirapikan.


## 1. Penyimpanan data (database lokal, jalan di hosting mana pun)
- Sebelumnya aplikasi memakai `window.storage`, API yang **hanya aktif di
  dalam pratinjau/sandbox Claude** — begitu file di-export dan dibuka di
  luar Claude (dijalankan lokal atau di-deploy ke hosting), penyimpanan
  ini tidak akan berfungsi.
- Sekarang diganti dengan **IndexedDB** — database bawaan browser yang
  berjalan murni di sisi client, tanpa server/API key, dan otomatis
  berfungsi sama persis baik dibuka langsung dari file, dijalankan lokal,
  maupun sudah di-deploy ke hosting apa pun (GitHub Pages, Netlify,
  cPanel, dst). `localStorage` dipakai sebagai cadangan kalau IndexedDB
  benar-benar tidak tersedia.
- **Catatan penting**: data tersimpan **per perangkat/browser**, bukan
  otomatis tersinkron ke perangkat lain. Untuk itu ditambahkan tab baru
  **"4. Data & Cadangan"** berisi:
  - **Unduh Cadangan (.json)** — backup seluruh data kapan saja.
  - **Pulihkan dari Cadangan** — pulihkan file `.json` yang pernah
    diunduh, bisa **digabung** (menambah tanpa menghapus data yang ada)
    atau **mengganti total** (dgn konfirmasi dulu).
  - Info status penyimpanan yang selalu diperbarui saat data disimpan.
- Kalau ke depannya dibutuhkan data yang **otomatis sama di semua
  perangkat/pengguna** (bukan cuma per-browser), langkah lanjutannya
  adalah menyambungkan ke backend seperti Firebase Firestore — pola yang
  sama seperti pada aplikasi Silsilah Keluargaku. Ini bisa dikerjakan
  kapan saja kalau dibutuhkan, cukup informasikan saja.

## 2. Pencarian & kategori lokasi pada peta (diperluas)
Kategori pencarian sebelumnya (Desa/Kel, Kecamatan, Pendidikan,
Perusahaan, Organisasi) diperluas jadi:

| Kategori | Contoh cakupan |
|---|---|
| Perusahaan/Industri | PT, CV, UD, PD, kawasan industri, pabrik |
| Desa/Kelurahan | desa, kelurahan, dusun |
| Kecamatan | wilayah administratif kecamatan |
| **Kesehatan** *(baru)* | RS/RSU/RSUD, klinik, puskesmas, pustu, apotek, posyandu |
| Pendidikan | SD, SMP, SMA, SMK, MI/MTs/MA, universitas, institut, politeknik, sekolah tinggi |
| **UMKM/Usaha Mandiri** *(baru)* | toko, warung, bengkel, kios, usaha dagang kecil |
| Organisasi | yayasan, lembaga, NGO |

Sumber datanya tetap referensi terbuka di internet (OpenStreetMap), lewat
dua layanan:
- **Nominatim** — pencarian berdasarkan **nama/alamat** yang diketik
  (seperti sebelumnya, sekarang kamus kategorinya lebih detail).
- **Overpass API** *(baru)* — tombol **"🌐 Jelajahi kategori ini di area
  peta yang tampil"** muncul saat kategori Kesehatan/Pendidikan/
  Perusahaan/UMKM/Organisasi dipilih: menampilkan **semua** lokasi
  kategori itu yang tercatat di OpenStreetMap dalam area peta yang
  sedang terlihat di layar — tanpa perlu tahu/ketik namanya dulu. Cocok
  untuk "lihat semua puskesmas di kecamatan ini", dsb.
  - Desa/Kelurahan & Kecamatan sengaja tidak disediakan tombol jelajah
    ini karena keduanya data batas wilayah (bukan titik lokasi tunggal)
    yang jauh lebih berat untuk dijelajah per-kategori — tetap bisa
    dicari lewat nama seperti biasa.
  - Kalau area peta yang tampil terlalu luas, aplikasi akan minta
    di-zoom in dulu (supaya query tidak terlalu berat/lambat).

## Yang TIDAK berubah
- Alur input Master Data, Input Kegiatan & Epidemiologi, dan Laporan
  tetap sama persis seperti sebelumnya.
- Tidak ada sistem login/akun baru — aplikasi ini tetap alat kerja
  langsung tanpa autentikasi, sesuai desain awal.
