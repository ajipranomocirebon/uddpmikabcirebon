/* ===================================================================
   HELPERS
=================================================================== */
// Daftar parameter skrining reaktif -- dipakai bersama oleh Tab 2 (Input
// Kegiatan) & Tab 3 (Laporan). Sebelumnya berupa daftar tetap (hardcode),
// sekarang diambil dari data Parameter yang diatur admin lewat tab 5
// Setting -> "Input Parameter" (state.parameterList), sama pola dengan
// getJenisList()/populateKecamatanDropdown() dkk untuk Kecamatan.
function getJenisList(){
  return state.parameterList.slice().sort((a,b)=>a.nama.localeCompare(b.nama)).map(p=>p.nama);
}
function getZonaNamaList(){
  return state.zonaList.slice().sort((a,b)=>a.nama.localeCompare(b.nama)).map(z=>z.nama);
}

function escapeHtml(str){
  return String(str||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso+'T00:00:00');
  return d.toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'});
}
function showToast(elId, msg, type){
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(()=>{ el.classList.remove('show'); }, 3200);
}
function zonaBadge(zona){
  if(!zona) return '<span class="badge netral">—</span>';
  const z = findZona(zona);
  if(!z) return `<span class="badge netral">${escapeHtml(zona)}</span>`;
  return `<span class="badge" style="background:${z.warna}22;color:${z.warna};">${escapeHtml(z.nama)}</span>`;
}

// Mencari data Zona (nama + warna) di state.zonaList berdasarkan nilai yang
// tersimpan pada suatu kegiatan (k.zona). Dicocokkan case-insensitive supaya
// data lama (tersimpan sblm tab Setting → Input Zona ada, nilainya masih
// huruf kecil spt "hijau") tetap cocok dgn data Zona yang skrg bisa diubah
// namanya bebas oleh admin (mis. jadi "Hijau"). Dipakai bersama oleh
// zonaBadge() di atas dan pinIcon()/renderMap() di map.js supaya warna pin
// & badge selalu bersumber dari SATU tempat (state.zonaList).
function findZona(nilaiZona){
  if(!nilaiZona) return null;
  return state.zonaList.find(z=>z.nama.toLowerCase()===String(nilaiZona).toLowerCase()) || null;
}

/* ---------- Validasi/sanitasi format input umum (dipakai di beberapa tab) --- */
// Nama Tempat, Alamat, Nama PIC, Kecamatan (Setting), Wilayah (Setting): huruf, angka, spasi.
const REGEX_HURUF_ANGKA_SPASI = /^[A-Za-z0-9\s]*$/;
function sanitizeHurufAngkaSpasi(str){
  return str.replace(/[^A-Za-z0-9\s]/g, '');
}

// Membersihkan karakter terlarang secara real-time saat mengetik/menempel (paste),
// sambil menjaga posisi kursor supaya tidak "meloncat" ke akhir teks.
function attachInputSanitizer(id, sanitizerFn){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener('input', ()=>{
    const cursorPos = el.selectionStart;
    const before = el.value;
    const after = sanitizerFn(before);
    if(after !== before){
      const removedBeforeCursor = before.slice(0, cursorPos).length - sanitizerFn(before.slice(0, cursorPos)).length;
      el.value = after;
      const newPos = Math.max(0, cursorPos - removedBeforeCursor);
      el.setSelectionRange(newPos, newPos);
    }
  });
}

// Satu entri epi = satu nomor kantong yang reaktif, bisa punya lebih dari
// satu parameter (mis. HBsAg + HIV sekaligus). Fungsi ini juga menerjemahkan
// format data LAMA (sebelum revisi ini) yang bentuknya masih
// {jumlahReaktif, nomorKantong, jenis} -- satu jenis per baris -- supaya
// data yang sudah tersimpan sebelumnya tetap terbaca dengan benar.
function normalizeEpiRow(r){
  if(Array.isArray(r.parameters)){
    return { nomorKantong: r.nomorKantong || '', parameters: [...r.parameters] };
  }
  return { nomorKantong: r.nomorKantong || '', parameters: r.jenis ? [r.jenis] : [] };
}

/* confirm modal */
let confirmCallback = null;
// okLabel opsional: teks tombol konfirmasi (default "Ya, Hapus" krn
// awalnya fungsi ini cuma dipakai utk konfirmasi hapus data). Dipakai jg
// utk pop-up konfirmasi lain spt "Kondisi Aman" di kegiatan.js yang
// tombolnya perlu berbunyi "OK" (bukan "Ya, Hapus") krn bukan aksi hapus.
function askConfirm(title, text, cb, okLabel){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').textContent = text;
  document.getElementById('modalOk').textContent = okLabel || 'Ya, Hapus';
  document.getElementById('modalConfirm').classList.add('show');
  confirmCallback = cb;
}
document.getElementById('modalCancel').addEventListener('click', ()=>{
  document.getElementById('modalConfirm').classList.remove('show'); confirmCallback=null;
});
document.getElementById('modalOk').addEventListener('click', ()=>{
  document.getElementById('modalConfirm').classList.remove('show');
  if(confirmCallback) confirmCallback();
  confirmCallback = null;
});

/* ---------- Panel/folder pengelompokan sub-menu (dipakai Tab 5 Setting) ---
   Generik supaya bisa dipakai berulang kalau sub-menu Setting lain
   ditambahkan ke depannya -- cukup bungkus markup-nya dengan
   ".settings-group" + ".settings-group-header" + ".settings-group-body"
   seperti pola "Input Data Kecamatan", tidak perlu fungsi baru. */
function toggleSettingsGroup(headerEl){
  const group = headerEl.closest('.settings-group');
  if(group) group.classList.toggle('open');
}
function openSettingsGroup(name){
  const group = document.querySelector(`.settings-group[data-group="${name}"]`);
  if(group) group.classList.add('open');
}


