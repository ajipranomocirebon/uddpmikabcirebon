/* ===================================================================
   PERSISTENT STORAGE
   Database TERPUSAT berbasis Supabase (Postgres) -- semua perangkat yang
   membuka aplikasi ini membaca & menulis ke project Supabase yang sama,
   jadi data & akun user otomatis sinkron lintas perangkat.
   localStorage tetap dipakai sbg CACHE lokal: dibaca kalau sedang
   offline/Supabase belum disetel (lihat js/config.js), dan langsung
   diperbarui tiap kali berhasil simpan/ambil dari Supabase.
=================================================================== */
let supabaseClient = null;
let supabaseReady = false; // true kalau SUPABASE_URL/KEY di js/config.js sudah diisi

function getSupabaseClient(){
  if(supabaseClient) return supabaseClient;
  if(typeof SUPABASE_URL==='undefined' || typeof SUPABASE_ANON_KEY==='undefined') return null;
  if(!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.indexOf('ISI-DENGAN')===0) return null;
  if(typeof supabase==='undefined') return null; // CDN supabase-js belum termuat
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  supabaseReady = true;
  return supabaseClient;
}

// Simpan: tulis ke cache lokal dulu (cepat & tetap jalan offline), lalu
// upsert ke Supabase kalau sudah disetel & sedang online.
async function storageSet(key, value){
  try{ localStorage.setItem('petadonor:'+key, value); }catch(e){ /* abaikan, lanjut coba Supabase */ }
  const client = getSupabaseClient();
  if(!client) return;
  try{
    const { error } = await client.from('app_kv').upsert({ id:key, value: JSON.parse(value), updated_at: new Date().toISOString() });
    if(error) throw error;
  }catch(e){ console.error('Gagal sinkron ke Supabase (tersimpan di cache lokal saja utk saat ini):', e); }
}
// Ambil: kalau Supabase disetel & bisa dihubungi, itu sumber data utama
// (paling baru dari perangkat manapun). Kalau gagal/offline, pakai cache
// lokal supaya aplikasi tetap bisa dibuka.
async function storageGet(key){
  const client = getSupabaseClient();
  if(client){
    try{
      const { data, error } = await client.from('app_kv').select('value').eq('id', key).maybeSingle();
      if(error) throw error;
      if(data && data.value!=null){
        const json = JSON.stringify(data.value);
        try{ localStorage.setItem('petadonor:'+key, json); }catch(e){ /* abaikan */ }
        return json;
      }
      if(data==null) return null; // key belum pernah dibuat di Supabase -- bukan error
    }catch(e){ console.error('Gagal ambil dari Supabase, pakai cache lokal:', e); }
  }
  try{ return localStorage.getItem('petadonor:'+key); }catch(e2){ return null; }
}

async function loadState(){
  try{
    const m = await storageGet('master-data');
    const k = await storageGet('kegiatan-data');
    const kec = await storageGet('kecamatan-data');
    const par = await storageGet('parameter-data');
    const zon = await storageGet('zona-data');
    const usr = await storageGet('user-data');
    const jd = await storageGet('jenisdonor-data');
    const mp = await storageGet('metodepengujian-data');
    if(m) state.master = JSON.parse(m);
    if(k) state.kegiatan = JSON.parse(k);
    if(kec) state.kecamatanList = JSON.parse(kec);
    if(par) state.parameterList = JSON.parse(par);
    if(zon) state.zonaList = JSON.parse(zon);
    if(usr) state.userList = JSON.parse(usr);
    if(jd) state.jenisDonorList = JSON.parse(jd);
    if(mp) state.metodePengujianList = JSON.parse(mp);
  }catch(e){ /* belum ada data tersimpan — mulai kosong */ }
  // Kalau belum pernah ada data Parameter tersimpan sama sekali (instalasi
  // baru / migrasi dari versi sebelum tab Setting punya "Input Parameter"),
  // isi otomatis dengan 4 parameter bawaan supaya Tab 2 tidak kosong.
  if(state.parameterList.length===0 && par===null){
    state.parameterList = ['HBsAg','HIV','HCV','Sifilis'].map((nama,i)=>({id:i+1, nama}));
  }
  // Sama halnya utk Zona: instalasi baru / migrasi dari versi sebelum tab
  // Setting punya "Input Zona" diisi otomatis dgn 3 zona bawaan (Hijau/
  // Kuning/Merah) memakai warna yang SAMA persis dgn warna tetap yang
  // dipakai versi-versi sebelumnya -- supaya tampilan pin peta & badge
  // riwayat kegiatan LAMA tidak berubah tiba-tiba setelah pembaruan ini.
  if(state.zonaList.length===0 && zon===null){
    state.zonaList = [
      {id:1, nama:'Hijau', warna:'#2E9E5B'},
      {id:2, nama:'Kuning', warna:'#DE9F1E'},
      {id:3, nama:'Merah', warna:'#D5394A'}
    ];
  }
  // Migrasi: pastikan selalu ada Zona bernama "Aman" -- dipakai OTOMATIS
  // oleh Tab 2 (Input Kegiatan & Epidemiologi) saat Epidemiologi/skrining
  // reaktif dikosongkan (lihat js/kegiatan.js -> syncZonaOtomatis()).
  // Ditambahkan sekali di sini kalau instalasi ini (baru maupun yang
  // sudah lama dipakai) belum punya Zona "Aman" sama sekali, supaya
  // aturan otomatis tsb langsung berfungsi tanpa admin perlu menambahkan
  // sendiri dulu lewat tab Setting. Kalau admin sudah pernah menambahkan
  // "Aman" sendiri sebelumnya (nama/warna apa pun), data itu TIDAK
  // diduplikasi/ditimpa.
  let zonaBerubah = false;
  if(!state.zonaList.some(z=> z.nama.toLowerCase()==='aman')){
    const nextId = state.zonaList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
    state.zonaList.push({id:nextId, nama:'Aman', warna:'#00897B'});
    zonaBerubah = true;
  }
  state.nextMasterId = state.master.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  state.nextKegiatanId = state.kegiatan.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  state.nextKecamatanId = state.kecamatanList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  state.nextParameterId = state.parameterList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  state.nextZonaId = state.zonaList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  state.nextUserId = state.userList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  state.nextJenisDonorId = state.jenisDonorList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  state.nextMetodePengujianId = state.metodePengujianList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
  if(zonaBerubah) await persistZonaList(); // simpan permanen supaya migrasi ini cukup sekali
  updateStorageStatus();
}
async function persistMaster(){
  try{ await storageSet('master-data', JSON.stringify(state.master)); updateStorageStatus(); }catch(e){ console.error(e); }
}
async function persistKegiatan(){
  try{ await storageSet('kegiatan-data', JSON.stringify(state.kegiatan)); updateStorageStatus(); }catch(e){ console.error(e); }
}
async function persistKecamatanList(){
  try{ await storageSet('kecamatan-data', JSON.stringify(state.kecamatanList)); updateStorageStatus(); }catch(e){ console.error(e); }
}
async function persistParameterList(){
  try{ await storageSet('parameter-data', JSON.stringify(state.parameterList)); updateStorageStatus(); }catch(e){ console.error(e); }
}
async function persistZonaList(){
  try{ await storageSet('zona-data', JSON.stringify(state.zonaList)); updateStorageStatus(); }catch(e){ console.error(e); }
}
async function persistUserList(){
  try{ await storageSet('user-data', JSON.stringify(state.userList)); updateStorageStatus(); }catch(e){ console.error(e); }
}
async function persistJenisDonorList(){
  try{ await storageSet('jenisdonor-data', JSON.stringify(state.jenisDonorList)); updateStorageStatus(); }catch(e){ console.error(e); }
}
async function persistMetodePengujianList(){
  try{ await storageSet('metodepengujian-data', JSON.stringify(state.metodePengujianList)); updateStorageStatus(); }catch(e){ console.error(e); }
}

function updateStorageStatus(){
  const el = document.getElementById('storageStatus');
  if(!el) return;
  const now = new Date();
  el.textContent = supabaseReady
    ? `Tersimpan otomatis di database terpusat (Supabase) — pembaruan terakhir ${now.toLocaleTimeString('id-ID')}.`
    : `Supabase belum disetel (lihat js/config.js) — tersimpan sementara di cache lokal perangkat ini saja, pembaruan terakhir ${now.toLocaleTimeString('id-ID')}.`;
}

/* ---------- Export / Import (cadangan & pindah data antar perangkat) ---------- */
function exportBackupJSON(){
  const payload = {
    app:'PetaDonor', exportedAt:new Date().toISOString(),
    master: state.master, kegiatan: state.kegiatan, kecamatanList: state.kecamatanList,
    parameterList: state.parameterList, zonaList: state.zonaList, userList: state.userList,
    jenisDonorList: state.jenisDonorList, metodePengujianList: state.metodePengujianList
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0,10);
  a.href = url; a.download = `petadonor-cadangan-${stamp}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  showToast('backupToast','File cadangan berhasil diunduh.','ok');
}

function importBackupJSON(file, mode){
  const reader = new FileReader();
  reader.onload = async (e)=>{
    try{
      const parsed = JSON.parse(e.target.result);
      const master = Array.isArray(parsed.master) ? parsed.master : [];
      const kegiatan = Array.isArray(parsed.kegiatan) ? parsed.kegiatan : [];
      const kecamatanList = Array.isArray(parsed.kecamatanList) ? parsed.kecamatanList : [];
      const parameterList = Array.isArray(parsed.parameterList) ? parsed.parameterList : [];
      const zonaList = Array.isArray(parsed.zonaList) ? parsed.zonaList : [];
      const userList = Array.isArray(parsed.userList) ? parsed.userList : [];
      const jenisDonorList = Array.isArray(parsed.jenisDonorList) ? parsed.jenisDonorList : [];
      const metodePengujianList = Array.isArray(parsed.metodePengujianList) ? parsed.metodePengujianList : [];
      if(mode==='replace'){
        state.master = master; state.kegiatan = kegiatan; state.kecamatanList = kecamatanList;
        state.parameterList = parameterList; state.zonaList = zonaList;
        state.jenisDonorList = jenisDonorList; state.metodePengujianList = metodePengujianList;
        // Username "ajipranomo" dicadangkan khusus utk Administrator (lihat js/auth.js)
        // -- kalau ada di file cadangan (mis. dari ekspor lama), lewati supaya tidak
        // bentrok dgn akun Administrator yang selalu tetap/hardcode.
        state.userList = userList.filter(u=> (u.username||'').toLowerCase() !== ADMIN_USERNAME.toLowerCase());
      }else{
        // gabung: hindari duplikasi id dgn menomori ulang data yang masuk
        let nextM = state.master.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        const idMap = {};
        master.forEach(t=>{ idMap[t.id] = nextM; state.master.push({...t, id: nextM}); nextM++; });
        let nextK = state.kegiatan.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        kegiatan.forEach(k=>{ state.kegiatan.push({...k, id: nextK, tempatId: idMap[k.tempatId] ?? k.tempatId}); nextK++; });
        let nextKec = state.kecamatanList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        const seenKec = new Set(state.kecamatanList.map(x=>x.nama.toLowerCase()));
        kecamatanList.forEach(kc=>{
          if(seenKec.has(kc.nama.toLowerCase())) return; // lewati kecamatan yang namanya sudah ada
          seenKec.add(kc.nama.toLowerCase());
          state.kecamatanList.push({...kc, id: nextKec}); nextKec++;
        });
        let nextPar = state.parameterList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        const seenPar = new Set(state.parameterList.map(x=>x.nama.toLowerCase()));
        parameterList.forEach(p=>{
          if(seenPar.has(p.nama.toLowerCase())) return; // lewati parameter yang namanya sudah ada
          seenPar.add(p.nama.toLowerCase());
          state.parameterList.push({...p, id: nextPar}); nextPar++;
        });
        let nextZon = state.zonaList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        const seenZon = new Set(state.zonaList.map(x=>x.nama.toLowerCase()));
        zonaList.forEach(z=>{
          if(seenZon.has(z.nama.toLowerCase())) return; // lewati zona yang namanya sudah ada
          seenZon.add(z.nama.toLowerCase());
          state.zonaList.push({...z, id: nextZon}); nextZon++;
        });
        let nextUsr = state.userList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        const seenUsr = new Set(state.userList.map(x=>x.username.toLowerCase()));
        userList.forEach(u=>{
          const uname = (u.username||'').toLowerCase();
          if(!uname || uname===ADMIN_USERNAME.toLowerCase()) return; // lewati akun tanpa username & yang bentrok dgn Administrator
          if(seenUsr.has(uname)) return; // lewati username yang sudah terdaftar
          seenUsr.add(uname);
          state.userList.push({...u, id: nextUsr}); nextUsr++;
        });
        let nextJd = state.jenisDonorList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        const seenJd = new Set(state.jenisDonorList.map(x=>x.nama.toLowerCase()));
        jenisDonorList.forEach(j=>{
          if(seenJd.has(j.nama.toLowerCase())) return; // lewati jenis donor yang namanya sudah ada
          seenJd.add(j.nama.toLowerCase());
          state.jenisDonorList.push({...j, id: nextJd}); nextJd++;
        });
        let nextMp = state.metodePengujianList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
        const seenMp = new Set(state.metodePengujianList.map(x=>x.nama.toLowerCase()));
        metodePengujianList.forEach(mtd=>{
          if(seenMp.has(mtd.nama.toLowerCase())) return; // lewati metode pengujian yang namanya sudah ada
          seenMp.add(mtd.nama.toLowerCase());
          state.metodePengujianList.push({...mtd, id: nextMp}); nextMp++;
        });
      }
      state.nextMasterId = state.master.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      state.nextKegiatanId = state.kegiatan.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      state.nextKecamatanId = state.kecamatanList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      state.nextParameterId = state.parameterList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      state.nextZonaId = state.zonaList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      state.nextUserId = state.userList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      state.nextJenisDonorId = state.jenisDonorList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      state.nextMetodePengujianId = state.metodePengujianList.reduce((a,b)=>Math.max(a,b.id),0) + 1;
      await persistMaster(); await persistKegiatan(); await persistKecamatanList(); await persistParameterList(); await persistZonaList(); await persistUserList(); await persistJenisDonorList(); await persistMetodePengujianList();
      renderAll();
      showToast('backupToast', mode==='replace' ? 'Data berhasil dipulihkan (menggantikan data lama).' : 'Data cadangan berhasil digabungkan.', 'ok');
    }catch(err){
      showToast('backupToast','Gagal membaca file — pastikan file cadangan JSON valid.','err');
    }
  };
  reader.readAsText(file);
}

