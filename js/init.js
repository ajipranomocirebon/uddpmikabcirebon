/* ===================================================================
   INIT
=================================================================== */
function renderAll(){
  populateKecamatanDropdown();
  populateWilayahDropdowns();
  populateZonaWilayahDropdowns();
  populateKegiatanZonaDropdown();
  populateFilterZonaDropdown();
  renderKecamatanSettingTable();
  renderParameterSettingTable();
  renderZonaSettingTable();
  renderJenisDonorSettingTable();
  renderMetodePengujianSettingTable();
  renderUserTable();
  renderLegend();
  renderTopbarStats();
  renderMasterTable();
  renderKegiatanTable();
  renderTempatDatalist();
  renderMap();
  renderLaporan();
}

/* ---------- Tombol Data & Cadangan ---------- */
document.getElementById('btnExportBackup').addEventListener('click', exportBackupJSON);
document.getElementById('btnImportMerge').addEventListener('click', ()=>{
  const f = document.getElementById('inputImportFile').files[0];
  if(!f){ showToast('backupToast','Pilih file cadangan .json terlebih dahulu.','err'); return; }
  importBackupJSON(f, 'merge');
});
document.getElementById('btnImportReplace').addEventListener('click', ()=>{
  const f = document.getElementById('inputImportFile').files[0];
  if(!f){ showToast('backupToast','Pilih file cadangan .json terlebih dahulu.','err'); return; }
  askConfirm('Ganti semua data?','Seluruh data Master & Kegiatan di perangkat ini akan DITIMPA total oleh isi file cadangan. Tindakan ini tidak dapat dibatalkan.', ()=>{
    importBackupJSON(f, 'replace');
  });
});

document.getElementById('btnLegendToggle').addEventListener('click', ()=>{
  document.getElementById('legendPanel').classList.toggle('open');
});

if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('sw.js').then((reg)=>{
      // Jika ada service worker baru terdeteksi (CACHE_NAME di sw.js berubah),
      // begitu selesai install & siap aktif, langsung reload halaman
      // supaya user tidak perlu tutup-buka app / clear cache manual.
      reg.addEventListener('updatefound', ()=>{
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', ()=>{
          if(newWorker.state === 'installed' && navigator.serviceWorker.controller){
            window.location.reload();
          }
        });
      });
    }).catch(()=>{ /* offline cache opsional, abaikan jika gagal */ });
  });
}

(async function start(){
  // initMap() dibungkus try/catch: kalau pustaka peta (Leaflet, dimuat dari
  // CDN) gagal termuat -- mis. tidak ada koneksi internet saat pertama kali
  // dibuka -- proses pemulihan data tersimpan (loadState) & render form/tabel
  // di bawah ini TETAP berjalan, tidak ikut gagal total hanya karena peta
  // belum bisa tampil.
  try{ initMap(); }catch(e){ console.error('Gagal inisialisasi peta:', e); }
  applyTabAccess(); // currentUser masih null di titik ini -> semua tab terkunci sampai login berhasil
  await loadState();
  // set tanggal filter laporan default: bulan berjalan
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  document.getElementById('filterDari').value = first;
  document.getElementById('filterSampai').value = now.toISOString().slice(0,10);
  document.getElementById('kegiatanTanggal').valueAsDate = now;

  renderEpiRows();
  renderAll();
})();
