/* ===================================================================
   COMBO SELECT — dropdown Kecamatan/Wilayah/Zona Wilayah yang bisa
   DICARI (Tab 1 Master Data)
   ------------------------------------------------------------------
   Membungkus <select> yang sudah ada dengan kotak ketik + daftar saran
   yang bisa difilter berdasarkan teks yang diketik -- supaya admin
   tidak perlu men-scroll dropdown panjang saat data Kecamatan/Wilayah/
   Zona Wilayah (diinput lewat tab ⚙️ Setting) sudah puluhan (>20).

   <select> ASLINYA TETAP ADA di DOM (disembunyikan) sebagai satu-
   satunya sumber nilai terpilih -- semua kode lain yang sudah ada
   (validasi & simpan di master-data.js, listener 'change' di
   geocoding.js & setting.js, pengisian ulang opsi saat data Kecamatan
   di tab Setting berubah) TIDAK perlu diubah cara kerjanya: tetap
   membaca & menulis lewat elemen <select> seperti sebelumnya. Memilih
   item lewat kotak pencarian ini akan mengubah select.value lalu
   menembakkan event 'change' asli ke select tsb, persis seperti kalau
   user memilih langsung dari dropdown bawaan browser.

   Kalau ada kode lain yang men-set select.value secara LANGSUNG lewat
   JS (bukan lewat klik/ketik user di kotak pencarian ini) -- misalnya
   formMaster.reset(), editMaster(), atau saat memilih Kecamatan
   otomatis mengisi Wilayah & Zona Wilayah -- panggil
   syncComboDisplay('idSelect') sesudahnya supaya kotak ketik ikut
   menampilkan pilihan terbaru.
=================================================================== */
function initComboSelect(selectId, opts){
  const select = document.getElementById(selectId);
  if(!select || select.dataset.comboReady) return;
  select.dataset.comboReady = '1';
  opts = opts || {};

  const wrap = document.createElement('div');
  wrap.className = 'combo-select';
  select.parentNode.insertBefore(wrap, select);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'combo-input';
  input.placeholder = opts.placeholder || 'Ketik untuk mencari…';
  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');

  const list = document.createElement('div');
  list.className = 'combo-list';

  wrap.appendChild(input);
  wrap.appendChild(list);
  wrap.appendChild(select); // memindahkan <select> asli ke dalam wrapper (tetap ada, disembunyikan lewat CSS)
  select.classList.add('combo-hidden-select');
  // Divalidasi manual lewat JS saat submit (lihat master-data.js) --
  // atribut required dilepas karena <select> ini sekarang disembunyikan,
  // dan validasi native browser pada elemen tersembunyi tidak reliable
  // (bisa diam-diam menolak submit tanpa pesan yang jelas ke user).
  select.removeAttribute('required');

  let hlIndex = -1; // index item yang sedang di-highlight (navigasi keyboard)

  function options(){
    return Array.from(select.options).filter(o=>o.value!=='');
  }
  function currentLabel(){
    const opt = select.options[select.selectedIndex];
    return (opt && opt.value) ? opt.textContent : '';
  }
  function syncDisplay(){
    input.value = currentLabel();
  }
  function filteredOptions(q){
    q = (q||'').trim().toLowerCase();
    return !q ? options() : options().filter(o=>o.textContent.toLowerCase().includes(q));
  }
  function renderList(q){
    const items = filteredOptions(q);
    hlIndex = items.findIndex(o=>o.value===select.value);
    list.innerHTML = items.length===0
      ? `<div class="combo-empty">${escapeHtml(opts.emptyText || 'Tidak ada data cocok.')}</div>`
      : items.map((o,i)=>
          `<div class="combo-item${o.value===select.value?' active':''}${i===hlIndex?' hl':''}" data-value="${escapeHtml(o.value)}">${escapeHtml(o.textContent)}</div>`
        ).join('');
    list.classList.add('show');
    input.setAttribute('aria-expanded', 'true');
  }
  function closeList(){
    list.classList.remove('show');
    input.setAttribute('aria-expanded', 'false');
    hlIndex = -1;
  }
  function pick(value){
    if(select.value !== value){
      select.value = value;
      select.dispatchEvent(new Event('change', {bubbles:true}));
    }
    syncDisplay();
    closeList();
  }
  function moveHighlight(delta){
    const items = Array.from(list.querySelectorAll('.combo-item'));
    if(items.length===0) return;
    hlIndex = (hlIndex + delta + items.length) % items.length;
    items.forEach((el,i)=> el.classList.toggle('hl', i===hlIndex));
    items[hlIndex].scrollIntoView({block:'nearest'});
  }

  input.addEventListener('focus', ()=> renderList(''));
  input.addEventListener('input', ()=> renderList(input.value));
  input.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowDown'){
      e.preventDefault();
      if(!list.classList.contains('show')) renderList(input.value); else moveHighlight(1);
    }else if(e.key==='ArrowUp'){
      e.preventDefault(); moveHighlight(-1);
    }else if(e.key==='Enter'){
      e.preventDefault();
      const items = Array.from(list.querySelectorAll('.combo-item'));
      if(items[hlIndex]) pick(items[hlIndex].dataset.value);
    }else if(e.key==='Escape'){
      closeList(); syncDisplay(); input.blur();
    }
  });
  input.addEventListener('blur', ()=>{
    // beri jeda sebentar supaya event mousedown pada item sempat
    // terproses dulu sebelum daftar ditutup & ketikan yang tidak cocok
    // pilihan manapun dibatalkan (dikembalikan ke pilihan terakhir).
    setTimeout(()=>{ closeList(); syncDisplay(); }, 120);
  });
  list.addEventListener('mousedown', (e)=>{
    const item = e.target.closest('.combo-item');
    if(!item) return;
    e.preventDefault(); // cegah blur menutup daftar sebelum klik terproses
    pick(item.dataset.value);
    input.blur();
  });

  select.comboSync = syncDisplay; // dipanggil dari luar lewat syncComboDisplay()
  syncDisplay();
}

// Dipanggil dari tempat lain (master-data.js, setting.js) tiap kali
// select.value diubah langsung lewat JS -- bukan lewat klik/ketik user
// di kotak pencarian -- supaya kotak ketik ikut menampilkan pilihan
// terbaru.
function syncComboDisplay(selectId){
  const select = document.getElementById(selectId);
  if(select && select.comboSync) select.comboSync();
}

initComboSelect('masterKecamatan', {
  placeholder: 'Ketik atau pilih kecamatan…',
  emptyText: 'Belum ada data kecamatan — tambahkan dulu lewat tab ⚙️ Setting.'
});
initComboSelect('masterWilayah', {
  placeholder: 'Ketik atau pilih wilayah…',
  emptyText: 'Belum ada data wilayah — tambahkan dulu lewat tab ⚙️ Setting.'
});
initComboSelect('masterZonaWilayah', {
  placeholder: 'Ketik atau pilih zona wilayah…',
  emptyText: 'Belum ada data zona wilayah — tambahkan dulu lewat tab ⚙️ Setting.'
});
