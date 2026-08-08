/* ===================================================================
   AUTH — Layar Login/Registrasi & Tab 6 (Administrator)
   ------------------------------------------------------------------
   - Setiap kali aplikasi ini dibuka/dimuat, layar Login menimpa seluruh
     tampilan (overlay) sampai user berhasil login -- tidak ada sesi yang
     "diingat" otomatis antar sesi buka-aplikasi (sesuai permintaan: login
     wajib tiap program mulai dibuka).
   - Administrator: HANYA SATU, kredensial tetap (ADMIN_USERNAME/
     ADMIN_PASSWORD_HASH di js/state.js), tidak tersimpan di state.userList,
     dan tidak bisa didaftarkan ulang oleh siapa pun. Administrator bisa
     mengakses SEMUA tab.
   - Password (Administrator maupun User 1/2) TIDAK PERNAH disimpan/
     dibandingkan dalam bentuk polos -- selalu di-hash dulu (PBKDF2-SHA256
     + salt acak per akun, lihat hashPassword() di js/helpers.js) sebelum
     disimpan ke state/Supabase atau dibandingkan saat login.
   - User 1: Tab 1 (Master Data), Tab 2 (Input Kegiatan & Epidemiologi),
     Tab 3 (Laporan Epidemiologi) + peta. Tab 4/5/6 terkunci.
   - User 2: HANYA Tab 3 (Laporan Epidemiologi) + peta. Tab 1/2/4/5/6 terkunci.
   - Registrasi mandiri (dari layar login) selalu membuat akun dengan level
     "User 2" (paling terbatas) secara default -- Administrator yang lalu
     menaikkan levelnya ke "User 1" lewat Tab 6 kalau memang perlu.
=================================================================== */

// Username hanya huruf/angka/titik/underscore, tanpa spasi (supaya jelas
// dipisahkan dari field lain yang boleh berspasi seperti Nama Lengkap).
const REGEX_USERNAME = /^[A-Za-z0-9_.]*$/;
function sanitizeUsername(str){
  return str.replace(/[^A-Za-z0-9_.]/g, '');
}

function canAccessTab(tab){
  if(!currentUser) return false;
  if(currentUser.role==='admin') return true;
  if(currentUser.level==='user1') return ['master','kegiatan','laporan'].includes(tab);
  if(currentUser.level==='user2') return tab==='laporan';
  return false;
}

// Aktifkan/kunci tombol tab sesuai hak akses user yang sedang login --
// tab yang tidak boleh diakses jadi <button disabled> (tidak bisa diklik/
// fokus keyboard sama sekali), bukan cuma disamarkan lewat CSS saja.
function applyTabAccess(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    const ok = canAccessTab(btn.dataset.tab);
    btn.disabled = !ok;
    btn.classList.toggle('tab-locked', !ok);
  });
  const userBox = document.getElementById('topbarUser');
  if(userBox && currentUser){
    const label = currentUser.role==='admin'
      ? 'Administrator'
      : `${currentUser.nama} (${currentUser.level==='user1' ? 'User 1' : 'User 2'})`;
    userBox.innerHTML = `<span class="topbar-user-name">👤 ${escapeHtml(label)}</span>
      <button type="button" class="btn btn-ghost btn-sm" id="btnLogout">Keluar</button>`;
    document.getElementById('btnLogout').addEventListener('click', logout);
  }
}

function completeLogin(){
  document.getElementById('authOverlay').classList.add('hidden');
  applyTabAccess();
  const target = currentUser.role==='admin' ? 'master'
    : (currentUser.level==='user1' ? 'master' : 'laporan');
  switchTab(target);
}

function logout(){
  currentUser = null;
  formLogin.reset();
  showLoginForm();
  document.getElementById('authOverlay').classList.remove('hidden');
}

/* ---------- Form Login ---------- */
const formLogin = document.getElementById('formLogin');
formLogin.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value;
  if(!u || !p){ showToast('authToast','Username dan Password wajib diisi.','err'); return; }

  const btnLogin = formLogin.querySelector('button[type="submit"]');
  if(btnLogin) btnLogin.disabled = true;
  try{
    if(u.toLowerCase()===ADMIN_USERNAME.toLowerCase()){
      const hashInput = await hashPassword(p, ADMIN_SALT);
      if(hashInput===ADMIN_PASSWORD_HASH){
        currentUser = {role:'admin', nama:'Administrator', username:ADMIN_USERNAME};
        formLogin.reset();
        completeLogin();
      }else{
        showToast('authToast','Password Administrator salah.','err');
      }
      return;
    }

    const found = state.userList.find(x=>x.username.toLowerCase()===u.toLowerCase());
    if(!found){
      showToast('authToast','Username atau Password salah, atau akun belum terdaftar.','err');
      return;
    }

    // Migrasi otomatis akun lama (dari sebelum perbaikan keamanan ini) yang
    // masih menyimpan password polos di field `password` -- begitu ketemu &
    // cocok saat login, langsung diubah diam-diam jadi passwordHash+salt lalu
    // disimpan ulang, field `password` polosnya dihapus permanen.
    let match = false;
    if(found.passwordHash && found.salt){
      match = (await hashPassword(p, found.salt)) === found.passwordHash;
    }else if(found.password!==undefined){
      match = found.password===p;
      if(match){
        const salt = genSaltHex();
        found.passwordHash = await hashPassword(p, salt);
        found.salt = salt;
        delete found.password;
        await persistUserList();
      }
    }

    if(!match){
      showToast('authToast','Username atau Password salah, atau akun belum terdaftar.','err');
      return;
    }
    currentUser = {role:'user', id:found.id, nama:found.nama, username:found.username, level:found.level};
    formLogin.reset();
    completeLogin();
  } finally {
    if(btnLogin) btnLogin.disabled = false;
  }
});

/* ---------- Form Registrasi (mandiri, dari layar login) ---------- */
const formRegister = document.getElementById('formRegister');
attachInputSanitizer('registerNama', sanitizeHurufAngkaSpasi);
attachInputSanitizer('registerUsername', sanitizeUsername);

formRegister.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const nama = document.getElementById('registerNama').value.trim();
  const username = document.getElementById('registerUsername').value.trim();
  const pass1 = document.getElementById('registerPassword').value;
  const pass2 = document.getElementById('registerPassword2').value;

  if(!nama || !username || !pass1 || !pass2){
    showToast('authToast','Semua kolom registrasi wajib diisi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(nama)){
    showToast('authToast','Nama Lengkap hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!username || !REGEX_USERNAME.test(username)){
    showToast('authToast','Username hanya boleh huruf, angka, titik, dan underscore (tanpa spasi).','err'); return;
  }
  if(username.toLowerCase()===ADMIN_USERNAME.toLowerCase()){
    showToast('authToast','Username ini sudah dicadangkan untuk Administrator, silakan pakai username lain.','err'); return;
  }
  const dup = state.userList.find(x=>x.username.toLowerCase()===username.toLowerCase());
  if(dup){
    showToast('authToast','Username ini sudah terdaftar, silakan pakai username lain.','err'); return;
  }
  if(pass1 !== pass2){
    showToast('authToast','Password dan Ulangi Password tidak sama.','err'); return;
  }

  // ID User: auto-increment, primary key -- terisi otomatis (tersembunyi dari
  // user yang mendaftar), sesuai poin 4. Level default "User 2" (paling
  // terbatas) -- Administrator bisa menaikkan ke "User 1" lewat Tab 6 kalau perlu.
  // Password TIDAK disimpan polos -- diubah dulu jadi hash+salt (lihat
  // js/helpers.js) sebelum masuk ke state/Supabase.
  const salt = genSaltHex();
  const passwordHash = await hashPassword(pass1, salt);
  const newUser = {id: state.nextUserId++, nama, username, passwordHash, salt, level:'user2'};
  state.userList.push(newUser);
  await persistUserList();
  renderUserTable();

  formRegister.reset();
  showLoginForm();
  document.getElementById('loginUsername').value = username;
  showToast('authToast','Registrasi berhasil! Silakan login dengan Username & Password yang baru dibuat.','ok');
});

/* ---------- Toggle tampilan Login <-> Registrasi ---------- */
function showLoginForm(){
  formLogin.style.display = '';
  formRegister.style.display = 'none';
}
function showRegisterForm(){
  formRegister.reset();
  formLogin.style.display = 'none';
  formRegister.style.display = '';
}
document.getElementById('btnShowRegister').addEventListener('click', showRegisterForm);
document.getElementById('btnShowLogin').addEventListener('click', showLoginForm);

/* ===================================================================
   TAB 6 : ADMINISTRATOR — Data User
   Dikelola sepenuhnya oleh Administrator: ubah Nama Lengkap/Username/
   Password, dan yang terpenting ubah Level Akses (User 1/User 2) sesuai
   poin 2, atau hapus akun. Akun baru juga bisa ditambahkan langsung dari
   sini kalau Administrator perlu (di luar jalur Registrasi mandiri).
=================================================================== */
const formUser = document.getElementById('formUser');
attachInputSanitizer('userNama', sanitizeHurufAngkaSpasi);
attachInputSanitizer('userUsername', sanitizeUsername);

function resetFormUser(){
  formUser.reset();
  document.getElementById('userId').value = '';
  document.getElementById('userFormTitle').textContent = 'Tambah User';
  document.getElementById('userPassword').required = true;
  document.getElementById('userPassword').placeholder = '';
}

formUser.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const idField = document.getElementById('userId').value;
  const nama = document.getElementById('userNama').value.trim();
  const username = document.getElementById('userUsername').value.trim();
  const password = document.getElementById('userPassword').value;
  const level = document.getElementById('userLevel').value;

  if(!nama || !username || (!idField && !password) || !level){
    showToast('userToast','Nama Lengkap, Username, Password, dan Level Akses wajib diisi.','err'); return;
  }
  if(!REGEX_HURUF_ANGKA_SPASI.test(nama)){
    showToast('userToast','Nama Lengkap hanya boleh berisi huruf, angka, dan spasi.','err'); return;
  }
  if(!username || !REGEX_USERNAME.test(username)){
    showToast('userToast','Username hanya boleh huruf, angka, titik, dan underscore (tanpa spasi).','err'); return;
  }
  if(username.toLowerCase()===ADMIN_USERNAME.toLowerCase()){
    showToast('userToast','Username ini sudah dicadangkan untuk Administrator, silakan pakai username lain.','err'); return;
  }
  const dup = state.userList.find(x=>x.username.toLowerCase()===username.toLowerCase() && String(x.id)!==idField);
  if(dup){
    showToast('userToast','Username ini sudah terdaftar pada user lain.','err'); return;
  }

  if(idField){
    const idx = state.userList.findIndex(x=>x.id===parseInt(idField));
    if(idx>-1){
      const old = state.userList[idx];
      let passwordHash = old.passwordHash, salt = old.salt;
      if(password){
        // Admin mengganti password user ini -- buat hash+salt baru.
        salt = genSaltHex();
        passwordHash = await hashPassword(password, salt);
      }
      state.userList[idx] = {id:old.id, nama, username, level, passwordHash, salt};
      // Kalau user yang sedang login (di sesi ini) adalah user yang baru
      // diubah datanya oleh Administrator, sinkronkan juga label di topbar.
      if(currentUser && currentUser.role==='user' && currentUser.id===old.id){
        currentUser = {...currentUser, nama, username, level};
        applyTabAccess();
      }
    }
    showToast('userToast','Perubahan data user berhasil disimpan.','ok');
  }else{
    const salt = genSaltHex();
    const passwordHash = await hashPassword(password, salt);
    state.userList.push({id: state.nextUserId++, nama, username, passwordHash, salt, level});
    showToast('userToast','User baru berhasil ditambahkan.','ok');
  }

  await persistUserList();
  resetFormUser();
  renderUserTable();
});

document.getElementById('btnBatalUser').addEventListener('click', resetFormUser);

function editUser(id){
  const u = state.userList.find(x=>x.id===id);
  if(!u) return;
  document.getElementById('userId').value = u.id;
  document.getElementById('userNama').value = u.nama;
  document.getElementById('userUsername').value = u.username;
  document.getElementById('userPassword').value = '';
  document.getElementById('userPassword').required = false;
  document.getElementById('userPassword').placeholder = 'Kosongkan kalau tidak ingin mengganti password';
  document.getElementById('userLevel').value = u.level;
  document.getElementById('userFormTitle').textContent = 'Ubah User: ' + u.nama;
  window.scrollTo({top:0, behavior:'smooth'});
}

function deleteUser(id){
  const u = state.userList.find(x=>x.id===id);
  if(!u) return;
  askConfirm(
    'Hapus user ini?',
    `Akun "${u.nama}" (${u.username}) akan dihapus permanen dan tidak akan bisa login lagi.`,
    async ()=>{
      state.userList = state.userList.filter(x=>x.id!==id);
      await persistUserList();
      renderUserTable();
    }
  );
}

function renderUserTable(){
  const tbody = document.getElementById('tblUser');
  if(!tbody) return;
  if(state.userList.length===0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Belum ada user terdaftar. Tambahkan lewat form di samping, atau tunggu user mendaftar mandiri lewat layar login.</td></tr>`; return;
  }
  tbody.innerHTML = state.userList.slice().sort((a,b)=>a.nama.localeCompare(b.nama)).map(u=>`
    <tr>
      <td class="mono">${u.id}</td>
      <td><b>${escapeHtml(u.nama)}</b></td>
      <td>${escapeHtml(u.username)}</td>
      <td class="mono" title="Password tidak ditampilkan demi keamanan -- pakai tombol Edit utk mengganti">●●●●●●●●</td>
      <td><span class="badge netral">${u.level==='user1' ? 'User 1' : 'User 2'}</span></td>
      <td style="white-space:nowrap;">
        <button class="icon-btn" onclick="editUser(${u.id})">✏️ Edit</button>
        <button class="icon-btn" onclick="deleteUser(${u.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

resetFormUser();
