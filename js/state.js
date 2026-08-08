/* ===================================================================
   STATE
=================================================================== */
let state = {
  master: [],      // {id, nama, alamat, kecamatan, wilayah, zonaWilayah, lat, lng, pic, kontak}
  kegiatan: [],     // {id, tempatId, tanggal, gol:{A,B,AB,O}, gagal:{A,B,AB,O}, epi:[{nomorKantong, parameters:[...]}], zona}
                    // gol = jumlah perolehan (berhasil diambil) per golongan darah.
                    // gagal = jumlah gagal pengambilan per golongan darah (data lokasi/kegiatan lama
                    // yang belum punya field ini dianggap {A:0,B:0,AB:0,O:0}).
                    // epi: 1 elemen = 1 nomor kantong reaktif, "parameters" berisi
                    // 1-4 dari ['HBsAg','HIV','HCV','Sifilis'] yang reaktif pada kantong tsb.
  kecamatanList: [], // {id, nama, wilayah, zona} — diatur lewat tab Setting, sumber dropdown
                     // Kecamatan, Wilayah & Zona Wilayah pada tab Master Data.
  parameterList: [], // {id, nama} — diatur lewat tab Setting, sumber pilihan "Parameter
                     // Reaktif" (HBsAg/HIV/HCV/Sifilis, dst) pada tab 2 Input Kegiatan & Epidemiologi.
  jenisDonorList: [],       // {id, nama} — diatur lewat tab Setting → Jenis Donor.
  metodePengujianList: [],  // {id, nama} — diatur lewat tab Setting → Metode Pengujian.
  zonaList: [],      // {id, nama, warna} — diatur lewat tab Setting → Input Zona, sumber pilihan
                     // dropdown "Zona" pada tab 2 (Input Kegiatan) & filter "Jenis Zona" pada tab 3
                     // (Laporan). "warna" adalah kode hex, dipakai jg utk mewarnai pin peta,
                     // badge Reaktif/Zona pada tabel, dan Legenda peta -- supaya SATU sumber data
                     // warna dipakai konsisten di semua tempat (bukan warna tetap/hardcode lagi),
                     // dan admin bisa menambah zona baru dgn warna berbeda kapan saja tanpa
                     // mengubah kode aplikasi.
  userList: [],      // {id, nama, username, passwordHash, salt, level} — akun User 1/User 2
                     // yang didaftarkan sendiri lewat form Registrasi di layar login, dan
                     // dikelola (level akses, ubah, hapus) oleh Administrator lewat Tab 6.
                     // passwordHash+salt (BUKAN password polos lagi) -- lihat hashPassword()
                     // di js/helpers.js. Akun Administrator TIDAK disimpan di sini (lihat
                     // ADMIN_USERNAME/ADMIN_PASSWORD_HASH di atas) karena bersifat tetap & tunggal.
  nextMasterId: 1,
  nextKegiatanId: 1,
  nextKecamatanId: 1,
  nextParameterId: 1,
  nextZonaId: 1,
  nextUserId: 1,
  nextJenisDonorId: 1,
  nextMetodePengujianId: 1
};

// Palet pilihan warna utk form "Input Zona" (tab Setting) -- minimal 20 warna
// berbeda spy admin leluasa membedakan tiap zona scr visual saat menambah
// zona baru ke depannya. Disimpan sbg kode hex (bukan nama warna) supaya
// bisa langsung dipakai sbg inline style di mana saja (pin peta, badge,
// legenda) tanpa perlu daftar kelas CSS baru tiap kali ada warna tambahan.
const ZONA_COLOR_PALETTE = [
  '#2E9E5B', '#DE9F1E', '#D5394A', '#2E86AB', '#7B4FA6',
  '#0E8F6E', '#C0662B', '#B08B1F', '#B0459C', '#3D5AFE',
  '#00ACC1', '#8D6E63', '#5C6BC0', '#26A69A', '#EC407A',
  '#7CB342', '#FB8C00', '#546E7A', '#AB47BC', '#29B6F6',
  '#8E24AA', '#6D4C41', '#00897B', '#F4511E'
];

// Titik tengah default peta dipakai sbg fallback saat lokasi tidak ditemukan
// otomatis oleh Nominatim. Sebelumnya ada daftar per-nama Wilayah, tapi
// karena daftar Wilayah sekarang diisi bebas oleh admin lewat tab Setting
// (bukan daftar tetap lagi), dipakai satu titik tengah umum wilayah
// Ciayumajakuning sebagai fallback.
const DEFAULT_MAP_CENTER = [-6.8500, 108.4500];

// Kotak batas (bounding box) wilayah Ciayumajakuning — dipakai untuk
// memprioritaskan (bukan membatasi mutlak) hasil pencarian Nominatim
// agar lebih relevan dengan cakupan aplikasi.
// format viewbox Nominatim: left(lon),top(lat),right(lon),bottom(lat)
const CIAYU_VIEWBOX = '107.85,-6.05,108.95,-7.35';

// Kategori hasil pencarian pada peta + warna badge. Diperluas supaya
// mencakup semua jenis lokasi yang relevan utk pemetaan donor: perusahaan/
// industri, desa/kelurahan, kecamatan, fasilitas kesehatan, pendidikan
// (SD s/d perguruan tinggi), dan usaha mandiri/UMKM.
const SEARCH_CATEGORIES = {
  perusahaan:  { label:'Perusahaan/Industri', color:'#C0662B' },
  desa:        { label:'Desa/Kelurahan',      color:'#2E86AB' },
  wilayah:     { label:'Kecamatan',           color:'#7B4FA6' },
  kesehatan:   { label:'Kesehatan',           color:'#D5394A' },
  pendidikan:  { label:'Pendidikan',          color:'#0E8F6E' },
  umkm:        { label:'UMKM/Usaha Mandiri',  color:'#B08B1F' },
  organisasi:  { label:'Organisasi',          color:'#B0459C' },
  lainnya:     { label:'Lokasi Lain',         color:'#8A8F98' }
};

// Tag OSM (dipakai jg oleh Overpass utk "jelajahi kategori" -- lihat
// OVERPASS_TAGS di bawah) per kategori, dipakai utk pencocokan hasil
// Nominatim maupun query Overpass supaya konsisten satu sumber data.
const CAT_NAME_PATTERNS = {
  // PT/CV/UD/PD/Firma + kata kunci industri/pabrik -> Perusahaan/Industri
  perusahaan: /^(PT|CV|UD|PD|FIRMA)\.?\s|\bINDUSTRI\b|\bPABRIK\b/,
  // RS/RSU/RSUD/RSIA/Puskesmas/Poliklinik/Klinik/Apotek -> Kesehatan
  kesehatan:  /^(RS|RSU|RSUD|RSIA|RSB)\b|\bPUSKESMAS\b|\bPUSTU\b|\bKLINIK\b|\bPOLIKLINIK\b|\bAPOTEK\b|\bAPOTIK\b|\bPOSYANDU\b/,
  // SD/SMP/SMA/SMK/MI/MTs/MA/Universitas/Institut/Politeknik/Akademi/Sekolah Tinggi -> Pendidikan
  pendidikan: /\b(SD|SDN|SMP|SMPN|SMA|SMAN|SMK|SMKN|MI|MTS|MA|MAN|PAUD|TK)\b|\bUNIVERSITAS\b|\bINSTITUT\b|\bPOLITEKNIK\b|\bAKADEMI\b|\bSEKOLAH TINGGI\b|\bSTIE\b|\bSTAI\b|\bSTIKES\b|\bKAMPUS\b/,
  // Toko/Warung/Bengkel/UMKM/Usaha Dagang/Koperasi kecil -> UMKM
  umkm:       /\bTOKO\b|\bWARUNG\b|\bBENGKEL\b|\bUMKM\b|\bUSAHA DAGANG\b|\bKOPERASI\b|\bKIOS\b/,
  organisasi: /^(YAYASAN|LEMBAGA|PERKUMPULAN|ORGANISASI)\b/
};

// Menentukan kategori hasil Nominatim berdasarkan class/type/addresstype
// OpenStreetMap serta pola nama tempatnya (mis. "PT" utk perusahaan,
// "Puskesmas" utk kesehatan, "SMA" utk pendidikan, dst). categorizeSearchResult
// jadi satu-satunya "kamus" kategori yang dipakai baik oleh hasil pencarian
// nama (Nominatim) maupun jelajah kategori di viewport peta (Overpass).
function categorizeSearchResult(d){
  const cls = d.class || '';
  const typ = d.type || '';
  const atype = d.addresstype || '';
  const name = (d.name || (d.display_name||'').split(',')[0] || '').trim().toUpperCase();

  // Kesehatan (rumah sakit/klinik/puskesmas/apotek)
  if(cls==='amenity' && ['hospital','clinic','doctors','pharmacy','dentist'].includes(typ)) return 'kesehatan';
  if(cls==='healthcare' || d.healthcare) return 'kesehatan';
  if(CAT_NAME_PATTERNS.kesehatan.test(name)) return 'kesehatan';

  // Pendidikan (SD s/d perguruan tinggi)
  if(cls==='amenity' && ['school','college','university','kindergarten'].includes(typ)) return 'pendidikan';
  if(CAT_NAME_PATTERNS.pendidikan.test(name)) return 'pendidikan';

  // Organisasi (NGO, yayasan, lembaga keagamaan/sosial)
  if(cls==='office' && ['ngo','association','foundation','political_party','religion'].includes(typ)) return 'organisasi';
  if(cls==='amenity' && typ==='social_facility') return 'organisasi';
  if(CAT_NAME_PATTERNS.organisasi.test(name)) return 'organisasi';

  // Perusahaan/Industri (PT/CV/UD/PD, kantor, kawasan industri)
  if(CAT_NAME_PATTERNS.perusahaan.test(name)) return 'perusahaan';
  if(cls==='office' || cls==='industrial' || typ==='industrial') return 'perusahaan';

  // UMKM/usaha mandiri (toko, warung, bengkel, kerajinan/craft skala kecil)
  if(CAT_NAME_PATTERNS.umkm.test(name)) return 'umkm';
  if(cls==='shop' || cls==='craft') return 'umkm';

  // Kecamatan / wilayah administratif
  if(cls==='boundary' && typ==='administrative') return 'wilayah';
  if(['state_district','county','city_district'].includes(atype)) return 'wilayah';

  // Desa / kelurahan / dusun
  if(cls==='place' && ['village','hamlet','suburb','neighbourhood','quarter','town'].includes(typ)) return 'desa';
  if(['village','suburb','neighbourhood','hamlet'].includes(atype)) return 'desa';

  return 'lainnya';
}

// Tag OSM per kategori dipakai utk query Overpass ("jelajahi kategori ini
// di area peta yang sedang tampil") -- pelengkap pencarian nama Nominatim
// di atas, supaya kategori bisa dijelajahi walau belum tahu nama tempatnya.
// Desa & Kecamatan sengaja tidak disediakan di sini karena keduanya berupa
// batas wilayah administratif (bukan titik POI) yang datanya jauh lebih
// berat utk dijelajah per-kategori -- tetap bisa dicari lewat nama seperti
// biasa memakai kotak pencarian.
const OVERPASS_TAGS = {
  kesehatan:  ['amenity=hospital','amenity=clinic','amenity=doctors','amenity=pharmacy','amenity=dentist','healthcare=*'],
  pendidikan: ['amenity=school','amenity=college','amenity=university','amenity=kindergarten'],
  perusahaan: ['office=*','landuse=industrial','building=industrial'],
  umkm:       ['shop=*','craft=*'],
  organisasi: ['office=ngo','office=association','office=foundation','amenity=social_facility']
};

let activeSearchCategory = 'semua';

// ---------- Akun Administrator (tetap/hardcode, lihat js/auth.js) ----------
// Hanya SATU akun Administrator yang bisa login, dengan kredensial tetap ini.
// Username ini juga dicadangkan (tidak boleh dipakai) saat user mendaftar
// akun baru lewat form Registrasi di layar login, supaya tidak ada akun lain
// yang bisa menyamar/bentrok menjadi Administrator.
// CATATAN KEAMANAN: passwordnya TIDAK ditulis polos di sini lagi (sebelumnya
// 'udd3209' tertulis apa adanya, siapa pun yang buka source code bisa
// langsung membacanya). Sekarang yang disimpan cuma HASH-nya (PBKDF2-SHA256,
// lihat hashPassword() di js/helpers.js) -- password aslinya tidak bisa
// dibaca ulang dari sini, hanya bisa diverifikasi cocok/tidaknya saat login.
// Password Administrator TIDAK BERUBAH (masih 'udd3209'), hanya cara
// penyimpanannya di kode yang diperbaiki.
const ADMIN_USERNAME = 'ajipranomo';
const ADMIN_SALT = '88b2d1bc726fabca0e5873d5967141f8';
const ADMIN_PASSWORD_HASH = '7269aa858eb48f3bead43ed4bb6a5d4e7f5c0ff565ab4fb69a91fa72e60bef1d';

// Sesi user yang sedang login saat ini (diisi oleh js/auth.js setelah login
// berhasil). null berarti belum login -- overlay layar login akan tampil.
// Bentuk: {role:'admin'} utk Administrator, atau
// {role:'user', id, nama, username, level} utk akun User 1/User 2.
let currentUser = null;

