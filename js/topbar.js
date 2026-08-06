/* ===================================================================
   TOPBAR STATS
=================================================================== */
function renderTopbarStats(){
  const totalTempat = state.master.length;
  const bulanIni = new Date().toISOString().slice(0,7);
  const kantongBulanIni = state.kegiatan.filter(k=>k.tanggal.slice(0,7)===bulanIni)
      .reduce((a,k)=>a+k.gol.A+k.gol.B+k.gol.AB+k.gol.O, 0);
  const zonaMerahAktif = state.master.filter(t=>{
    const z = latestZonaForTempat(t.id);
    return z && z.toLowerCase()==='merah';
  }).length;

  document.getElementById('topbarStats').innerHTML = `
    <div class="stat-chip"><b>${totalTempat}</b><span>Lokasi Terdaftar</span></div>
    <div class="stat-chip"><b>${kantongBulanIni}</b><span>Kantong Bulan Ini</span></div>
    <div class="stat-chip merah"><b>${zonaMerahAktif}</b><span>Zona Merah Aktif</span></div>
  `;
}

