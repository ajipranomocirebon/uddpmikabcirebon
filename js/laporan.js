/* ===================================================================
   LAPORAN
   ------------------------------------------------------------------
   - User 2: hanya boleh melihat versi RINGKAS dari laporan ini --
     kartu ringkasan per-parameter (HBSAG/HCV/HIV/SIFILIS) disembunyikan
     total, dan tabel detail hanya menampilkan kolom Tanggal, Tempat,
     Wilayah, Kecamatan, Zona (kolom No. Kantong/Jenis Donor/Metode
     Pengujian/Parameter Reaktif ikut disembunyikan karena berisi hasil
     skrining per-donor yang sifatnya lebih sensitif).
   - Administrator & User 1: tetap melihat laporan lengkap seperti biasa.
=================================================================== */
function isUser2(){
  return !!(currentUser && currentUser.role==='user' && currentUser.level==='user2');
}

function renderLaporan(){
  const dari = document.getElementById('filterDari').value;
  const sampai = document.getElementById('filterSampai').value;
  const wilayah = document.getElementById('filterWilayah').value;
  const zonaFilter = document.getElementById('filterZona').value;

  // Judul kecil di atas kartu ringkasan+tabel, menampilkan filter yang
  // sedang aktif -- ikut tertangkap saat fitur screenshot dipakai supaya
  // gambar hasil tetap jelas konteksnya (periode/wilayah/zona apa).
  const titleEl = document.getElementById('laporanReportTitle');
  if(titleEl) titleEl.textContent = buildLaporanFilterLabel(dari, sampai, wilayah, zonaFilter);

  let rows = state.kegiatan.filter(k=>{
    if(dari && k.tanggal < dari) return false;
    if(sampai && k.tanggal > sampai) return false;
    if(wilayah){
      const t = state.master.find(x=>x.id===k.tempatId);
      if(!t || t.wilayah!==wilayah) return false;
    }
    if(zonaFilter && (k.zona||'').toLowerCase()!==zonaFilter.toLowerCase()) return false;
    return true;
  });

  const jenisList = getJenisList();
  const counts = {};
  jenisList.forEach(j=>{ counts[j] = 0; });
  const detail = [];
  rows.forEach(k=>{
    const t = state.master.find(x=>x.id===k.tempatId);
    k.epi.forEach(e=>{
      const {nomorKantong, parameters, jenisDonor, metodePengujian} = normalizeEpiRow(e);
      // Tiap parameter yang reaktif pada nomor kantong ini dihitung 1x
      // pada rekap per parameter (satu kantong bisa menyumbang ke lebih
      // dari satu parameter sekaligus).
      parameters.forEach(p=>{ counts[p] = (counts[p]||0) + 1; });
      detail.push({tanggal:k.tanggal, tempat:t?t.nama:'—', wilayah:t?t.wilayah:'—', kecamatan:t?t.kecamatan:'—', nomorKantong, jenisDonor, metodePengujian, parameters, zona:k.zona});
    });
  });

  // update peta: tampilkan hanya lokasi (nama tempat, kecamatan, wilayah)
  // yang punya kegiatan sesuai filter periode/wilayah di atas, dgn warna
  // pin = zona kegiatan terbarunya DI DALAM rentang filter tsb.
  const jumlahLokasi = renderMapReport(rows);
  const infoEl = document.getElementById('laporanMapInfo');
  if(infoEl){
    infoEl.textContent = jumlahLokasi>0
      ? `📍 ${jumlahLokasi} lokasi ditampilkan pada peta untuk periode/filter ini.`
      : '📍 Tidak ada lokasi dengan kegiatan pada periode/filter ini untuk ditampilkan di peta.';
  }

  const restricted = isUser2();

  // Kartu ringkasan per-parameter (HBSAG/HCV/HIV/SIFILIS): disembunyikan
  // total untuk User 2, ditampilkan seperti biasa untuk Administrator/User 1.
  const summaryEl = document.getElementById('summaryGrid');
  if(restricted){
    summaryEl.style.display = 'none';
    summaryEl.innerHTML = '';
  }else{
    summaryEl.style.display = '';
    const maxCount = Math.max(1, ...Object.values(counts));
    summaryEl.innerHTML = jenisList.map(j=>`
      <div class="sum-card">
        <span>${j}</span>
        <b>${counts[j]||0}</b>
        <div class="bar-track"><div class="bar-fill" style="width:${(counts[j]||0)/maxCount*100}%"></div></div>
      </div>
    `).join('');
  }

  // Header tabel: versi ringkas (5 kolom) utk User 2, versi lengkap
  // (8 kolom, termasuk No. Kantong/Jenis Donor/Metode/Parameter Reaktif)
  // utk Administrator & User 1.
  const theadRow = document.getElementById('laporanTableHead');
  const colCount = restricted ? 5 : 8;
  if(theadRow){
    theadRow.innerHTML = restricted
      ? `<th>Tanggal</th><th>Tempat</th><th>Wilayah</th><th>Kecamatan</th><th>Zona</th>`
      : `<th>Tanggal</th><th>Tempat</th><th>Wilayah</th><th>No. Kantong</th><th>Jenis Donor</th><th>Metode Pengujian</th><th>Parameter Reaktif</th><th>Zona</th>`;
  }

  const tbody = document.getElementById('tblLaporan');
  if(detail.length===0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${colCount}">Tidak ada data reaktif pada periode/filter ini.</td></tr>`; return;
  }
  detail.sort((a,b)=> a.tanggal < b.tanggal ? 1 : -1);
  tbody.innerHTML = detail.map(d=> restricted ? `
    <tr>
      <td class="mono">${fmtDate(d.tanggal)}</td>
      <td>${escapeHtml(d.tempat)}</td>
      <td>${escapeHtml(d.wilayah)}</td>
      <td>${escapeHtml(d.kecamatan||'—')}</td>
      <td>${zonaBadge(d.zona)}</td>
    </tr>
  ` : `
    <tr>
      <td class="mono">${fmtDate(d.tanggal)}</td>
      <td>${escapeHtml(d.tempat)}</td>
      <td>${escapeHtml(d.wilayah)}</td>
      <td class="mono">${escapeHtml(d.nomorKantong||'—')}</td>
      <td>${escapeHtml(d.jenisDonor||'—')}</td>
      <td>${escapeHtml(d.metodePengujian||'—')}</td>
      <td>${d.parameters.map(p=>`<span class="badge param">${p}</span>`).join(' ') || '—'}</td>
      <td>${zonaBadge(d.zona)}</td>
    </tr>
  `).join('');
}
document.getElementById('btnTampilkanLaporan').addEventListener('click', renderLaporan);

// Tombol utk kembali menampilkan SEMUA lokasi di peta (zona terbaru
// keseluruhan, sama seperti tampilan peta di tab lain) -- berguna
// setelah user selesai melihat hasil filter periode/wilayah.
document.getElementById('btnResetPetaLaporan').addEventListener('click', ()=>{
  renderMap();
  const infoEl = document.getElementById('laporanMapInfo');
  if(infoEl) infoEl.textContent = '📍 Menampilkan semua lokasi (zona terbaru keseluruhan).';
});

function buildLaporanFilterLabel(dari, sampai, wilayah, zonaFilter){
  const periode = (dari || sampai) ? `${dari?fmtDate(dari):'…'} – ${sampai?fmtDate(sampai):'…'}` : 'Semua Periode';
  const wilayahLabel = wilayah || 'Semua Wilayah';
  const zonaLabel = zonaFilter ? `Zona ${zonaFilter}` : `Semua Zona (${getZonaNamaList().join('/')||'-'})`;
  return `Periode: ${periode}  ·  Wilayah: ${wilayahLabel}  ·  ${zonaLabel}`;
}

/* ---------- Screenshot peta + laporan (tab 3) ----------
   Menangkap area peta (yg sedang menampilkan pin sesuai filter aktif) dan
   kartu ringkasan+tabel laporan, lalu menggabungkan keduanya jadi SATU
   file gambar PNG yang otomatis terunduh ke perangkat. Memakai pustaka
   html2canvas (dimuat via CDN, lihat index.html). */
async function screenshotLaporan(){
  const btn = document.getElementById('btnScreenshotLaporan');
  if(typeof html2canvas === 'undefined'){
    showToast('laporanToast','Gagal memuat pustaka screenshot. Periksa koneksi internet lalu coba lagi.','err');
    return;
  }
  const mapEl = document.querySelector('.map-wrap');
  const cardEl = document.getElementById('laporanReportCard');
  if(!mapEl || !cardEl) return;

  const originalLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Memproses…';
  // .capturing: sementara meniadakan batas tinggi/scroll tabel & memberi
  // padding+latar putih supaya tabel penuh & kartu rapi ikut tertangkap.
  cardEl.classList.add('capturing');

  try{
    if(document.fonts && document.fonts.ready){ await document.fonts.ready.catch(()=>{}); }

    const opts = { useCORS:true, allowTaint:false, backgroundColor:'#ffffff', scale:Math.min(2, window.devicePixelRatio||1), logging:false };
    const [mapCanvas, cardCanvas] = await Promise.all([
      html2canvas(mapEl, opts),
      html2canvas(cardEl, opts)
    ]);

    // Header gambar: nama aplikasi + ringkasan filter yg aktif + waktu
    // unduh -- supaya gambar hasil tetap jelas konteksnya walau dibuka
    // terpisah dari aplikasi (mis. dikirim lewat WhatsApp/email).
    const headerText1 = 'PetaDonor Ciayumajakuning — Laporan Epidemiologi';
    const headerText2 = document.getElementById('laporanReportTitle').textContent || '';
    const headerText3 = `Diunduh: ${new Date().toLocaleString('id-ID')}`;

    const pad = 24, headerH = 92, gap = 16;
    const width = Math.max(mapCanvas.width, cardCanvas.width) + pad*2;
    const height = headerH + mapCanvas.height + gap + cardCanvas.height + pad*2;

    const out = document.createElement('canvas');
    out.width = width; out.height = height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,width,height);

    ctx.fillStyle = '#1a1a1a';
    ctx.font = '700 22px "Space Grotesk", sans-serif';
    ctx.fillText(headerText1, pad, pad+26);
    ctx.font = '500 15px "Inter", sans-serif';
    ctx.fillStyle = '#4a4a4a';
    ctx.fillText(headerText2, pad, pad+50);
    ctx.font = '400 12px "Inter", sans-serif';
    ctx.fillStyle = '#8a8a8a';
    ctx.fillText(headerText3, pad, pad+70);

    let y = pad + headerH;
    ctx.drawImage(mapCanvas, pad, y);
    y += mapCanvas.height + gap;
    ctx.drawImage(cardCanvas, pad, y);

    const dataUrl = out.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `laporan-epidemiologi_${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast('laporanToast','Screenshot peta & laporan berhasil diunduh.','ok');
  }catch(err){
    console.error(err);
    showToast('laporanToast','Gagal membuat screenshot (kemungkinan tile peta terblokir kebijakan CORS). Coba lagi.','err');
  }finally{
    cardEl.classList.remove('capturing');
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}
document.getElementById('btnScreenshotLaporan').addEventListener('click', screenshotLaporan);

