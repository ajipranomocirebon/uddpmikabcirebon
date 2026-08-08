/* ===================================================================
   TABS
=================================================================== */
function switchTab(name){
  // Pertahanan tambahan di luar tombol tab yang sudah di-disable (lihat
  // applyTabAccess() di js/auth.js) -- pastikan tab yang tidak sesuai hak
  // akses user yang sedang login tidak bisa terbuka lewat jalur lain.
  if(typeof canAccessTab==='function' && !canAccessTab(name)) return;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===name));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id==='panel-'+name));
  if(name==='kegiatan') renderTempatDatalist();
  // Peta bagian atas dipakai bersama semua tab. Selain di tab Laporan
  // (di mana peta difilter sesuai periode/wilayah begitu tombol
  // "Tampilkan Laporan" diklik), tampilkan selalu SEMUA lokasi dgn
  // zona terbaru keseluruhan -- termasuk saat baru masuk tab Laporan,
  // sebelum user memilih periode & klik tombolnya.
  if(name!=='laporan'){
    renderMap();
  } else {
    renderMap();
    const infoEl = document.getElementById('laporanMapInfo');
    if(infoEl) infoEl.textContent = '📍 Menampilkan semua lokasi. Pilih periode/wilayah lalu klik "Tampilkan Laporan" untuk memfilter peta.';
    // Render ulang kartu ringkasan+tabel laporan setiap kali masuk tab ini --
    // supaya tampilan langsung menyesuaikan hak akses user yang sedang login
    // (mis. User 2 langsung melihat versi ringkas tanpa perlu klik tombol
    // "Tampilkan Laporan" dulu).
    if(typeof renderLaporan==='function') renderLaporan();
  }
}
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>switchTab(btn.dataset.tab));
});

