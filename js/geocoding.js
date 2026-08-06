/* ===================================================================
   GEOCODING (Nominatim OpenStreetMap, dgn pelengkap data lokal & Photon)
=================================================================== */
let manualPinMode = false;
let geoTimer = null;

async function tryAutoGeocode(){
  const nama = document.getElementById('masterNama').value.trim();
  const kec = document.getElementById('masterKecamatan').value.trim();
  const wil = document.getElementById('masterWilayah').value.trim();
  const statusEl = document.getElementById('geoStatus');

  if(!nama || !kec || !wil){
    statusEl.textContent = 'Menunggu Nama Tempat, Kecamatan & Wilayah diisi…';
    return;
  }

  // 1) Cek dulu ke data master yang sudah tersimpan (nama+kecamatan+wilayah
  // sama persis, tanpa peduli besar/kecil huruf) -- kalau admin memang
  // sedang menambah lokasi yang sebelumnya sudah pernah ditandai manual di
  // tempat lain dgn nama yg mirip, ini menghindari geocode ulang ke internet.
  const idFieldNow = document.getElementById('masterId').value;
  const existing = state.master.find(t=>
    t.id !== parseInt(idFieldNow || '-1') &&
    t.nama.toLowerCase()===nama.toLowerCase() &&
    t.kecamatan.toLowerCase()===kec.toLowerCase() &&
    t.wilayah.toLowerCase()===wil.toLowerCase()
  );
  if(existing){
    setLatLngFields(existing.lat, existing.lng);
    previewDraftMarker(existing.lat, existing.lng);
    statusEl.textContent = 'Koordinat diambil dari data yang sudah tersimpan sebelumnya ✓';
    return;
  }

  statusEl.textContent = 'Mencari koordinat…';
  clearTimeout(geoTimer);
  geoTimer = setTimeout(async ()=>{
    const q = `${nama}, Kecamatan ${kec}, ${wil}, Indonesia`;
    try{
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&viewbox=${CIAYU_VIEWBOX}&bounded=0&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const data = await res.json();
      if(data && data.length>0){
        const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon);
        setLatLngFields(lat,lng);
        previewDraftMarker(lat,lng);
        statusEl.textContent = 'Koordinat ditemukan otomatis ✓';
        return;
      }
    }catch(e){
      // lanjut ke percobaan Photon di bawah sebelum menyerah total
    }

    // 3) Nominatim nihil/gagal -> coba Photon sbg pelengkap (lebih toleran
    // thd typo/ejaan berbeda) sebelum minta admin menandai manual.
    try{
      const alt = await photonSearch(q);
      if(alt && alt.length>0){
        const lat = alt[0].lat, lng = alt[0].lon;
        setLatLngFields(lat,lng);
        previewDraftMarker(lat,lng);
        statusEl.textContent = 'Koordinat ditemukan otomatis (via pencarian pelengkap) ✓';
        return;
      }
      map.setView(DEFAULT_MAP_CENTER, 12);
      statusEl.textContent = 'Lokasi presisi tidak ditemukan — klik "Tandai manual di peta" untuk menentukan titik.';
    }catch(e2){
      map.setView(DEFAULT_MAP_CENTER, 12);
      statusEl.textContent = 'Gagal terhubung ke layanan peta — gunakan "Tandai manual di peta".';
    }
  }, 600);
}

function setLatLngFields(lat,lng){
  document.getElementById('masterLat').value = lat.toFixed(6);
  document.getElementById('masterLng').value = lng.toFixed(6);
}

document.getElementById('btnManualPin').addEventListener('click', ()=>{
  manualPinMode = !manualPinMode;
  document.getElementById('btnManualPin').textContent = manualPinMode
    ? '👉 Klik titik lokasi pada peta…' : '📍 Tandai manual di peta';
});

document.getElementById('masterNama').addEventListener('input', tryAutoGeocode);
// Kecamatan sekarang berupa dropdown (bukan teks bebas), jadi dipantau
// lewat event 'change', bukan 'input'.
document.getElementById('masterKecamatan').addEventListener('change', tryAutoGeocode);
document.getElementById('masterWilayah').addEventListener('change', tryAutoGeocode);
