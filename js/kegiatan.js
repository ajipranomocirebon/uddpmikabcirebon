/* ===================================================================
   KEGIATAN — FORM & TABLE
=================================================================== */
const formKegiatan = document.getElementById('formKegiatan');
// Setiap elemen epiRows = SATU nomor kantong yang reaktif, dengan daftar
// parameter (bisa lebih dari satu -- HBsAg, HIV, HCV, Sifilis) yang
// reaktif pada kantong tsb. {rid, nomorKantong, parameters:[...]}
let epiRows = [];
let epiSeq = 1;

// Sebelumnya "Cari Nama Tempat" berupa input+<datalist> (tampil seperti
// dropdown browser bawaan dgn ikon panah). Sekarang jadi field teks biasa
// dengan pencarian langsung (custom autocomplete) -- pola sama seperti
// "Nama Tempat" di Tab 1 (js/master-data.js: renderNamaSuggestions), agar
// tidak lagi terlihat seperti dropdown tapi tetap bisa mencari data sambil
// mengetik. renderTempatDatalist() jadi no-op krn tidak ada lagi elemen
// <datalist> yang diisi -- dibiarkan ada (bukan dihapus) supaya pemanggil
// lama di js/init.js & js/tabs.js tidak perlu diubah.
function renderTempatDatalist(){ /* no-op: lihat renderKegiatanCariSuggestions() */ }

function hideKegiatanCariSuggest(){
  const box = document.getElementById('kegiatanCariSuggest');
  if(!box) return;
  box.classList.remove('show');
  box.innerHTML = '';
}

function renderKegiatanCariSuggestions(){
  const q = document.getElementById('kegiatanCari').value.trim().toLowerCase();
  const box = document.getElementById('kegiatanCariSuggest');
  if(q.length < 1){ hideKegiatanCariSuggest(); return; }

  const matches = state.master.filter(t=> wordPrefixMatch(t.nama, q)).slice(0, 8);
  if(matches.length===0){ hideKegiatanCariSuggest(); return; }

  box.innerHTML = matches.map(t=>`
    <div class="autocomplete-item" data-id="${t.id}">
      <b>${escapeHtml(t.nama)}</b>
      <span>${escapeHtml(t.kecamatan)}, ${escapeHtml(t.wilayah)}</span>
    </div>`).join('');
  box.classList.add('show');

  box.querySelectorAll('.autocomplete-item').forEach(el=>{
    el.addEventListener('mousedown', (e)=>{
      e.preventDefault(); // cegah blur menutup dropdown sebelum klik terproses
      const t = state.master.find(x=>x.id===parseInt(el.dataset.id));
      if(t){
        document.getElementById('kegiatanCari').value = t.nama;
        selectTempatByName(t.nama);
      }
      hideKegiatanCariSuggest();
    });
  });
}

document.getElementById('kegiatanCari').addEventListener('input', (e)=>{
  selectTempatByName(e.target.value); // tetap auto-cocokkan langsung kalau nama yg diketik sudah persis sama
  renderKegiatanCariSuggestions();
});
document.getElementById('kegiatanCari').addEventListener('focus', renderKegiatanCariSuggestions);
document.getElementById('kegiatanCari').addEventListener('blur', ()=> hideKegiatanCariSuggest());

function selectTempatByName(nama){
  const t = state.master.find(x=>x.nama.toLowerCase()===nama.trim().toLowerCase());
  const card = document.getElementById('placeCard');
  if(t){
    document.getElementById('kegiatanTempatId').value = t.id;
    card.style.display='block';
    card.innerHTML = `<b>${escapeHtml(t.nama)}</b><p>${escapeHtml(t.kecamatan)}, ${escapeHtml(t.wilayah)} ${t.pic? '· PIC: '+escapeHtml(t.pic):''}</p>`;
  }else{
    document.getElementById('kegiatanTempatId').value = '';
    card.style.display='none';
  }
}

function recalcTotal(){
  const a = parseInt(document.getElementById('golA').value)||0;
  const b = parseInt(document.getElementById('golB').value)||0;
  const ab = parseInt(document.getElementById('golAB').value)||0;
  const o = parseInt(document.getElementById('golO').value)||0;
  document.getElementById('golTotal').textContent = a+b+ab+o;
  recalcPengambilanTotal();
}
['golA','golB','golAB','golO'].forEach(id=> document.getElementById(id).addEventListener('input', recalcTotal));

function recalcGagalTotal(){
  const a = parseInt(document.getElementById('gagalA').value)||0;
  const b = parseInt(document.getElementById('gagalB').value)||0;
  const ab = parseInt(document.getElementById('gagalAB').value)||0;
  const o = parseInt(document.getElementById('gagalO').value)||0;
  document.getElementById('gagalTotal').textContent = a+b+ab+o;
  recalcPengambilanTotal();
}
['gagalA','gagalB','gagalAB','gagalO'].forEach(id=> document.getElementById(id).addEventListener('input', recalcGagalTotal));

// Total Pengambilan = Sub Total Perolehan Pengambilan + Sub Total Gagal
// Pengambilan. Epidemiologi (skrining reaktif) dilakukan terhadap nomor
// kantong yang termasuk dalam Total Pengambilan ini.
function recalcPengambilanTotal(){
  const perolehan = parseInt(document.getElementById('golTotal').textContent)||0;
  const gagal = parseInt(document.getElementById('gagalTotal').textContent)||0;
  document.getElementById('pengambilanTotal').textContent = perolehan+gagal;
}

function renderEpiRows(){
  const wrap = document.getElementById('epiList');
  document.getElementById('epiEmptyMsg').style.display = epiRows.length? 'none':'block';
  const jenisDonorList = getJenisDonorNamaList();
  const metodePengujianList = getMetodePengujianNamaList();
  wrap.innerHTML = epiRows.map(r=>{
    const sisaParam = getJenisList().filter(p=> !r.parameters.includes(p));
    return `
    <div class="epi-row" data-rid="${r.rid}">
      <div class="epi-row-top">
        <div>
          <label>Nomor Kantong</label>
          <input type="text" value="${escapeHtml(r.nomorKantong)}" placeholder="cth. 320987A" onchange="updateEpiKantong(${r.rid}, this.value)" />
        </div>
        <button type="button" class="epi-remove" onclick="removeEpiRow(${r.rid})" title="Hapus nomor kantong ini">×</button>
      </div>
      <label style="margin:10px 0 6px;">Jenis Donor <span class="req">*</span></label>
      <select onchange="updateEpiJenisDonor(${r.rid}, this.value)" ${jenisDonorList.length===0?'disabled':''}>
        <option value="">— pilih jenis donor —</option>
        ${jenisDonorList.map(nm=>`<option value="${escapeHtml(nm)}" ${r.jenisDonor===nm?'selected':''}>${escapeHtml(nm)}</option>`).join('')}
      </select>
      ${jenisDonorList.length===0 ? `<p class="epi-param-empty">Belum ada Jenis Donor terdaftar — tambahkan lewat tab ⚙️ Setting → Jenis Donor.</p>` : ''}
      <label style="margin:10px 0 6px;">Metode Pengujian <span class="req">*</span></label>
      <select onchange="updateEpiMetodePengujian(${r.rid}, this.value)" ${metodePengujianList.length===0?'disabled':''}>
        <option value="">— pilih metode pengujian —</option>
        ${metodePengujianList.map(nm=>`<option value="${escapeHtml(nm)}" ${r.metodePengujian===nm?'selected':''}>${escapeHtml(nm)}</option>`).join('')}
      </select>
      ${metodePengujianList.length===0 ? `<p class="epi-param-empty">Belum ada Metode Pengujian terdaftar — tambahkan lewat tab ⚙️ Setting → Metode Pengujian.</p>` : ''}
      <label style="margin:10px 0 6px;">Parameter Reaktif <span class="req">*</span></label>
      <div class="epi-param-chips">
        ${r.parameters.map(p=>`
          <span class="param-chip">${p}
            <button type="button" onclick="removeEpiParam(${r.rid},'${p}')" title="Hapus parameter ini">×</button>
          </span>`).join('')}
        ${sisaParam.length ? `
          <div class="param-add-wrap">
            <button type="button" class="param-add-btn" onclick="toggleParamPicker(${r.rid})">+ Tambah Parameter</button>
            <div class="param-picker" id="paramPicker-${r.rid}" style="display:none;">
              ${sisaParam.map(p=>`<button type="button" class="param-option" onclick="addEpiParam(${r.rid},'${p}')">${p}</button>`).join('')}
            </div>
          </div>` : ''}
      </div>
      ${r.parameters.length===0 ? `<p class="epi-param-empty">Belum ada parameter dipilih untuk kantong ini — klik "+ Tambah Parameter".</p>` : ''}
    </div>`;
  }).join('');
  syncZonaOtomatis();
}

// ---------------------------------------------------------------------
// Aturan: kalau Epidemiologi (skrining reaktif) TIDAK diisi sama sekali
// (belum ada Nomor Kantong ditambahkan), kegiatan dianggap otomatis
// "Aman" -- dropdown Zona diisi otomatis ke pilihan "Aman" dan dikunci
// (tidak bisa diubah manual) selama epidemiologi masih kosong, supaya
// admin tidak perlu memilih Zona sendiri untuk kegiatan tanpa hasil
// reaktif. Begitu admin menambah minimal SATU Nomor Kantong, dropdown
// otomatis dibuka kembali & dikosongkan (wajib dipilih manual) karena
// "Aman" tidak relevan lagi kalau ada hasil reaktif yang perlu
// diklasifikasikan zona-nya (Hijau/Kuning/Merah, dst).
// Dipanggil dari renderEpiRows() -- otomatis ikut jalan tiap kali
// Nomor Kantong ditambah/dihapus, tanpa perlu dipanggil manual di
// tempat lain.
function syncZonaOtomatis(){
  const zSel = document.getElementById('kegiatanZona');
  if(!zSel) return;
  const opsiAman = Array.from(zSel.options).find(o=> o.value.toLowerCase()==='aman');
  if(epiRows.length === 0){
    if(opsiAman){
      zSel.value = opsiAman.value;
      zSel.disabled = true;
    }else{
      // Zona "Aman" belum diatur di tab Setting -> Input Zona -- tidak
      // bisa dikunci otomatis, biarkan admin memilih manual spt biasa
      // supaya form tetap bisa disimpan (menghindari field terkunci
      // kosong yang tidak bisa diisi).
      zSel.disabled = false;
    }
  }else{
    if(zSel.disabled){
      zSel.disabled = false;
      zSel.value = '';
    }
  }
}
function updateEpiKantong(rid, val){
  const r = epiRows.find(x=>x.rid===rid);
  if(r) r.nomorKantong = val;
}
function updateEpiJenisDonor(rid, val){
  const r = epiRows.find(x=>x.rid===rid);
  if(r) r.jenisDonor = val;
}
function updateEpiMetodePengujian(rid, val){
  const r = epiRows.find(x=>x.rid===rid);
  if(r) r.metodePengujian = val;
}
function addEpiParam(rid, param){
  const r = epiRows.find(x=>x.rid===rid);
  if(!r) return;
  if(!r.parameters.includes(param)) r.parameters.push(param);
  renderEpiRows();
}
function removeEpiParam(rid, param){
  const r = epiRows.find(x=>x.rid===rid);
  if(!r) return;
  r.parameters = r.parameters.filter(p=>p!==param);
  renderEpiRows();
}
function toggleParamPicker(rid){
  document.querySelectorAll('.param-picker').forEach(el=>{
    if(el.id !== 'paramPicker-'+rid) el.style.display = 'none';
  });
  const el = document.getElementById('paramPicker-'+rid);
  if(el) el.style.display = (el.style.display==='none' ? 'flex' : 'none');
}
// Klik di luar area "+ Tambah Parameter" menutup dropdown pilihan parameter yg terbuka.
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.param-add-wrap')){
    document.querySelectorAll('.param-picker').forEach(el=> el.style.display='none');
  }
});
function removeEpiRow(rid){
  epiRows = epiRows.filter(r=>r.rid!==rid);
  renderEpiRows();
}
document.getElementById('btnTambahEpi').addEventListener('click', ()=>{
  epiRows.push({rid:epiSeq++, nomorKantong:'', parameters:[], jenisDonor:'', metodePengujian:''});
  renderEpiRows();
});

function resetFormKegiatan(){
  formKegiatan.reset();
  document.getElementById('kegiatanId').value='';
  document.getElementById('kegiatanTempatId').value='';
  document.getElementById('placeCard').style.display='none';
  hideKegiatanCariSuggest();
  document.getElementById('kegiatanFormTitle').textContent = 'Input Kegiatan Donor';
  epiRows = [];
  renderEpiRows();
  recalcTotal();
  recalcGagalTotal();
}

formKegiatan.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const tempatId = parseInt(document.getElementById('kegiatanTempatId').value);
  const tanggal = document.getElementById('kegiatanTanggal').value;
  const zona = document.getElementById('kegiatanZona').value;

  if(!tempatId){ showToast('kegiatanToast','Pilih lokasi yang valid dari Master Data terlebih dahulu.','err'); return; }
  if(!tanggal){ showToast('kegiatanToast','Tanggal kegiatan wajib diisi.','err'); return; }
  if(!zona){ showToast('kegiatanToast','Zona wajib dipilih.','err'); return; }

  // Validasi data reaktif: tiap nomor kantong wajib diisi, wajib
  // direlasikan ke satu Jenis Donor & satu Metode Pengujian, dan minimal 1
  // parameter dipilih, dan nomor kantong tidak boleh diinput dobel dalam
  // satu kegiatan yang sama. Jenis Donor & Metode Pengujian HANYA
  // diwajibkan kalau daftarnya masing-masing sudah diisi admin lewat tab
  // Setting -- supaya kegiatan lama/pengguna yang belum sempat mengisi
  // daftar tsb tetap bisa menyimpan data seperti biasa (defensif, sama
  // pola dgn pengecekan zona "Aman" di syncZonaOtomatis()).
  const jenisDonorTersedia = getJenisDonorNamaList();
  const metodePengujianTersedia = getMetodePengujianNamaList();
  const seenKantong = new Set();
  for(const r of epiRows){
    const kantong = r.nomorKantong.trim();
    if(!kantong){
      showToast('kegiatanToast','Nomor Kantong pada data reaktif belum diisi.','err'); return;
    }
    if(jenisDonorTersedia.length>0 && !r.jenisDonor){
      showToast('kegiatanToast',`Pilih Jenis Donor untuk nomor kantong "${kantong}".`,'err'); return;
    }
    if(metodePengujianTersedia.length>0 && !r.metodePengujian){
      showToast('kegiatanToast',`Pilih Metode Pengujian untuk nomor kantong "${kantong}".`,'err'); return;
    }
    if(r.parameters.length===0){
      showToast('kegiatanToast',`Pilih minimal satu Parameter Reaktif untuk nomor kantong "${kantong}".`,'err'); return;
    }
    const key = kantong.toLowerCase();
    if(seenKantong.has(key)){
      showToast('kegiatanToast',`Nomor kantong "${kantong}" diinput lebih dari sekali pada kegiatan ini.`,'err'); return;
    }
    seenKantong.add(key);
  }

  const payload = {
    tempatId, tanggal, zona,
    gol:{
      A:parseInt(document.getElementById('golA').value)||0,
      B:parseInt(document.getElementById('golB').value)||0,
      AB:parseInt(document.getElementById('golAB').value)||0,
      O:parseInt(document.getElementById('golO').value)||0
    },
    gagal:{
      A:parseInt(document.getElementById('gagalA').value)||0,
      B:parseInt(document.getElementById('gagalB').value)||0,
      AB:parseInt(document.getElementById('gagalAB').value)||0,
      O:parseInt(document.getElementById('gagalO').value)||0
    },
    epi: epiRows.map(r=>({nomorKantong:r.nomorKantong.trim(), parameters:[...r.parameters], jenisDonor:r.jenisDonor||'', metodePengujian:r.metodePengujian||''}))
  };

  // Kalau Epidemiologi (skrining reaktif) dikosongkan (tidak ada Nomor
  // Kantong ditambahkan), Zona sudah otomatis terisi "Aman" & terkunci
  // (lihat syncZonaOtomatis di atas) -- tapi sebelum benar-benar
  // disimpan, tampilkan dulu pop-up konfirmasi di tengah layar supaya
  // admin sadar & MENGONFIRMASI bahwa kondisi tempat ini memang dicatat
  // "Aman" karena tidak ada hasil pengujian reaktif. Baru setelah admin
  // klik OK pada pop-up ini, data benar-benar disimpan. Kalau
  // Epidemiologi terisi (ada minimal 1 Nomor Kantong), simpan langsung
  // seperti biasa tanpa pop-up ini.
  if(epiRows.length === 0){
    askConfirm(
      'Kondisi "Aman"',
      'Epidemiologi (skrining reaktif) Anda kosongkan — kondisi di tempat ini akan dicatat sebagai "Aman" karena tidak ada hasil pengujian yang reaktif. Klik OK untuk menyimpan.',
      ()=> eksekusiSimpanKegiatan(payload),
      'OK, Simpan'
    );
  }else{
    await eksekusiSimpanKegiatan(payload);
  }
});

async function eksekusiSimpanKegiatan(payload){
  const idField = document.getElementById('kegiatanId').value;
  if(idField){
    const idx = state.kegiatan.findIndex(k=>k.id===parseInt(idField));
    if(idx>-1) state.kegiatan[idx] = {...state.kegiatan[idx], ...payload};
    showToast('kegiatanToast','Perubahan kegiatan berhasil disimpan.','ok');
  }else{
    payload.id = state.nextKegiatanId++;
    state.kegiatan.push(payload);
    showToast('kegiatanToast','Data kegiatan berhasil disimpan.','ok');
  }

  await persistKegiatan();
  resetFormKegiatan();
  renderAll();
}

document.getElementById('btnBatalKegiatan').addEventListener('click', resetFormKegiatan);

function editKegiatan(id){
  const k = state.kegiatan.find(x=>x.id===id);
  if(!k) return;
  const t = state.master.find(x=>x.id===k.tempatId);
  document.getElementById('kegiatanId').value = k.id;
  document.getElementById('kegiatanTempatId').value = k.tempatId;
  document.getElementById('kegiatanCari').value = t? t.nama : '';
  if(t) selectTempatByName(t.nama);
  document.getElementById('kegiatanTanggal').value = k.tanggal;
  document.getElementById('golA').value = k.gol.A;
  document.getElementById('golB').value = k.gol.B;
  document.getElementById('golAB').value = k.gol.AB;
  document.getElementById('golO').value = k.gol.O;
  recalcTotal();
  const gagal = k.gagal || {A:0,B:0,AB:0,O:0};
  document.getElementById('gagalA').value = gagal.A||0;
  document.getElementById('gagalB').value = gagal.B||0;
  document.getElementById('gagalAB').value = gagal.AB||0;
  document.getElementById('gagalO').value = gagal.O||0;
  recalcGagalTotal();
  epiRows = k.epi.map(r=>({rid:epiSeq++, ...normalizeEpiRow(r)}));
  renderEpiRows();
  // Cocokkan case-insensitive: data lama (sblm tab Setting -> Input Zona
  // ada) tersimpan huruf kecil (mis. "hijau"), sedangkan pilihan dropdown
  // sekarang memakai nama persis spt yg diinput admin (mis. "Hijau").
  // HANYA dimuat kalau kegiatan ini memang punya data Epidemiologi
  // (epiRows.length>0) -- kalau epidemiologi-nya kosong, renderEpiRows()
  // di atas sudah mengunci dropdown ke "Aman" lewat syncZonaOtomatis(),
  // jadi tidak perlu (dan tidak boleh) ditimpa lagi di sini.
  if(epiRows.length > 0){
    const zSel = document.getElementById('kegiatanZona');
    const zMatch = Array.from(zSel.options).find(o=>o.value.toLowerCase()===String(k.zona||'').toLowerCase());
    zSel.value = zMatch ? zMatch.value : k.zona;
  }
  document.getElementById('kegiatanFormTitle').textContent = 'Ubah Kegiatan: ' + (t?t.nama:'');
  window.scrollTo({top:0, behavior:'smooth'});
}

function deleteKegiatan(id){
  askConfirm('Hapus data kegiatan ini?','Riwayat kegiatan & epidemiologi terkait akan dihapus permanen.', async ()=>{
    state.kegiatan = state.kegiatan.filter(k=>k.id!==id);
    await persistKegiatan();
    renderAll();
  });
}

/* ---------- Pencarian, Filter Periode & Pagination: Riwayat Kegiatan ---
   Panel kanan tab 2 (Input Kegiatan & Epidemiologi). Pencarian mencocokkan
   Nama Tempat -- kalau ketemu, filter periode (rentang Dari Tanggal --
   Sampai Tanggal, kalau diisi) diterapkan DI ATAS hasil pencarian nama
   tempat itu. Kalau admin tidak memilih periode sama sekali, seluruh
   riwayat kegiatan dari tempat yang cocok tetap ditampilkan -- kalau
   hanya salah satu batas (dari/sampai) yang diisi, filter tetap berjalan
   sebagai batas terbuka di sisi yang kosong (mis. hanya isi "Dari" berarti
   tanggal tsb dan seterusnya, tanpa batas akhir).
   Pagination membatasi baris per halaman, aktif kalau total kegiatan sudah
   mencapai ambang batas (sama pola dengan Daftar Lokasi Terdaftar Tab 1). */
const kegiatanTableState = { query: '', tanggalDari: '', tanggalSampai: '', page: 1, pageSize: 10 };
const KEGIATAN_PAGINATION_MIN = 10; // pagination baru aktif kalau total kegiatan >= 10

function getFilteredKegiatanList(){
  const q = kegiatanTableState.query.trim();
  const dari = kegiatanTableState.tanggalDari;
  const sampai = kegiatanTableState.tanggalSampai;
  return state.kegiatan.filter(k=>{
    if(q){
      const t = state.master.find(x=>x.id===k.tempatId);
      const nama = t ? t.nama : '';
      if(!wordPrefixMatch(nama, q)) return false;
    }
    if(dari && k.tanggal < dari) return false;
    if(sampai && k.tanggal > sampai) return false;
    return true;
  });
}

function renderKegiatanTable(){
  const tbody = document.getElementById('tblKegiatan');
  const metaEl = document.getElementById('kegiatanTableMeta');
  const pagerEl = document.getElementById('kegiatanPagination');
  const btnPrev = document.getElementById('btnKegiatanPrev');
  const btnNext = document.getElementById('btnKegiatanNext');
  const total = state.kegiatan.length;
  const filtered = [...getFilteredKegiatanList()].sort((a,b)=> a.tanggal < b.tanggal ? 1 : -1);
  const filteredTotal = filtered.length;

  // Pagination baru aktif kalau jumlah kegiatan tercatat sudah minimal
  // KEGIATAN_PAGINATION_MIN. Di bawah itu, seluruh hasil langsung
  // ditampilkan tanpa navigasi halaman.
  const paginationActive = total >= KEGIATAN_PAGINATION_MIN;

  if(total === 0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Belum ada data kegiatan.</td></tr>`;
    pagerEl.style.display = 'none';
    return;
  }

  const hasFilter = !!(kegiatanTableState.query.trim() || kegiatanTableState.tanggalDari || kegiatanTableState.tanggalSampai);

  if(filteredTotal === 0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Riwayat kegiatan tidak ditemukan untuk pencarian/filter ini.</td></tr>`;
    if(paginationActive){
      pagerEl.style.display = 'flex';
      metaEl.innerHTML = `Tidak ada hasil dari total <b>${total}</b> kegiatan tercatat.`;
      btnPrev.disabled = true; btnNext.disabled = true;
    }else{
      pagerEl.style.display = 'none';
    }
    return;
  }

  if(!paginationActive){
    pagerEl.style.display = 'none';
    kegiatanTableState.page = 1;
    tbody.innerHTML = filtered.map(k=>renderKegiatanRow(k)).join('');
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filteredTotal / kegiatanTableState.pageSize));
  if(kegiatanTableState.page > totalPages) kegiatanTableState.page = totalPages;
  if(kegiatanTableState.page < 1) kegiatanTableState.page = 1;

  pagerEl.style.display = 'flex';
  const start = (kegiatanTableState.page - 1) * kegiatanTableState.pageSize;
  const pageItems = filtered.slice(start, start + kegiatanTableState.pageSize);

  tbody.innerHTML = pageItems.map(k=>renderKegiatanRow(k)).join('');

  const rangeAwal = start + 1;
  const rangeAkhir = Math.min(start + kegiatanTableState.pageSize, filteredTotal);
  const dataLabel = hasFilter
    ? `Menampilkan <b>${rangeAwal}–${rangeAkhir}</b> dari <b>${filteredTotal}</b> hasil pencarian/filter (total <b>${total}</b> kegiatan tercatat)`
    : `Menampilkan <b>${rangeAwal}–${rangeAkhir}</b> dari <b>${total}</b> kegiatan tercatat`;
  metaEl.innerHTML = `${dataLabel} &middot; Halaman <b>${kegiatanTableState.page}</b> dari <b>${totalPages}</b>`;

  btnPrev.disabled = kegiatanTableState.page <= 1;
  btnNext.disabled = kegiatanTableState.page >= totalPages;
}

function renderKegiatanRow(k){
  const t = state.master.find(x=>x.id===k.tempatId);
  // Berhasil = Sub Total Perolehan Pengambilan. Gagal Pengambilan = Sub
  // Total Gagal Pengambilan. Jumlah Keseluruhan = Berhasil + Gagal
  // (sama seperti rumus Total Pengambilan pada form). Reaktif TIDAK
  // dijumlahkan ke kolom manapun di atas -- itu hanya menandai berapa
  // nomor kantong, dari Berhasil, yang hasil skriningnya reaktif.
  const totalBerhasil = k.gol.A+k.gol.B+k.gol.AB+k.gol.O;
  const gagal = k.gagal || {A:0,B:0,AB:0,O:0};
  const totalGagal = (gagal.A||0)+(gagal.B||0)+(gagal.AB||0)+(gagal.O||0);
  const totalKeseluruhan = totalBerhasil + totalGagal;
  const totalReaktif = k.epi.length;
  return `
    <tr>
      <td class="mono">${fmtDate(k.tanggal)}</td>
      <td>${escapeHtml(t? t.nama : '(lokasi dihapus)')}</td>
      <td>${totalBerhasil}</td>
      <td>${totalGagal}</td>
      <td>${totalKeseluruhan}</td>
      <td>${totalReaktif||'—'}</td>
      <td>${zonaBadge(k.zona)}</td>
      <td style="white-space:nowrap;">
        <button class="icon-btn" onclick="showEpiDetail(${k.id})" title="Lihat detail kegiatan">🔍</button>
        <button class="icon-btn" onclick="editKegiatan(${k.id})">✏️</button>
        <button class="icon-btn" onclick="deleteKegiatan(${k.id})">🗑️</button>
      </td>
    </tr>`;
}

document.getElementById('btnKegiatanPrev').addEventListener('click', ()=>{
  if(kegiatanTableState.page <= 1) return;
  kegiatanTableState.page -= 1;
  renderKegiatanTable();
});
document.getElementById('btnKegiatanNext').addEventListener('click', ()=>{
  const totalPages = Math.max(1, Math.ceil(getFilteredKegiatanList().length / kegiatanTableState.pageSize));
  if(kegiatanTableState.page >= totalPages) return;
  kegiatanTableState.page += 1;
  renderKegiatanTable();
});

const kegiatanTableSearchInput = document.getElementById('kegiatanTableSearch');
const btnKegiatanTableSearchClear = document.getElementById('btnKegiatanTableSearchClear');
kegiatanTableSearchInput.addEventListener('input', ()=>{
  kegiatanTableState.query = kegiatanTableSearchInput.value;
  kegiatanTableState.page = 1;
  btnKegiatanTableSearchClear.classList.toggle('show', !!kegiatanTableSearchInput.value);
  renderKegiatanTable();
});
btnKegiatanTableSearchClear.addEventListener('click', ()=>{
  kegiatanTableSearchInput.value = '';
  kegiatanTableState.query = '';
  kegiatanTableState.page = 1;
  btnKegiatanTableSearchClear.classList.remove('show');
  renderKegiatanTable();
  kegiatanTableSearchInput.focus();
});

const kegiatanTableDateFromInput = document.getElementById('kegiatanTableDateFrom');
const kegiatanTableDateToInput = document.getElementById('kegiatanTableDateTo');
const btnKegiatanTableDateClear = document.getElementById('btnKegiatanTableDateClear');
function toggleKegiatanDateClearBtn(){
  btnKegiatanTableDateClear.classList.toggle('show', !!(kegiatanTableDateFromInput.value || kegiatanTableDateToInput.value));
}
kegiatanTableDateFromInput.addEventListener('input', ()=>{
  kegiatanTableState.tanggalDari = kegiatanTableDateFromInput.value;
  kegiatanTableState.page = 1;
  toggleKegiatanDateClearBtn();
  renderKegiatanTable();
});
kegiatanTableDateToInput.addEventListener('input', ()=>{
  kegiatanTableState.tanggalSampai = kegiatanTableDateToInput.value;
  kegiatanTableState.page = 1;
  toggleKegiatanDateClearBtn();
  renderKegiatanTable();
});
btnKegiatanTableDateClear.addEventListener('click', ()=>{
  kegiatanTableDateFromInput.value = '';
  kegiatanTableDateToInput.value = '';
  kegiatanTableState.tanggalDari = '';
  kegiatanTableState.tanggalSampai = '';
  kegiatanTableState.page = 1;
  btnKegiatanTableDateClear.classList.remove('show');
  renderKegiatanTable();
});

/* ---------- Modal: Detail Kegiatan (satu tombol "🔍" di kolom Aksi) ---
   Sebelumnya rincian reaktif dibuka lewat tombol "🔎 Detail" terpisah di
   kolom Reaktif. Sekarang digabung jadi SATU tombol "🔍" di kolom Aksi
   (sebelum tombol ✏️ Edit) yang menampilkan seluruhnya sekaligus: Jumlah
   Perolehan per Golongan Darah, Gagal Pengambilan, Jumlah Keseluruhan,
   dan rincian Epidemiologi (skrining reaktif) per nomor kantong. Angka
   Reaktif = banyaknya NOMOR KANTONG yang reaktif (bukan banyaknya
   parameter) -- satu kantong bisa reaktif di lebih dari satu parameter
   sekaligus, jadi tabelnya merinci per kantong parameter apa saja yang
   reaktif supaya tidak membingungkan. ------ */
let currentEpiDetailId = null; // id kegiatan yg sedang dibuka di modal Detail -- dipakai tombol unduh Excel/PDF
function showEpiDetail(id){
  const k = state.kegiatan.find(x=>x.id===id);
  if(!k) return;
  currentEpiDetailId = id;
  const t = state.master.find(x=>x.id===k.tempatId);
  const gagal = k.gagal || {A:0,B:0,AB:0,O:0};
  const totalBerhasil = k.gol.A+k.gol.B+k.gol.AB+k.gol.O;
  const totalGagal = (gagal.A||0)+(gagal.B||0)+(gagal.AB||0)+(gagal.O||0);

  document.getElementById('epiDetailTitle').textContent = 'Detail Kegiatan';
  document.getElementById('epiDetailSubtitle').textContent =
    `${t? t.nama : '(lokasi dihapus)'} · ${fmtDate(k.tanggal)}`;

  const golBox = (label,val)=> `<div class="gol-box"><span>${label}</span><b style="display:block;font-size:16px;">${val}</b></div>`;
  document.getElementById('epiDetailGolGrid').innerHTML =
    golBox('A',k.gol.A)+golBox('B',k.gol.B)+golBox('AB',k.gol.AB)+golBox('O',k.gol.O);
  document.getElementById('epiDetailGolTotal').textContent = totalBerhasil;

  document.getElementById('epiDetailGagalGrid').innerHTML =
    golBox('A',gagal.A||0)+golBox('B',gagal.B||0)+golBox('AB',gagal.AB||0)+golBox('O',gagal.O||0);
  document.getElementById('epiDetailGagalTotal').textContent = totalGagal;

  document.getElementById('epiDetailKeseluruhanTotal').textContent = totalBerhasil+totalGagal;

  const tbody = document.getElementById('tblEpiDetail');
  if(k.epi.length===0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Tidak ada nomor kantong reaktif pada kegiatan ini.</td></tr>`;
  }else{
    tbody.innerHTML = k.epi.map(r=>{
      const {nomorKantong, parameters, jenisDonor, metodePengujian} = normalizeEpiRow(r);
      return `
      <tr>
        <td class="mono">${escapeHtml(nomorKantong||'—')}</td>
        <td>${escapeHtml(jenisDonor||'—')}</td>
        <td>${escapeHtml(metodePengujian||'—')}</td>
        <td>${parameters.map(p=>`<span class="badge param">${p}</span>`).join(' ') || '—'}</td>
      </tr>`;
    }).join('');
  }
  document.getElementById('modalEpiDetail').classList.add('show');
}
document.getElementById('btnEpiDetailClose').addEventListener('click', ()=>{
  document.getElementById('modalEpiDetail').classList.remove('show');
});

/* ---------- Unduh rincian modal Detail Kegiatan (Excel / PDF) ----------
   Dipanggil dari tombol "⬇️ Excel (.xlsx)" / "⬇️ PDF" di modal Detail
   Kegiatan (lihat showEpiDetail di atas). Sengaja dibangun ulang dari
   `state.kegiatan` (bukan baca ulang dari DOM modal) memakai
   currentEpiDetailId, supaya angkanya konsisten dgn data sesungguhnya. */
function getEpiDetailExportData(id){
  const k = state.kegiatan.find(x=>x.id===id);
  if(!k) return null;
  const t = state.master.find(x=>x.id===k.tempatId);
  const gagal = k.gagal || {A:0,B:0,AB:0,O:0};
  const totalBerhasil = k.gol.A+k.gol.B+k.gol.AB+k.gol.O;
  const totalGagal = (gagal.A||0)+(gagal.B||0)+(gagal.AB||0)+(gagal.O||0);
  const epiRows = k.epi.map(r=>{
    const {nomorKantong, parameters, jenisDonor, metodePengujian} = normalizeEpiRow(r);
    return { nomorKantong: nomorKantong || '—', jenisDonor: jenisDonor || '—', metodePengujian: metodePengujian || '—', parameter: parameters.join(', ') || '—' };
  });
  return {
    namaTempat: t ? t.nama : '(lokasi dihapus)',
    tanggal: fmtDate(k.tanggal),
    gol: k.gol, totalBerhasil,
    gagal, totalGagal,
    totalKeseluruhan: totalBerhasil+totalGagal,
    epiRows
  };
}
function epiDetailFileBaseName(d){
  const namaSlug = (d.namaTempat||'lokasi').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  return `detail-kegiatan_${namaSlug}_${new Date().toISOString().slice(0,10)}`;
}

function downloadEpiDetailExcel(){
  if(typeof XLSX === 'undefined'){
    showToast('kegiatanToast','Gagal memuat pustaka Excel. Periksa koneksi internet lalu coba lagi.','err'); return;
  }
  const d = getEpiDetailExportData(currentEpiDetailId);
  if(!d) return;

  const aoa = [
    ['Detail Kegiatan'],
    [d.namaTempat, d.tanggal],
    [],
    ['Jumlah Perolehan per Golongan Darah'],
    ['A','B','AB','O','Sub Total Perolehan Pengambilan'],
    [d.gol.A, d.gol.B, d.gol.AB, d.gol.O, d.totalBerhasil],
    [],
    ['Gagal Pengambilan'],
    ['A','B','AB','O','Sub Total Gagal Pengambilan'],
    [d.gagal.A||0, d.gagal.B||0, d.gagal.AB||0, d.gagal.O||0, d.totalGagal],
    [],
    ['Jumlah Keseluruhan', d.totalKeseluruhan],
    [],
    ['Epidemiologi (skrining reaktif)'],
    ['No. Kantong','Jenis Donor','Metode Pengujian','Parameter Reaktif']
  ];
  if(d.epiRows.length===0){
    aoa.push(['Tidak ada nomor kantong reaktif pada kegiatan ini.','','','']);
  }else{
    d.epiRows.forEach(r=> aoa.push([r.nomorKantong, r.jenisDonor, r.metodePengujian, r.parameter]));
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{wch:22},{wch:22},{wch:14},{wch:10},{wch:32}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Detail Kegiatan');
  XLSX.writeFile(wb, epiDetailFileBaseName(d)+'.xlsx');
  showToast('kegiatanToast','Rincian berhasil diunduh sebagai Excel.','ok');
}
document.getElementById('btnEpiDetailExcel').addEventListener('click', downloadEpiDetailExcel);

function downloadEpiDetailPdf(){
  const jsPDFLib = window.jspdf && window.jspdf.jsPDF;
  if(typeof jsPDFLib === 'undefined'){
    showToast('kegiatanToast','Gagal memuat pustaka PDF. Periksa koneksi internet lalu coba lagi.','err'); return;
  }
  const d = getEpiDetailExportData(currentEpiDetailId);
  if(!d) return;

  const doc = new jsPDFLib({unit:'pt', format:'a4'});
  const marginL = 40;
  let y = 48;

  doc.setFont('helvetica','bold'); doc.setFontSize(15);
  doc.text('Detail Kegiatan', marginL, y);
  y += 20;
  doc.setFont('helvetica','normal'); doc.setFontSize(11); doc.setTextColor(90);
  doc.text(`${d.namaTempat} · ${d.tanggal}`, marginL, y);
  doc.setTextColor(20);
  y += 18;

  doc.autoTable({
    startY: y,
    head: [['Jumlah Perolehan per Golongan Darah','A','B','AB','O','Sub Total']],
    body: [['Perolehan Pengambilan', d.gol.A, d.gol.B, d.gol.AB, d.gol.O, d.totalBerhasil]],
    theme: 'grid', margin:{left:marginL,right:marginL}, styles:{fontSize:10}
  });
  y = doc.lastAutoTable.finalY + 12;

  doc.autoTable({
    startY: y,
    head: [['Gagal Pengambilan','A','B','AB','O','Sub Total']],
    body: [['Gagal Pengambilan', d.gagal.A||0, d.gagal.B||0, d.gagal.AB||0, d.gagal.O||0, d.totalGagal]],
    theme: 'grid', margin:{left:marginL,right:marginL}, styles:{fontSize:10}
  });
  y = doc.lastAutoTable.finalY + 12;

  doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.text(`Jumlah Keseluruhan: ${d.totalKeseluruhan}`, marginL, y);
  y += 16;

  doc.autoTable({
    startY: y,
    head: [['No. Kantong','Jenis Donor','Metode Pengujian','Parameter Reaktif']],
    body: d.epiRows.length ? d.epiRows.map(r=>[r.nomorKantong, r.jenisDonor, r.metodePengujian, r.parameter]) : [['Tidak ada nomor kantong reaktif pada kegiatan ini.','','','']],
    theme: 'grid', margin:{left:marginL,right:marginL}, styles:{fontSize:10},
    headStyles:{fillColor:[123,26,26]}
  });

  doc.save(epiDetailFileBaseName(d)+'.pdf');
  showToast('kegiatanToast','Rincian berhasil diunduh sebagai PDF.','ok');
}
document.getElementById('btnEpiDetailPdf').addEventListener('click', downloadEpiDetailPdf);

