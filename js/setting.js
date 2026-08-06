/* ===================================================================
   TAB 5 : SETTING — INPUT DATA KECAMATAN
   Mengelola daftar Kecamatan (+ Wilayah masing-masing) yang menjadi
   sumber isian dropdown "Kecamatan" dan "Wilayah" pada Tab 1 (Master
   Data) dan dropdown filter Wilayah pada Tab 3 (Laporan). Sebelumnya
   Kecamatan berupa kolom teks bebas dan Wilayah berupa daftar tetap
   (hardcode) -- sekarang keduanya diatur oleh admin lewat tab ini.
=================================================================== */
const formKecamatan = document.getElementById('formKecamatan');

function resetFormKecamatan(){
  formKecamatan.reset();
  document.getElementById('kecamatanId').value = '';
  document.getElementById('kecamatanFormTitle').textContent = 'Input Data Kecamatan';
}

attachInputSanitizer('settingKecamatanNama', sanitizeHurufAngkaSpasi);
attachInputSanitizer('settingKecamatanWilayah', sanitizeHurufAngkaSpasi);
attachInputSanitizer('settingKecamatanZona', sanitizeHurufAngkaSpasi);

formKecamatan.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nama = document.getElementById('settingKecamatanNama').value.trim();
  const wilayah = document.getElementById('settingKecamatanWilayah').value.trim();
  const zona = document.getElementById('settingKecamatanZona').value.trim();
  const idField = document.getElementById('kecamatanId').value;

  if(!nama || !wilayah || !zona){
    showToast('settingToast','Kecamatan, Wilayah, dan Zona Wilayah wajib diisi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(nama)){
    showToast('settingToast','Kecamatan hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(wilayah)){
    showToast('settingToast','Wilayah hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(zona)){
    showToast('settingToast','Zona Wilayah hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }

  // Cegah nama kecamatan dobel (case-insensitive), kecuali data itu sendiri saat mengubah
  const dup = state.kecamatanList.find(k=>
    k.nama.toLowerCase()===nama.toLowerCase() && String(k.id)!==idField);
  if(dup){
    showToast('settingToast','Nama Kecamatan ini sudah terdaftar.','err'); return;
  }

  if(idField){
    const idx = state.kecamatanList.findIndex(k=>k.id===parseInt(idField));
    if(idx>-1){
      const old = state.kecamatanList[idx];
      // Kalau nama/wilayah/zona kecamatan diubah, sinkronkan juga ke lokasi
      // Master Data yang sebelumnya sudah memakai nama kecamatan lama --
      // supaya tidak ada data yang "yatim" (tidak cocok pilihan dropdown lagi).
      if(old.nama !== nama || old.wilayah !== wilayah || old.zona !== zona){
        state.master.forEach(t=>{
          if(t.kecamatan === old.nama){ t.kecamatan = nama; t.wilayah = wilayah; t.zona = zona; }
        });
        await persistMaster();
      }
      state.kecamatanList[idx] = {...old, nama, wilayah, zona};
    }
    showToast('settingToast','Perubahan data kecamatan berhasil disimpan.','ok');
  }else{
    state.kecamatanList.push({id: state.nextKecamatanId++, nama, wilayah, zona});
    showToast('settingToast','Kecamatan baru berhasil ditambahkan.','ok');
  }

  await persistKecamatanList();
  resetFormKecamatan();
  renderKecamatanSettingTable();
  populateKecamatanDropdown();
  populateWilayahDropdowns();
  populateZonaWilayahDropdowns();
  renderMasterTable();
});

document.getElementById('btnBatalKecamatan').addEventListener('click', resetFormKecamatan);

function editKecamatan(id){
  const k = state.kecamatanList.find(x=>x.id===id);
  if(!k) return;
  document.getElementById('kecamatanId').value = k.id;
  document.getElementById('settingKecamatanNama').value = k.nama;
  document.getElementById('settingKecamatanWilayah').value = k.wilayah;
  document.getElementById('settingKecamatanZona').value = k.zona||'';
  document.getElementById('kecamatanFormTitle').textContent = 'Ubah Kecamatan: ' + k.nama;
  window.scrollTo({top:0, behavior:'smooth'});
}

function deleteKecamatan(id){
  const k = state.kecamatanList.find(x=>x.id===id);
  if(!k) return;
  const terpakai = state.master.some(t=>t.kecamatan===k.nama);
  askConfirm(
    'Hapus kecamatan ini?',
    terpakai
      ? `"${k.nama}" masih dipakai oleh lokasi di Master Data. Data lokasi tsb TIDAK akan terhapus, tapi kolom Kecamatan-nya perlu dipilih ulang.`
      : `Kecamatan "${k.nama}" akan dihapus permanen.`,
    async ()=>{
      state.kecamatanList = state.kecamatanList.filter(x=>x.id!==id);
      await persistKecamatanList();
      renderKecamatanSettingTable();
      populateKecamatanDropdown();
      populateWilayahDropdowns();
      populateZonaWilayahDropdowns();
    }
  );
}

function renderKecamatanSettingTable(){
  const tbody = document.getElementById('tblKecamatan');
  if(state.kecamatanList.length===0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Belum ada data kecamatan. Tambahkan lewat form di samping.</td></tr>`; return;
  }
  tbody.innerHTML = state.kecamatanList.slice().sort((a,b)=>a.nama.localeCompare(b.nama)).map(k=>`
    <tr>
      <td class="mono">${k.id}</td>
      <td><b>${escapeHtml(k.nama)}</b></td>
      <td>${escapeHtml(k.wilayah)}</td>
      <td>${escapeHtml(k.zona||'—')}</td>
      <td style="white-space:nowrap;">
        <button class="icon-btn" onclick="editKecamatan(${k.id})">✏️ Edit</button>
        <button class="icon-btn" onclick="deleteKecamatan(${k.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

/* ---------- Populasi dropdown Kecamatan & Wilayah (dipakai Tab 1 & 3) --- */
function populateKecamatanDropdown(){
  const sel = document.getElementById('masterKecamatan');
  if(!sel) return;
  const current = sel.value;
  const sorted = state.kecamatanList.slice().sort((a,b)=>a.nama.localeCompare(b.nama));
  sel.innerHTML = `<option value="">— pilih kecamatan —</option>` +
    sorted.map(k=>`<option value="${escapeHtml(k.nama)}">${escapeHtml(k.nama)}</option>`).join('');
  if(sorted.some(k=>k.nama===current)) sel.value = current;
  syncComboDisplay('masterKecamatan');
}

function populateWilayahDropdowns(){
  // Kumpulkan nama Wilayah unik (case-insensitive) dari seluruh data Kecamatan
  const seen = new Map();
  state.kecamatanList.forEach(k=>{
    const key = k.wilayah.toLowerCase();
    if(!seen.has(key)) seen.set(key, k.wilayah);
  });
  const wilayahNames = Array.from(seen.values()).sort((a,b)=>a.localeCompare(b));

  const masterSel = document.getElementById('masterWilayah');
  if(masterSel){
    const current = masterSel.value;
    masterSel.innerHTML = `<option value="">— pilih wilayah —</option>` +
      wilayahNames.map(w=>`<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`).join('');
    if(wilayahNames.includes(current)) masterSel.value = current;
    syncComboDisplay('masterWilayah');
  }

  const filterSel = document.getElementById('filterWilayah');
  if(filterSel){
    const current = filterSel.value;
    filterSel.innerHTML = `<option value="">Semua Wilayah</option>` +
      wilayahNames.map(w=>`<option value="${escapeHtml(w)}">${escapeHtml(w)}</option>`).join('');
    if(wilayahNames.includes(current)) filterSel.value = current;
  }
}

// Populasi dropdown Zona Wilayah (Tab 1) dari data Kecamatan pada tab
// Setting -- sama pola dengan populateWilayahDropdowns di atas, tapi
// mengumpulkan nilai unik dari kolom "zona".
function populateZonaWilayahDropdowns(){
  const seen = new Map();
  state.kecamatanList.forEach(k=>{
    if(!k.zona) return;
    const key = k.zona.toLowerCase();
    if(!seen.has(key)) seen.set(key, k.zona);
  });
  const zonaNames = Array.from(seen.values()).sort((a,b)=>a.localeCompare(b));

  const masterSel = document.getElementById('masterZonaWilayah');
  if(masterSel){
    const current = masterSel.value;
    masterSel.innerHTML = `<option value="">— pilih zona wilayah —</option>` +
      zonaNames.map(z=>`<option value="${escapeHtml(z)}">${escapeHtml(z)}</option>`).join('');
    if(zonaNames.includes(current)) masterSel.value = current;
    syncComboDisplay('masterZonaWilayah');
  }
}

// Memilih Kecamatan di Tab 1 otomatis mengisi Wilayah & Zona Wilayah
// terkait (mirip perilaku autocomplete sebelumnya), lalu memicu pencarian
// koordinat.
document.getElementById('masterKecamatan').addEventListener('change', ()=>{
  const namaKec = document.getElementById('masterKecamatan').value;
  const k = state.kecamatanList.find(x=>x.nama===namaKec);
  if(k){
    document.getElementById('masterWilayah').value = k.wilayah;
    document.getElementById('masterZonaWilayah').value = k.zona||'';
    syncComboDisplay('masterWilayah');
    syncComboDisplay('masterZonaWilayah');
  }
});

/* ===================================================================
   TAB 5 : SETTING — INPUT PARAMETER
   Mengelola daftar Parameter (HBsAg, HIV, HCV, Sifilis, dst) yang
   menjadi sumber pilihan "Parameter Reaktif" pada Tab 2 (Input Kegiatan
   & Epidemiologi) bagian Epidemiologi (skrining reaktif) -- dan sumber
   kartu ringkasan per parameter pada Tab 3 (Laporan). Sebelumnya daftar
   ini tetap (hardcode: HBsAg/HIV/HCV/Sifilis) -- sekarang diatur bebas
   oleh admin lewat tab ini, dengan pola yang sama persis dengan panel
   "Input Data Kecamatan" di atas.
=================================================================== */
const formParameter = document.getElementById('formParameter');

function resetFormParameter(){
  formParameter.reset();
  document.getElementById('parameterId').value = '';
  document.getElementById('parameterFormTitle').textContent = 'Input Parameter';
}

attachInputSanitizer('settingParameterNama', sanitizeHurufAngkaSpasi);

formParameter.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nama = document.getElementById('settingParameterNama').value.trim();
  const idField = document.getElementById('parameterId').value;

  if(!nama){
    showToast('parameterToast','Nama Parameter wajib diisi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(nama)){
    showToast('parameterToast','Nama Parameter hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }

  // Cegah nama parameter dobel (case-insensitive), kecuali data itu sendiri saat mengubah
  const dup = state.parameterList.find(p=>
    p.nama.toLowerCase()===nama.toLowerCase() && String(p.id)!==idField);
  if(dup){
    showToast('parameterToast','Nama Parameter ini sudah terdaftar.','err'); return;
  }

  if(idField){
    const idx = state.parameterList.findIndex(p=>p.id===parseInt(idField));
    if(idx>-1){
      const old = state.parameterList[idx];
      // Kalau nama parameter diubah, sinkronkan juga ke seluruh riwayat
      // kegiatan yang sudah memakai nama parameter lama pada data reaktifnya
      // -- supaya riwayat lama tidak "yatim" (tidak cocok nama lagi).
      if(old.nama !== nama){
        let changed = false;
        state.kegiatan.forEach(k=>{
          k.epi.forEach(r=>{
            const norm = normalizeEpiRow(r);
            if(norm.parameters.includes(old.nama)){
              r.parameters = norm.parameters.map(p=> p===old.nama ? nama : p);
              delete r.jenis; // format data lama, sudah dipindah ke r.parameters
              changed = true;
            }
          });
        });
        if(changed) await persistKegiatan();
      }
      state.parameterList[idx] = {...old, nama};
    }
    showToast('parameterToast','Perubahan data parameter berhasil disimpan.','ok');
  }else{
    state.parameterList.push({id: state.nextParameterId++, nama});
    showToast('parameterToast','Parameter baru berhasil ditambahkan.','ok');
  }

  await persistParameterList();
  resetFormParameter();
  renderParameterSettingTable();
  renderEpiRows();
  renderLaporan();
});

document.getElementById('btnBatalParameter').addEventListener('click', resetFormParameter);

function editParameter(id){
  const p = state.parameterList.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('parameterId').value = p.id;
  document.getElementById('settingParameterNama').value = p.nama;
  document.getElementById('parameterFormTitle').textContent = 'Ubah Parameter: ' + p.nama;
  window.scrollTo({top:0, behavior:'smooth'});
}

function deleteParameter(id){
  const p = state.parameterList.find(x=>x.id===id);
  if(!p) return;
  const terpakai = state.kegiatan.some(k=> k.epi.some(r=> normalizeEpiRow(r).parameters.includes(p.nama)));
  askConfirm(
    'Hapus parameter ini?',
    terpakai
      ? `"${p.nama}" masih tercatat dipakai pada riwayat kegiatan. Riwayat kegiatan tsb TIDAK akan terhapus, tapi parameter "${p.nama}" tidak akan muncul lagi sebagai pilihan baru pada Tab 2.`
      : `Parameter "${p.nama}" akan dihapus permanen.`,
    async ()=>{
      state.parameterList = state.parameterList.filter(x=>x.id!==id);
      await persistParameterList();
      renderParameterSettingTable();
      renderEpiRows();
      renderLaporan();
    }
  );
}

function renderParameterSettingTable(){
  const tbody = document.getElementById('tblParameter');
  if(state.parameterList.length===0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="3">Belum ada data parameter. Tambahkan lewat form di samping.</td></tr>`; return;
  }
  tbody.innerHTML = state.parameterList.slice().sort((a,b)=>a.nama.localeCompare(b.nama)).map(p=>`
    <tr>
      <td class="mono">${p.id}</td>
      <td><b>${escapeHtml(p.nama)}</b></td>
      <td style="white-space:nowrap;">
        <button class="icon-btn" onclick="editParameter(${p.id})">✏️ Edit</button>
        <button class="icon-btn" onclick="deleteParameter(${p.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

/* ===================================================================
   TAB 5 : SETTING — INPUT ZONA
   Mengelola daftar Zona (nama + warna) yang menjadi sumber pilihan
   dropdown "Zona" pada Tab 2 (Input Kegiatan & Epidemiologi) dan filter
   "Jenis Zona" pada Tab 3 (Laporan) -- warnanya jg dipakai utk mewarnai
   pin peta, badge Zona/Reaktif pada tabel Riwayat Kegiatan & Laporan, dan
   Legenda peta. Sebelumnya daftar zona (Hijau/Kuning/Merah) tetap
   (hardcode) dgn warna tetap -- sekarang diatur bebas oleh admin lewat
   panel ini, dengan pola yang sama persis dgn panel "Input Data
   Kecamatan" & "Input Parameter" di atas, ditambah kotak pilihan warna
   (minimal 20 warna berbeda, lihat ZONA_COLOR_PALETTE di state.js) supaya
   ke depannya kalau perlu menambah zona baru dgn warna berbeda tinggal
   lewat panel ini, TANPA perlu mengubah kode aplikasi (peta, badge, dan
   legenda semuanya membaca warna dari state.zonaList secara langsung).
=================================================================== */
const formZona = document.getElementById('formZona');
let zonaSelectedColor = '';

function renderZonaColorGrid(){
  const grid = document.getElementById('zonaColorGrid');
  if(!grid) return;
  grid.innerHTML = ZONA_COLOR_PALETTE.map(hex=>`
    <button type="button" class="zona-color-swatch${hex.toLowerCase()===zonaSelectedColor.toLowerCase()?' selected':''}"
      style="background:${hex};" data-color="${hex}" title="${hex}"
      onclick="pickZonaColor('${hex}')" aria-label="Pilih warna ${hex}"></button>
  `).join('');
}
function pickZonaColor(hex){
  zonaSelectedColor = hex;
  document.getElementById('settingZonaWarna').value = hex;
  document.getElementById('zonaColorCurrentSwatch').style.background = hex;
  document.getElementById('zonaColorCurrentLabel').textContent = hex.toUpperCase();
  renderZonaColorGrid();
}

function resetFormZona(){
  formZona.reset();
  document.getElementById('zonaId').value = '';
  document.getElementById('zonaFormTitle').textContent = 'Input Zona';
  zonaSelectedColor = '';
  document.getElementById('settingZonaWarna').value = '';
  document.getElementById('zonaColorCurrentSwatch').style.background = '';
  document.getElementById('zonaColorCurrentLabel').textContent = 'Belum dipilih';
  renderZonaColorGrid();
}

attachInputSanitizer('settingZonaNama', sanitizeHurufAngkaSpasi);

formZona.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nama = document.getElementById('settingZonaNama').value.trim();
  const warna = document.getElementById('settingZonaWarna').value;
  const idField = document.getElementById('zonaId').value;

  if(!nama){
    showToast('zonaToast','Nama Zona wajib diisi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(nama)){
    showToast('zonaToast','Nama Zona hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!warna){
    showToast('zonaToast','Pilih salah satu warna zona terlebih dahulu.','err'); return;
  }

  // Cegah nama zona dobel (case-insensitive), kecuali data itu sendiri saat mengubah
  const dup = state.zonaList.find(z=>
    z.nama.toLowerCase()===nama.toLowerCase() && String(z.id)!==idField);
  if(dup){
    showToast('zonaToast','Nama Zona ini sudah terdaftar.','err'); return;
  }

  if(idField){
    const idx = state.zonaList.findIndex(z=>z.id===parseInt(idField));
    if(idx>-1){
      const old = state.zonaList[idx];
      // Kalau NAMA zona diubah, sinkronkan jg ke seluruh riwayat kegiatan
      // yang sudah memakai nama zona lama -- supaya riwayat lama tidak
      // "yatim" (tidak cocok pilihan dropdown lagi). Perubahan warna saja
      // (nama tetap) TIDAK perlu disinkronkan krn warna selalu diambil
      // ulang dari state.zonaList saat dirender di peta/badge/legenda
      // (bukan disalin ke tiap kegiatan).
      if(old.nama.toLowerCase() !== nama.toLowerCase()){
        let changed = false;
        state.kegiatan.forEach(k=>{
          if((k.zona||'').toLowerCase()===old.nama.toLowerCase()){ k.zona = nama; changed = true; }
        });
        if(changed) await persistKegiatan();
      }
      state.zonaList[idx] = {...old, nama, warna};
    }
    showToast('zonaToast','Perubahan data zona berhasil disimpan.','ok');
  }else{
    state.zonaList.push({id: state.nextZonaId++, nama, warna});
    showToast('zonaToast','Zona baru berhasil ditambahkan.','ok');
  }

  await persistZonaList();
  resetFormZona();
  renderZonaSettingTable();
  populateKegiatanZonaDropdown();
  populateFilterZonaDropdown();
  renderLegend();
  renderMap();
  renderKegiatanTable();
  renderTopbarStats();
});

document.getElementById('btnBatalZona').addEventListener('click', resetFormZona);

function editZona(id){
  const z = state.zonaList.find(x=>x.id===id);
  if(!z) return;
  document.getElementById('zonaId').value = z.id;
  document.getElementById('settingZonaNama').value = z.nama;
  pickZonaColor(z.warna);
  document.getElementById('zonaFormTitle').textContent = 'Ubah Zona: ' + z.nama;
  window.scrollTo({top:0, behavior:'smooth'});
}

function deleteZona(id){
  const z = state.zonaList.find(x=>x.id===id);
  if(!z) return;
  const terpakai = state.kegiatan.some(k=>(k.zona||'').toLowerCase()===z.nama.toLowerCase());
  askConfirm(
    'Hapus zona ini?',
    terpakai
      ? `"${z.nama}" masih tercatat dipakai pada riwayat kegiatan. Riwayat kegiatan tsb TIDAK akan terhapus, tapi zona "${z.nama}" tidak akan muncul lagi sebagai pilihan baru, dan pin/badge terkait akan tampil netral (abu-abu) sampai kegiatan tsb diubah ke zona lain.`
      : `Zona "${z.nama}" akan dihapus permanen.`,
    async ()=>{
      state.zonaList = state.zonaList.filter(x=>x.id!==id);
      await persistZonaList();
      renderZonaSettingTable();
      populateKegiatanZonaDropdown();
      populateFilterZonaDropdown();
      renderLegend();
      renderMap();
      renderKegiatanTable();
      renderTopbarStats();
    }
  );
}

function renderZonaSettingTable(){
  const tbody = document.getElementById('tblZona');
  if(state.zonaList.length===0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Belum ada data zona. Tambahkan lewat form di samping.</td></tr>`; return;
  }
  tbody.innerHTML = state.zonaList.slice().sort((a,b)=>a.nama.localeCompare(b.nama)).map(z=>`
    <tr>
      <td class="mono">${z.id}</td>
      <td><b>${escapeHtml(z.nama)}</b></td>
      <td><span class="zona-table-swatch" style="background:${z.warna};"></span><span class="mono">${escapeHtml(z.warna)}</span></td>
      <td style="white-space:nowrap;">
        <button class="icon-btn" onclick="editZona(${z.id})">✏️ Edit</button>
        <button class="icon-btn" onclick="deleteZona(${z.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

/* ---------- Populasi dropdown Zona (Tab 2 Input Kegiatan) & filter Zona
   (Tab 3 Laporan) dari data Zona pada panel di atas -- sama pola dgn
   populateKecamatanDropdown()/populateWilayahDropdowns() sebelumnya. --- */
function populateKegiatanZonaDropdown(){
  const sel = document.getElementById('kegiatanZona');
  if(!sel) return;
  const current = sel.value;
  const sorted = state.zonaList.slice().sort((a,b)=>a.nama.localeCompare(b.nama));
  sel.innerHTML = `<option value="">— pilih zona —</option>` +
    sorted.map(z=>`<option value="${escapeHtml(z.nama)}">${escapeHtml(z.nama)}</option>`).join('');
  if(sorted.some(z=>z.nama===current)) sel.value = current;
}
function populateFilterZonaDropdown(){
  const sel = document.getElementById('filterZona');
  if(!sel) return;
  const current = sel.value;
  const sorted = state.zonaList.slice().sort((a,b)=>a.nama.localeCompare(b.nama));
  sel.innerHTML = `<option value="">Semua</option>` +
    sorted.map(z=>`<option value="${escapeHtml(z.nama)}">Zona ${escapeHtml(z.nama)}</option>`).join('');
  if(sorted.some(z=>z.nama===current)) sel.value = current;
}

renderZonaColorGrid();
