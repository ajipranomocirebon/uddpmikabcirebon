/* ===================================================================
   PENCARIAN LOKASI PADA PETA
   Ketik alamat/nama tempat -> pilih hasil -> peta zoom ke titik tsb
   & Longitude/Latitude pada form Master Data ikut terisi otomatis.

   Urutan sumber pencarian (dari paling diutamakan):
   1) DATA MASTER SENDIRI (state.master) — lokasi yang sudah pernah
      ditandai/disimpan admin di aplikasi ini. Selalu dicek duluan,
      tidak butuh internet, dan hasilnya pasti akurat karena admin
      sendiri yang menandainya dulu.
   2) NOMINATIM (OpenStreetMap) — pencarian umum di internet.
   3) PHOTON (photon.komoot.io, juga berbasis data OpenStreetMap tapi
      mesin pencariannya lebih toleran thd typo/ejaan berbeda) — hanya
      dicoba KALAU Nominatim tidak menemukan apa pun. Ini pelengkap,
      bukan pengganti; keduanya sama-sama gratis & tanpa API key.
=================================================================== */
let lastSearchQuery = '';

// ---------- 1) Cari di data master yang sudah tersimpan di aplikasi ------
function searchLocalMaster(query){
  const q = query.trim();
  if(!q) return [];
  return state.master
    .filter(t=>{
      const haystack = [t.nama, t.alamat, t.kecamatan, t.wilayah].filter(Boolean).join(' ');
      return wordPrefixMatch(haystack, q);
    })
    .slice(0, 6)
    .map(t=>({
      _local: true,
      name: t.nama,
      display_name: [t.nama, t.alamat, t.kecamatan, t.wilayah].filter(Boolean).join(', '),
      lat: t.lat, lon: t.lng
    }));
}

// ---------- 3) Fallback Photon kalau Nominatim nihil ----------------------
// Format respons Photon (GeoJSON) beda dgn Nominatim, jadi disamakan dulu
// bentuknya (name, display_name, lat, lon, class/type utk categorizeSearchResult)
// supaya sisa kode (render hasil, filter kategori, dst) tidak perlu berubah.
async function photonSearch(query){
  const [minLon, minLat, maxLon, maxLat] = CIAYU_VIEWBOX.split(',').map(Number);
  const lat = (minLat + maxLat) / 2, lon = (minLon + maxLon) / 2;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8`
    + `&lat=${lat}&lon=${lon}&bbox=${minLon},${minLat},${maxLon},${maxLat}`;
  const res = await fetch(url);
  const geo = await res.json();
  return (geo.features || []).map(f=>{
    const p = f.properties || {};
    const [flon, flat] = f.geometry?.coordinates || [null, null];
    const display = [p.name, p.street, p.city || p.county, p.state, 'Indonesia'].filter(Boolean).join(', ');
    return {
      _photon: true,
      name: p.name || display.split(',')[0],
      display_name: display,
      lat: flat, lon: flon,
      class: p.osm_key || '', type: p.osm_value || '', addresstype: p.osm_value || ''
    };
  }).filter(d=> d.lat!=null && d.lon!=null);
}

async function searchMapLocation(query){
  const resultsPanel = document.getElementById('mapSearchResults');
  lastSearchQuery = query || '';
  if(!query || query.trim().length < 3){
    resultsPanel.classList.remove('show'); resultsPanel.innerHTML=''; return;
  }
  resultsPanel.classList.add('show');
  resultsPanel.innerHTML = `<div class="map-search-loading">Mencari lokasi…</div>`;

  const localMatches = searchLocalMaster(query);

  try{
    // Ambil hasil lebih banyak saat kategori tertentu dipilih, supaya
    // setelah difilter tetap tersedia cukup pilihan yang relevan.
    const limit = activeSearchCategory==='semua' ? 8 : 20;
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&extratags=1`
      + `&limit=${limit}&countrycodes=id&viewbox=${CIAYU_VIEWBOX}&bounded=0&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    let data = await res.json();
    let usedPhoton = false;

    // Nominatim nihil -> coba Photon sbg pelengkap sebelum menyerah.
    if(!data || data.length===0){
      try{
        data = await photonSearch(query);
        usedPhoton = true;
      }catch(e2){ data = []; }
    }

    if((!data || data.length===0) && localMatches.length===0){
      resultsPanel.innerHTML = `<div class="map-search-empty">Lokasi tidak ditemukan. Coba kata kunci lain, atau gunakan "Tandai manual di peta".</div>`;
      return;
    }

    // Tandai kategori tiap hasil eksternal (Nominatim/Photon)
    data = (data || []).map(d=> ({...d, _cat: categorizeSearchResult(d)}));

    // Filter berdasarkan chip kategori aktif (kalau bukan "Semua")
    let filtered = data;
    if(activeSearchCategory !== 'semua'){
      filtered = data.filter(d=> d._cat === activeSearchCategory);
    }
    filtered = filtered.slice(0, 8);

    if(filtered.length===0 && localMatches.length===0){
      const catLabel = SEARCH_CATEGORIES[activeSearchCategory]?.label || activeSearchCategory;
      resultsPanel.innerHTML = `<div class="map-search-empty">Tidak ada hasil untuk kategori "${escapeHtml(catLabel)}". Coba kategori "Semua" atau kata kunci lain.</div>`;
      return;
    }

    // ---------- Susun tampilan: data master (lokal) dulu, baru eksternal ----------
    let html = '';
    if(localMatches.length>0){
      html += `<div class="map-search-section-label">📍 Sudah ada di data Anda</div>`;
      html += localMatches.map((d,i)=>`
        <div class="map-search-result" data-src="local" data-idx="${i}">
          <div class="map-search-result-head">
            <span class="cat-badge" style="background:#546E7A">Terdaftar</span>
            <b>${escapeHtml(d.name)}</b>
          </div>
          <span>${escapeHtml(d.display_name)}</span>
        </div>`).join('');
    }
    if(filtered.length>0){
      if(localMatches.length>0){
        const sourceLabel = usedPhoton ? 'Photon' : 'OpenStreetMap';
        html += `<div class="map-search-section-label">🌐 Hasil dari ${sourceLabel}</div>`;
      } else if(usedPhoton){
        html += `<div class="map-search-section-label">🌐 Hasil dari Photon (pencarian pelengkap)</div>`;
      }
      html += filtered.map((d,i)=>{
        const cat = SEARCH_CATEGORIES[d._cat] || SEARCH_CATEGORIES.lainnya;
        return `
        <div class="map-search-result" data-src="ext" data-idx="${i}">
          <div class="map-search-result-head">
            <span class="cat-badge" style="background:${cat.color}">${escapeHtml(cat.label)}</span>
            <b>${escapeHtml((d.name || d.display_name.split(',')[0]))}</b>
          </div>
          <span>${escapeHtml(d.display_name)}</span>
        </div>`;
      }).join('');
    }
    resultsPanel.innerHTML = html;

    resultsPanel.querySelectorAll('.map-search-result').forEach(el=>{
      el.addEventListener('click', ()=>{
        const idx = parseInt(el.dataset.idx);
        const d = el.dataset.src==='local' ? localMatches[idx] : filtered[idx];
        selectMapSearchResult(parseFloat(d.lat), parseFloat(d.lon), d.display_name);
      });
    });
  }catch(e){
    // Nominatim/Photon gagal terhubung -- tetap tampilkan match lokal (kalau ada)
    // supaya pencarian tidak sepenuhnya buntu hanya karena internet bermasalah.
    if(localMatches.length>0){
      resultsPanel.innerHTML = `<div class="map-search-section-label">📍 Sudah ada di data Anda</div>` +
        localMatches.map((d,i)=>`
        <div class="map-search-result" data-src="local" data-idx="${i}">
          <div class="map-search-result-head">
            <span class="cat-badge" style="background:#546E7A">Terdaftar</span>
            <b>${escapeHtml(d.name)}</b>
          </div>
          <span>${escapeHtml(d.display_name)}</span>
        </div>`).join('') +
        `<div class="map-search-empty">Gagal terhubung ke layanan peta online — hasil di atas berasal dari data lokal Anda.</div>`;
      resultsPanel.querySelectorAll('.map-search-result').forEach(el=>{
        el.addEventListener('click', ()=>{
          const d = localMatches[parseInt(el.dataset.idx)];
          selectMapSearchResult(parseFloat(d.lat), parseFloat(d.lon), d.display_name);
        });
      });
    } else {
      resultsPanel.innerHTML = `<div class="map-search-empty">Gagal terhubung ke layanan peta. Coba lagi.</div>`;
    }
  }
}

// Klik chip kategori: set kategori aktif & jalankan ulang pencarian.
// Kalau kategori itu tersedia utk "jelajahi di peta" (lihat OVERPASS_TAGS)
// tombol jelajah ditampilkan -- berguna terutama saat pengguna belum
// mengetik apa pun, supaya tetap bisa menemukan semua lokasi kategori itu
// di area peta yang sedang tampil tanpa perlu tahu namanya dulu.
document.getElementById('mapSearchFilters').addEventListener('click', (e)=>{
  const btn = e.target.closest('.filter-chip');
  if(!btn) return;
  activeSearchCategory = btn.dataset.cat;
  document.querySelectorAll('#mapSearchFilters .filter-chip').forEach(b=> b.classList.toggle('active', b===btn));
  const browseBtn = document.getElementById('btnBrowseCategory');
  browseBtn.classList.toggle('has-tags', !!OVERPASS_TAGS[activeSearchCategory]);
  const q = document.getElementById('mapSearchInput').value;
  if(q && q.trim().length>=3) searchMapLocation(q);
});
