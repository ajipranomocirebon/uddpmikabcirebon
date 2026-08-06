/* ===================================================================
   MAP
=================================================================== */
let map, markersLayer;
let baseLayers = {};
let currentBaseLayer = 'default';

function initMap(){
  // zoomControl:false -- kontrol +/- bawaan Leaflet TIDAK dipasang otomatis
  // di kiri-atas lagi (posisi itu bertumpukan dengan kotak pencarian).
  // Dipasang ulang di bawah dgn posisi bottomleft, satu-satunya sudut peta
  // yang masih kosong (kanan-atas dipakai legenda, kanan-bawah dipakai
  // pilihan lapisan peta, kiri-atas dipakai kotak pencarian).
  map = L.map('map', { scrollWheelZoom:false, zoomControl:false }).setView([-6.85, 108.42], 10);
  L.control.zoom({ position:'bottomleft' }).addTo(map);

  baseLayers.default = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'&copy; OpenStreetMap contributors',
    maxZoom:19
  });
  baseLayers.satelit = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution:'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom:19
  });
  baseLayers.medan = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution:'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom:17
  });

  baseLayers[currentBaseLayer].addTo(map);
  markersLayer = L.layerGroup().addTo(map);

  map.on('click', (e)=>{
    if(manualPinMode){
      setLatLngFields(e.latlng.lat, e.latlng.lng);
      manualPinMode = false;
      document.getElementById('btnManualPin').textContent = '📍 Tandai manual di peta';
      document.getElementById('geoStatus').textContent = 'Koordinat diatur manual dari peta.';
      previewDraftMarker(e.latlng.lat, e.latlng.lng);
    }
  });
}

function switchMapLayer(key){
  if(!baseLayers[key] || key===currentBaseLayer) return;
  map.removeLayer(baseLayers[currentBaseLayer]);
  baseLayers[key].addTo(map);
  currentBaseLayer = key;
  document.querySelectorAll('.layer-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.layer===key);
  });
}

document.getElementById('mapLayers').addEventListener('click', (e)=>{
  const btn = e.target.closest('.layer-btn');
  if(!btn) return;
  switchMapLayer(btn.dataset.layer);
});

function pinIcon(zona, big){
  const z = findZona(zona);
  const size = big ? 26 : 22;
  if(!z){
    return L.divIcon({
      className:'', html:`<div class="pin pin-netral" style="width:${size}px;height:${size}px;"></div>`,
      iconSize:[size,size], iconAnchor:[size/2,size]
    });
  }
  // Pin "berkedip" (pulse) dipertahankan khusus utk zona bernama "Merah"
  // (case-insensitive) supaya perilaku peringatan visual yang sudah ada
  // sebelumnya tidak berubah -- zona lain (termasuk zona baru yang
  // ditambahkan admin lewat tab Setting → Input Zona) tampil normal tanpa
  // kedip, warnanya mengikuti field "warna" yang dipilih admin.
  const pulseCls = z.nama.toLowerCase()==='merah' ? ' pin-pulse' : '';
  return L.divIcon({
    className:'', html:`<div class="pin${pulseCls}" style="width:${size}px;height:${size}px;background:${z.warna};"></div>`,
    iconSize:[size,size], iconAnchor:[size/2,size]
  });
}

// Label warna+nama utk popup peta (mis. "🟢 Zona Hijau") -- dibangun dari
// state.zonaList (bukan daftar tetap lagi) supaya zona baru yang ditambah
// admin lewat tab Setting → Input Zona ikut tampil benar di popup peta.
function zonaPopupLabel(zona){
  const z = findZona(zona);
  return z ? `🔘 Zona ${escapeHtml(z.nama)}` : '⚪ Belum ada data';
}

// Legenda peta ("Status Zona Lokasi") -- dibangun dari state.zonaList
// supaya ikut bertambah/berubah otomatis saat admin menambah, mengubah,
// atau menghapus zona lewat tab Setting → Input Zona (baris "Belum ada
// data kegiatan" di bagian bawah legenda tetap statis, di luar daftar ini).
function renderLegend(){
  const el = document.getElementById('legendZonaItems');
  if(!el) return;
  const sorted = state.zonaList.slice().sort((a,b)=>a.nama.localeCompare(b.nama));
  el.innerHTML = sorted.map(z=>
    `<div class="legend-item"><i class="dot" style="background:${z.warna};"></i> Zona ${escapeHtml(z.nama)}</div>`
  ).join('');
}

function latestZonaForTempat(tempatId){
  const rows = state.kegiatan.filter(k=>k.tempatId===tempatId)
                 .sort((a,b)=> a.tanggal < b.tanggal ? 1 : -1);
  return rows.length ? rows[0].zona : null;
}

let draftMarker = null;
function previewDraftMarker(lat,lng){
  if(draftMarker) map.removeLayer(draftMarker);
  draftMarker = L.marker([lat,lng], {icon:pinIcon(null,true)}).addTo(map);
  map.setView([lat,lng], 13);
}
function clearDraftMarker(){
  if(draftMarker){ map.removeLayer(draftMarker); draftMarker=null; }
}

function renderMap(){
  if(!map || !markersLayer) return; // peta belum siap (mis. pustaka Leaflet gagal termuat)
  markersLayer.clearLayers();
  state.master.forEach(t=>{
    if(t.lat==null || t.lng==null) return;
    const zona = latestZonaForTempat(t.id);
    const marker = L.marker([t.lat,t.lng], {icon:pinIcon(zona,false)});
    marker.bindPopup(
      `<p class="popup-title">${escapeHtml(t.nama)}</p>
       <p class="popup-sub">${escapeHtml(t.kecamatan)}, ${escapeHtml(t.wilayah)}<br>${zonaPopupLabel(zona)}</p>
       <button class="popup-btn" onclick="gotoInputKegiatan(${t.id})">Input Kegiatan</button>`
    );
    marker.addTo(markersLayer);
  });
}

/* ---------------------------------------------------------------
   Tampilan peta khusus Tab 3 (Laporan Epidemiologi)
   -----------------------------------------------------------------
   Dipanggil dari laporan.js setiap kali tombol "Tampilkan Laporan"
   diklik. Hanya menampilkan pin utk lokasi (nama tempat, kecamatan,
   wilayah) yang punya kegiatan sesuai filter periode/wilayah yang
   sedang aktif -- warna pin (zona hijau/kuning/merah) diambil dari
   kegiatan TERBARU milik lokasi tsb DI DALAM rentang filter itu
   (bukan zona terbaru keseluruhan seperti renderMap() biasa).
=================================================================== */
function renderMapReport(filteredRows){
  if(!map || !markersLayer) return 0; // peta belum siap (mis. pustaka Leaflet gagal termuat)
  markersLayer.clearLayers();

  // ambil kegiatan paling baru per tempat, dibatasi hanya pada baris
  // yang sudah lolos filter periode & wilayah (dikirim dari laporan.js)
  const latestPerTempat = {};
  filteredRows.forEach(k=>{
    const prev = latestPerTempat[k.tempatId];
    if(!prev || prev.tanggal < k.tanggal) latestPerTempat[k.tempatId] = k;
  });

  const bounds = [];
  Object.keys(latestPerTempat).forEach(tid=>{
    const t = state.master.find(x=>x.id===Number(tid));
    if(!t || t.lat==null || t.lng==null) return;
    const k = latestPerTempat[tid];
    const zona = k.zona;
    const marker = L.marker([t.lat,t.lng], {icon:pinIcon(zona,false)});
    marker.bindPopup(
      `<p class="popup-title">${escapeHtml(t.nama)}</p>
       <p class="popup-sub">${escapeHtml(t.kecamatan)}, ${escapeHtml(t.wilayah)}<br>${zonaPopupLabel(zona)}<br>Kegiatan terakhir pada periode ini: ${fmtDate(k.tanggal)}</p>`
    );
    marker.addTo(markersLayer);
    bounds.push([t.lat, t.lng]);
  });

  if(bounds.length){
    map.fitBounds(bounds, {padding:[48,48], maxZoom:14});
  }
  return bounds.length;
}

function gotoInputKegiatan(tempatId){
  switchTab('kegiatan');
  const t = state.master.find(x=>x.id===tempatId);
  if(t){
    document.getElementById('kegiatanCari').value = t.nama;
    selectTempatByName(t.nama);
  }
  map.closePopup();
}

