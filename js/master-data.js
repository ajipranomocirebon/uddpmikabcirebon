/* ===================================================================
   MASTER DATA — FORM & TABLE
=================================================================== */
const formMaster = document.getElementById('formMaster');

function resetFormMaster(){
  formMaster.reset();
  document.getElementById('masterId').value = '';
  document.getElementById('masterFormTitle').textContent = 'Tambah Lokasi Baru';
  document.getElementById('masterLat').value = '';
  document.getElementById('masterLng').value = '';
  document.getElementById('geoStatus').textContent = 'Menunggu Nama Tempat, Kecamatan & Wilayah diisi…';
  manualPinMode = false;
  document.getElementById('btnManualPin').textContent = '📍 Tandai manual di peta';
  clearDraftMarker();
  hideAutocomplete('masterNamaSuggest');
  syncComboDisplay('masterKecamatan');
  syncComboDisplay('masterWilayah');
  syncComboDisplay('masterZonaWilayah');
  // Setiap kali form dikosongkan (batal, atau selesai simpan) form dikunci
  // lagi -- admin wajib mencari dulu di Daftar Lokasi Terdaftar sebelum
  // bisa menambah lokasi baru berikutnya. Lihat setMasterFormLocked().
  setMasterFormLocked(true);
}

/* ---------- Kunci form "Tambah Lokasi Baru" sampai admin mencari dulu ----
   Supaya tidak terjadi input lokasi ganda: form ini terkunci (semua field
   & tombol dinonaktifkan + overlay ditampilkan) sampai admin melakukan
   pencarian di panel "Daftar Lokasi Terdaftar" dan sistem memastikan
   datanya memang belum ada (lihat scheduleMasterNoResultCheck di bawah).
   Membuka data yang SUDAH ada lewat Edit/klik saran autocomplete tetap
   langsung membuka form (unlock) krn itu bukan aksi tambah data baru. ---- */
let masterFormUnlocked = false;

function setMasterFormLocked(locked){
  masterFormUnlocked = !locked;
  const overlay = document.getElementById('masterFormLock');
  if(overlay) overlay.classList.toggle('show', locked);
  formMaster.querySelectorAll('input, textarea, select, button').forEach(el=>{
    el.disabled = locked;
  });
  if(locked) masterLastAskedQuery = null; // siklus pencarian baru boleh menawarkan modal lagi
}

// Dipanggil setelah admin klik "Iya" pada modal "data tidak ditemukan".
// prefillNama: kata kunci pencarian yang tadi diketik, supaya langsung
// terisi di kolom Nama Tempat dan admin tidak perlu mengetik ulang.
function unlockMasterFormForNewEntry(prefillNama){
  resetFormMaster();
  setMasterFormLocked(false);
  if(prefillNama){
    document.getElementById('masterNama').value = prefillNama;
  }
  document.getElementById('masterNama').focus();
}

/* ---------- Validasi format input ---------- */
// Nama Tempat, Alamat, Nama PIC: hanya huruf, angka, dan spasi
// (REGEX_HURUF_ANGKA_SPASI, sanitizeHurufAngkaSpasi, attachInputSanitizer
// didefinisikan bersama di js/helpers.js supaya bisa dipakai juga oleh
// js/setting.js).
// Contact Person PIC: hanya angka 0-9.
const REGEX_ANGKA_SAJA = /^[0-9]*$/;

function sanitizeAngkaSaja(str){
  return str.replace(/[^0-9]/g, '');
}

// Kecamatan sekarang berupa dropdown (data diatur di tab Setting), jadi
// tidak lagi butuh sanitasi karakter bebas ketik.
['masterNama','masterAlamat','masterPic'].forEach(id=>{
  attachInputSanitizer(id, sanitizeHurufAngkaSpasi);
});
attachInputSanitizer('masterKontak', sanitizeAngkaSaja);

/* ---------- Longitude / Latitude: bisa diisi manual ---------- */
// Hanya boleh angka, satu tanda minus di depan, dan satu titik desimal.
function sanitizeDesimal(str){
  let s = str.replace(/[^0-9.\-]/g, '');
  if(s.length === 0) return s;
  s = s[0] + s.slice(1).replace(/-/g, ''); // tanda minus hanya boleh di posisi pertama
  const dotIdx = s.indexOf('.');
  if(dotIdx !== -1){
    s = s.slice(0, dotIdx+1) + s.slice(dotIdx+1).replace(/\./g, ''); // hanya satu titik
  }
  return s;
}
attachInputSanitizer('masterLng', sanitizeDesimal);
attachInputSanitizer('masterLat', sanitizeDesimal);

// Setiap kali salah satu kolom Longitude/Latitude diketik manual, sistem
// mencoba melacak titiknya di peta. Kalau baru salah satu yang terisi,
// cukup beri tahu supaya user melengkapi satunya lagi — begitu keduanya
// valid, titik langsung dimunculkan/diperbarui di peta.
function trySyncManualLatLng(){
  const lngRaw = document.getElementById('masterLng').value.trim();
  const latRaw = document.getElementById('masterLat').value.trim();
  const statusEl = document.getElementById('geoStatus');
  clearTimeout(geoTimer); // input manual membatalkan pencarian otomatis dari nama tempat yang masih tertunda

  if(!lngRaw && !latRaw){
    statusEl.textContent = 'Menunggu Nama Tempat, Kecamatan & Wilayah diisi…';
    clearDraftMarker();
    return;
  }
  if(!lngRaw || !latRaw){
    statusEl.textContent = !lngRaw
      ? 'Latitude sudah diisi — lengkapi Longitude untuk menampilkan titik di peta.'
      : 'Longitude sudah diisi — lengkapi Latitude untuk menampilkan titik di peta.';
    return;
  }

  const lng = parseFloat(lngRaw), lat = parseFloat(latRaw);
  if(isNaN(lng) || isNaN(lat)){
    statusEl.textContent = 'Format Longitude/Latitude belum valid — gunakan angka desimal, mis. 108.123456.';
    return;
  }
  previewDraftMarker(lat, lng);
  statusEl.textContent = 'Koordinat manual diterapkan pada peta ✓';
}
['masterLng','masterLat'].forEach(id=>{
  document.getElementById(id).addEventListener('input', trySyncManualLatLng);
});

/* ---------- Autocomplete: Nama Tempat ---------------------------------
   Saat user mengetik, cari ke data master yang SUDAH TERSIMPAN. Kalau ada
   yang cocok, tampilkan sebagai saran di bawah kolom -- tujuannya supaya
   user tidak menginput ulang tempat yang sebenarnya sudah ada di
   database. Memilih saran akan memuat data lokasi itu (mode "Ubah")
   persis seperti tombol Edit di tabel.
   (Kecamatan tidak lagi pakai autocomplete teks -- sekarang dropdown yang
   datanya diatur di tab ⚙️ Setting, lihat js/setting.js.) --------- */
function hideAutocomplete(boxId){
  const box = document.getElementById(boxId);
  box.classList.remove('show');
  box.innerHTML = '';
}

function renderNamaSuggestions(){
  const q = document.getElementById('masterNama').value.trim().toLowerCase();
  const box = document.getElementById('masterNamaSuggest');
  if(q.length < 1){ hideAutocomplete('masterNamaSuggest'); return; }

  const matches = state.master.filter(t=> wordPrefixMatch(t.nama, q)).slice(0, 6);
  if(matches.length===0){ hideAutocomplete('masterNamaSuggest'); return; }

  box.innerHTML =
    `<div class="autocomplete-hint">Sudah ada di database — klik untuk membuka datanya:</div>` +
    matches.map(t=>`
      <div class="autocomplete-item" data-id="${t.id}">
        <b>${escapeHtml(t.nama)}</b>
        <span>${escapeHtml(t.kecamatan)}, ${escapeHtml(t.wilayah)}</span>
      </div>`).join('');
  box.classList.add('show');

  box.querySelectorAll('.autocomplete-item').forEach(el=>{
    el.addEventListener('mousedown', (e)=>{
      e.preventDefault(); // cegah blur menutup dropdown sebelum klik terproses
      editMaster(parseInt(el.dataset.id));
      hideAutocomplete('masterNamaSuggest');
      showToast('masterToast','Lokasi ini sudah terdaftar — data dimuat untuk diperiksa/diubah, bukan input baru.','ok');
    });
  });
}

document.getElementById('masterNama').addEventListener('input', renderNamaSuggestions);
document.getElementById('masterNama').addEventListener('focus', renderNamaSuggestions);
document.getElementById('masterNama').addEventListener('blur', ()=> hideAutocomplete('masterNamaSuggest'));

formMaster.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nama = document.getElementById('masterNama').value.trim();
  const kecamatan = document.getElementById('masterKecamatan').value.trim();
  const wilayah = document.getElementById('masterWilayah').value;
  const zonaWilayah = document.getElementById('masterZonaWilayah').value;
  const lat = parseFloat(document.getElementById('masterLat').value);
  const lng = parseFloat(document.getElementById('masterLng').value);
  const alamat = document.getElementById('masterAlamat').value.trim();
  const pic = document.getElementById('masterPic').value.trim();
  const kontak = document.getElementById('masterKontak').value.trim();

  if(!nama || !kecamatan || !wilayah || !zonaWilayah){
    showToast('masterToast','Nama Tempat, Kecamatan, Wilayah, dan Zona Wilayah wajib diisi.','err'); return;
  }

  // Validasi format (lapis kedua, selain sanitasi real-time di atas)
  // Kecamatan tidak perlu divalidasi format lagi -- sudah berupa pilihan
  // dropdown dari data yang diatur di tab Setting.
  if(!REGEX_HURUF_ANGKA_SPASI.test(nama)){
    showToast('masterToast','Nama Tempat hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(alamat)){
    showToast('masterToast','Alamat hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(pic)){
    showToast('masterToast','Nama PIC hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!REGEX_ANGKA_SAJA.test(kontak)){
    showToast('masterToast','Contact Person PIC hanya boleh berisi angka 0-9.','err'); return;
  }

  if(isNaN(lat) || isNaN(lng)){
    showToast('masterToast','Koordinat belum tersedia. Tunggu proses pencarian otomatis, tandai manual di peta, atau isi Longitude/Latitude secara langsung.','err'); return;
  }

  const idField = document.getElementById('masterId').value;
  const payload = {
    nama, kecamatan, wilayah, zonaWilayah, lat, lng,
    alamat, pic, kontak
  };

  if(idField){
    const idx = state.master.findIndex(t=>t.id===parseInt(idField));
    if(idx>-1) state.master[idx] = {...state.master[idx], ...payload};
    showToast('masterToast','Perubahan lokasi berhasil disimpan.','ok');
  }else{
    payload.id = state.nextMasterId++;
    state.master.push(payload);
    showToast('masterToast','Lokasi baru berhasil ditambahkan.','ok');
  }

  await persistMaster();
  clearDraftMarker();
  resetFormMaster();
  renderAll();
});

document.getElementById('btnBatalMaster').addEventListener('click', resetFormMaster);

function editMaster(id){
  const t = state.master.find(x=>x.id===id);
  if(!t) return;
  setMasterFormLocked(false); // membuka data yang sudah ada utk diubah -- bukan tambah baru, jadi langsung dibuka
  document.getElementById('masterId').value = t.id;
  document.getElementById('masterNama').value = t.nama;
  document.getElementById('masterAlamat').value = t.alamat||'';
  document.getElementById('masterKecamatan').value = t.kecamatan;
  document.getElementById('masterWilayah').value = t.wilayah;
  document.getElementById('masterZonaWilayah').value = t.zonaWilayah||'';
  syncComboDisplay('masterKecamatan');
  syncComboDisplay('masterWilayah');
  syncComboDisplay('masterZonaWilayah');
  document.getElementById('masterLat').value = t.lat.toFixed(6);
  document.getElementById('masterLng').value = t.lng.toFixed(6);
  document.getElementById('masterPic').value = t.pic||'';
  document.getElementById('masterKontak').value = t.kontak||'';
  document.getElementById('masterFormTitle').textContent = 'Ubah Lokasi: ' + t.nama;
  document.getElementById('geoStatus').textContent = 'Data koordinat tersimpan. Isi ulang Nama/Kecamatan/Wilayah untuk mencari ulang.';
  previewDraftMarker(t.lat, t.lng);
  window.scrollTo({top:0, behavior:'smooth'});
}

function deleteMaster(id){
  const t = state.master.find(x=>x.id===id);
  const terpakai = state.kegiatan.some(k=>k.tempatId===id);
  askConfirm(
    'Hapus lokasi ini?',
    terpakai
      ? `"${t.nama}" memiliki riwayat kegiatan. Menghapusnya juga akan menghapus seluruh riwayat kegiatan terkait.`
      : `Lokasi "${t.nama}" akan dihapus permanen.`,
    async ()=>{
      state.master = state.master.filter(x=>x.id!==id);
      state.kegiatan = state.kegiatan.filter(k=>k.tempatId!==id);
      await persistMaster(); await persistKegiatan();
      renderAll();
    }
  );
}

/* ---------- Pencarian & Pagination: Daftar Lokasi Terdaftar --------
   Panel kanan tab 1 (Master Data). Pencarian mencocokkan Nama Tempat,
   Alamat Lengkap, Kecamatan, Wilayah, dan PIC -- kalau cocok muncul di
   hasil, kalau tidak ada yang cocok tabel menampilkan baris "tidak
   ditemukan". Pagination membatasi jumlah baris per halaman supaya
   tabel tetap enak dibaca walau datanya sudah banyak. ------------- */
const masterTableState = { query: '', page: 1, pageSize: 10 };
const MASTER_PAGINATION_MIN = 10; // pagination baru aktif kalau total lokasi >= 10

function getFilteredMasterList(){
  const q = masterTableState.query.trim();
  if(!q) return state.master;
  return state.master.filter(t=>{
    const haystack = [t.nama, t.alamat, t.kecamatan, t.wilayah, t.zonaWilayah, t.pic]
      .filter(Boolean).join(' ');
    return wordPrefixMatch(haystack, q);
  });
}

function renderMasterTable(){
  const tbody = document.getElementById('tblMaster');
  const metaEl = document.getElementById('masterTableMeta');
  const pagerEl = document.getElementById('masterPagination');
  const btnPrev = document.getElementById('btnMasterPrev');
  const btnNext = document.getElementById('btnMasterNext');
  const total = state.master.length;
  const filtered = getFilteredMasterList();
  const filteredTotal = filtered.length;

  // Pagination baru aktif kalau jumlah lokasi terdaftar sudah minimal
  // MASTER_PAGINATION_MIN. Di bawah itu, seluruh data langsung
  // ditampilkan tanpa navigasi halaman -- toh tabelnya masih ringkas.
  const paginationActive = total >= MASTER_PAGINATION_MIN;

  if(total === 0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Belum ada lokasi terdaftar.</td></tr>`;
    pagerEl.style.display = 'none';
    return;
  }

  if(filteredTotal === 0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Lokasi tidak ditemukan untuk pencarian "${escapeHtml(masterTableState.query.trim())}".</td></tr>`;
    if(paginationActive){
      pagerEl.style.display = 'flex';
      metaEl.innerHTML = `Tidak ada hasil dari total <b>${total}</b> lokasi terdaftar.`;
      btnPrev.disabled = true; btnNext.disabled = true;
    }else{
      pagerEl.style.display = 'none';
    }
    return;
  }

  if(!paginationActive){
    // Belum mencapai ambang batas -- tampilkan semua hasil tanpa
    // memotong per halaman, dan sembunyikan bar pagination.
    pagerEl.style.display = 'none';
    masterTableState.page = 1;
    tbody.innerHTML = filtered.map(t=>`
      <tr>
        <td class="mono">${t.id}</td>
        <td><b>${escapeHtml(t.nama)}</b></td>
        <td>${escapeHtml(t.alamat || '—')}</td>
        <td>${escapeHtml(t.wilayah)}</td>
        <td>${escapeHtml(t.kecamatan)}</td>
        <td>${escapeHtml(t.pic||'—')}</td>
        <td style="white-space:nowrap;">
          <button class="icon-btn" onclick="editMaster(${t.id})">✏️ Edit</button>
          <button class="icon-btn" onclick="deleteMaster(${t.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
    return;
  }

  // Kalau data berkurang (mis. habis dihapus) & halaman aktif jadi
  // melebihi jumlah halaman yang tersisa, mundurkan ke halaman terakhir
  // yang masih valid.
  const totalPages = Math.max(1, Math.ceil(filteredTotal / masterTableState.pageSize));
  if(masterTableState.page > totalPages) masterTableState.page = totalPages;
  if(masterTableState.page < 1) masterTableState.page = 1;

  pagerEl.style.display = 'flex';
  const start = (masterTableState.page - 1) * masterTableState.pageSize;
  const pageItems = filtered.slice(start, start + masterTableState.pageSize);

  tbody.innerHTML = pageItems.map(t=>`
    <tr>
      <td class="mono">${t.id}</td>
      <td><b>${escapeHtml(t.nama)}</b></td>
      <td>${escapeHtml(t.alamat || '—')}</td>
      <td>${escapeHtml(t.wilayah)}</td>
      <td>${escapeHtml(t.kecamatan)}</td>
      <td>${escapeHtml(t.pic||'—')}</td>
      <td style="white-space:nowrap;">
        <button class="icon-btn" onclick="editMaster(${t.id})">✏️ Edit</button>
        <button class="icon-btn" onclick="deleteMaster(${t.id})">🗑️</button>
      </td>
    </tr>
  `).join('');

  const rangeAwal = start + 1;
  const rangeAkhir = Math.min(start + masterTableState.pageSize, filteredTotal);
  const dataLabel = masterTableState.query.trim()
    ? `Menampilkan <b>${rangeAwal}–${rangeAkhir}</b> dari <b>${filteredTotal}</b> hasil pencarian (total <b>${total}</b> lokasi terdaftar)`
    : `Menampilkan <b>${rangeAwal}–${rangeAkhir}</b> dari <b>${total}</b> lokasi terdaftar`;
  metaEl.innerHTML = `${dataLabel} &middot; Halaman <b>${masterTableState.page}</b> dari <b>${totalPages}</b>`;

  btnPrev.disabled = masterTableState.page <= 1;
  btnNext.disabled = masterTableState.page >= totalPages;
}

document.getElementById('btnMasterPrev').addEventListener('click', ()=>{
  if(masterTableState.page <= 1) return;
  masterTableState.page -= 1;
  renderMasterTable();
});
document.getElementById('btnMasterNext').addEventListener('click', ()=>{
  const totalPages = Math.max(1, Math.ceil(getFilteredMasterList().length / masterTableState.pageSize));
  if(masterTableState.page >= totalPages) return;
  masterTableState.page += 1;
  renderMasterTable();
});

const masterTableSearchInput = document.getElementById('masterTableSearch');
const btnMasterTableSearchClear = document.getElementById('btnMasterTableSearchClear');

/* ---------- Modal "data tidak ditemukan" -> tawarkan buka form tambah ---
   Begitu admin berhenti mengetik (debounce) di kolom pencarian Daftar
   Lokasi Terdaftar dan hasilnya kosong, tampilkan modal konfirmasi di
   tengah layar: "Apakah data yang Anda cari tidak ada?". Kalau admin klik
   "Iya", form Tambah Lokasi Baru dibuka (unlock) dgn nama tempat sudah
   terisi dari kata kunci pencarian tsb. -------------------------------- */
const MASTER_SEARCH_MIN_LEN = 2; // kata kunci terlalu pendek -> jangan buru-buru tanya
const MASTER_SEARCH_DEBOUNCE_MS = 700; // jeda tunggu setelah admin berhenti mengetik
let masterSearchDebounceTimer = null;
let masterLastAskedQuery = null; // query yg sudah pernah ditawarkan, supaya tidak tanya berulang

// forceReask: true kalau dipicu manual (tombol Enter) -- pengecekan
// langsung jalan tanpa menunggu debounce, dan modal tetap ditampilkan
// walau query yang sama pernah ditanyakan sebelumnya, karena menekan
// Enter dianggap permintaan eksplisit dari admin/user untuk mengecek lagi.
function checkMasterNoResult(forceReask){
  if(masterFormUnlocked) return; // form sudah aktif -- tidak perlu ditawarkan lagi
  const currentQ = masterTableState.query.trim();
  if(currentQ.length < MASTER_SEARCH_MIN_LEN) return;
  if(!forceReask && currentQ.toLowerCase() === masterLastAskedQuery) return; // sudah pernah ditawarkan utk query ini

  if(getFilteredMasterList().length === 0){
    masterLastAskedQuery = currentQ.toLowerCase();
    askConfirm(
      'Data tidak ditemukan',
      `Apakah data yang Anda cari tidak ketemu? Tidak ditemukan lokasi untuk kata kunci "${currentQ}" di Daftar Lokasi Terdaftar.`,
      ()=> unlockMasterFormForNewEntry(currentQ),
      'Iya', 'Tidak'
    );
  }
}

function scheduleMasterNoResultCheck(){
  clearTimeout(masterSearchDebounceTimer);
  if(masterFormUnlocked) return;
  const q = masterTableState.query.trim();
  if(q.length < MASTER_SEARCH_MIN_LEN) return;

  masterSearchDebounceTimer = setTimeout(()=>{
    // kalau query sudah berubah lagi sejak timer dipasang, biarkan timer
    // yang lebih baru (dari keystroke berikutnya) yang menentukan
    if(masterTableState.query.trim().toLowerCase() !== q.toLowerCase()) return;
    checkMasterNoResult(false);
  }, MASTER_SEARCH_DEBOUNCE_MS);
}

masterTableSearchInput.addEventListener('input', ()=>{
  masterTableState.query = masterTableSearchInput.value;
  masterTableState.page = 1;
  btnMasterTableSearchClear.classList.toggle('show', !!masterTableSearchInput.value);
  renderMasterTable();
  scheduleMasterNoResultCheck();
});

// Tekan Enter -> langsung cek saat itu juga, tidak perlu menunggu jeda
// debounce, dan tetap tampil walau kata kunci ini pernah ditanyakan
// sebelumnya (Enter = permintaan eksplisit utk mengecek ulang).
masterTableSearchInput.addEventListener('keydown', (e)=>{
  if(e.key !== 'Enter') return;
  e.preventDefault();
  clearTimeout(masterSearchDebounceTimer);
  checkMasterNoResult(true);
});

btnMasterTableSearchClear.addEventListener('click', ()=>{
  clearTimeout(masterSearchDebounceTimer);
  masterTableSearchInput.value = '';
  masterTableState.query = '';
  masterTableState.page = 1;
  masterLastAskedQuery = null;
  btnMasterTableSearchClear.classList.remove('show');
  renderMasterTable();
  masterTableSearchInput.focus();
});

// Kunci form Tambah Lokasi Baru sejak awal load tab ini -- admin wajib
// mencari dulu (lihat scheduleMasterNoResultCheck di atas) sebelum form
// aktif diisi.
setMasterFormLocked(true);

