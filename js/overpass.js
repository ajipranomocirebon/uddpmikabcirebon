/* ===================================================================
   JELAJAH KATEGORI DI AREA PETA (Overpass API — data OpenStreetMap)
   Berbeda dari pencarian nama (Nominatim) di atas: ini mencari SEMUA
   lokasi bertag kategori tsb (mis. semua rumah sakit/puskesmas) yang
   ada di dalam batas area peta yang SEDANG TAMPIL di layar, tanpa perlu
   mengetik nama tempatnya -- cocok utk "lihat semua fasilitas kesehatan
   di kecamatan ini" dsb. Sumber data sama-sama dari OpenStreetMap
   (referensi terbuka di internet), lewat endpoint Overpass API.
=================================================================== */
async function browseCategoryOnMap(){
  const cat = activeSearchCategory;
  const tags = OVERPASS_TAGS[cat];
  const resultsPanel = document.getElementById('mapSearchResults');
  if(!tags){ return; }

  const b = map.getBounds();
  const bbox = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
  if(b.getNorth()-b.getSouth() > 1.2 || b.getEast()-b.getWest() > 1.2){
    resultsPanel.classList.add('show');
    resultsPanel.innerHTML = `<div class="map-search-empty">Area peta terlalu luas untuk dijelajahi sekaligus — perbesar (zoom in) dulu ke area yang lebih spesifik.</div>`;
    return;
  }

  resultsPanel.classList.add('show');
  resultsPanel.innerHTML = `<div class="map-search-loading">Menjelajahi kategori "${escapeHtml(SEARCH_CATEGORIES[cat].label)}" di area peta ini…</div>`;

  // Susun query Overpass: cari node/way utk tiap tag yang relevan kategori
  // ini, dibatasi ke bbox area peta yang sedang tampil.
  const filters = tags.map(t=>{
    const [k,v] = t.split('=');
    const sel = v==='*' ? `["${k}"]` : `["${k}"="${v}"]`;
    return `node${sel}(${bbox});way${sel}(${bbox});`;
  }).join('');
  const query = `[out:json][timeout:25];(${filters});out center 40;`;

  try{
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method:'POST', body:'data=' + encodeURIComponent(query)
    });
    const data = await res.json();
    const elements = (data.elements || []).filter(el=>{
      const tg = el.tags || {};
      return tg.name; // hanya tampilkan yang ada namanya, biar hasil relevan dibaca
    });

    if(elements.length===0){
      resultsPanel.innerHTML = `<div class="map-search-empty">Tidak ditemukan lokasi kategori "${escapeHtml(SEARCH_CATEGORIES[cat].label)}" pada data OpenStreetMap di area ini.</div>`;
      return;
    }

    const items = elements.slice(0,40).map(el=>{
      const lat = el.lat ?? (el.center && el.center.lat);
      const lon = el.lon ?? (el.center && el.center.lon);
      const tg = el.tags || {};
      const addr = [tg['addr:street'], tg['addr:village'], tg['addr:suburb']].filter(Boolean).join(', ');
      return { lat, lon, name: tg.name, addr };
    }).filter(it=> it.lat!=null && it.lon!=null);

    resultsPanel.innerHTML = items.map((it,i)=>{
      const catInfo = SEARCH_CATEGORIES[cat];
      return `
      <div class="map-search-result" data-idx="${i}">
        <div class="map-search-result-head">
          <span class="cat-badge" style="background:${catInfo.color}">${escapeHtml(catInfo.label)}</span>
          <b>${escapeHtml(it.name)}</b>
        </div>
        <span>${escapeHtml(it.addr || 'Alamat rinci belum tersedia di OpenStreetMap')}</span>
      </div>`;
    }).join('');

    resultsPanel.querySelectorAll('.map-search-result').forEach(el=>{
      el.addEventListener('click', ()=>{
        const it = items[parseInt(el.dataset.idx)];
        selectMapSearchResult(it.lat, it.lon, it.name);
      });
    });
  }catch(e){
    resultsPanel.innerHTML = `<div class="map-search-empty">Gagal terhubung ke layanan jelajah peta (Overpass). Coba lagi sesaat lagi.</div>`;
  }
}
document.getElementById('btnBrowseCategory').addEventListener('click', browseCategoryOnMap);

function selectMapSearchResult(lat, lng, label){
  map.setView([lat,lng], 16);
  previewDraftMarker(lat,lng);
  setLatLngFields(lat,lng);
  document.getElementById('mapSearchResults').classList.remove('show');
  document.getElementById('mapSearchResults').innerHTML='';
  document.getElementById('mapSearchInput').value = label.split(',')[0];
  collapseMapSearch();
  switchTab('master');
  document.getElementById('geoStatus').textContent = 'Koordinat diatur dari hasil pencarian peta ✓';
}

// Buka/tutup panel kategori (chip + tombol jelajah): supaya TIDAK menutupi
// peta terus-menerus, panel ini disembunyikan secara default dan hanya
// muncul selama admin memang sedang aktif memakai kotak pencarian --
// begitu selesai (klik di luar / hasil dipilih) panel tersembunyi lagi
// secara rapi, kotak pencarian sendiri tetap terlihat seperti biasa.
const mapSearchBox = document.querySelector('.map-search');
function expandMapSearch(){ mapSearchBox.classList.add('expanded'); }
function collapseMapSearch(){ mapSearchBox.classList.remove('expanded'); }

let mapSearchTimer = null;
document.getElementById('mapSearchInput').addEventListener('focus', expandMapSearch);
document.getElementById('mapSearchInput').addEventListener('input', (e)=>{
  expandMapSearch();
  clearTimeout(mapSearchTimer);
  mapSearchTimer = setTimeout(()=> searchMapLocation(e.target.value), 650);
});
document.getElementById('mapSearchInput').addEventListener('keydown', (e)=>{
  if(e.key==='Enter'){ e.preventDefault(); clearTimeout(mapSearchTimer); searchMapLocation(e.target.value); }
});
document.getElementById('mapSearchBtn').addEventListener('click', ()=>{
  expandMapSearch();
  searchMapLocation(document.getElementById('mapSearchInput').value);
});
document.addEventListener('click', (e)=>{
  const box = document.querySelector('.map-search');
  if(box && !box.contains(e.target)){
    document.getElementById('mapSearchResults').classList.remove('show');
    collapseMapSearch();
  }
});

