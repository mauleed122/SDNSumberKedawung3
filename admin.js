// ==========================================
// 1. INISIALISASI SUPABASE (LEVEL MAX)
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

let supabase;
// Pengaman: Pastikan Supabase dari HTML sudah ke-load sebelum dipanggil
if (window.supabase) {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.error("Gawat! SDK Supabase belum ter-load. Cek tag script di admin.html!");
    alert("Gagal terhubung ke server. Pastikan koneksi internet Anda lancar.");
}

// ==========================================
// 2. FITUR TOGGLE PASSWORD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const togglePw = document.getElementById('togglePw');
    const loginPassword = document.getElementById('loginPassword');

    if (togglePw && loginPassword) {
        togglePw.addEventListener('click', () => {
            const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassword.setAttribute('type', type);
            togglePw.innerHTML = type === 'text' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
        });
    }
});

// ==========================================
// 3. CEK SESSION & LOGIKA UI DASHBOARD
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!supabase) return; // Stop kalau database gagal connect

    const { data: { session } } = await supabase.auth.getSession();
    
    const loginWrapper = document.getElementById('loginWrapper');
    const adminDashboard = document.getElementById('adminDashboard');
    const adminEmailLabel = document.getElementById('adminEmailLabel');

    // CEK LOGIN
    if (session) {
        if(loginWrapper) loginWrapper.style.display = 'none';
        if(adminDashboard) adminDashboard.style.display = 'flex';
        if(adminEmailLabel) adminEmailLabel.innerText = session.user.email;
        
        loadTabelBuku();
        loadTabelMading();
    } else {
        if(loginWrapper) loginWrapper.style.display = 'flex';
        if(adminDashboard) adminDashboard.style.display = 'none';
    }

    // LOGIKA SIDEBAR MOBILE
    const adminHamburger = document.getElementById('adminHamburger');
    const adminSidebar = document.getElementById('adminSidebar');
    const adminOverlay = document.getElementById('adminOverlay');

    if (adminHamburger && adminSidebar) {
        adminHamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            adminSidebar.classList.toggle('active');
            adminSidebar.classList.toggle('open');
            if(adminOverlay) adminOverlay.classList.toggle('active');
        });
    }

    if (adminOverlay && adminSidebar) {
        adminOverlay.addEventListener('click', () => {
            adminSidebar.classList.remove('active');
            adminSidebar.classList.remove('open');
            adminOverlay.classList.remove('active');
        });
    }

    // NAVIGASI PANEL ADMIN
    const navBtns = document.querySelectorAll('.admin-nav-btn');
    const panels = document.querySelectorAll('.admin-panel');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Tutup sidebar di versi mobile setelah menu diklik
            if (window.innerWidth <= 768 && adminSidebar) {
                adminSidebar.classList.remove('active');
                adminSidebar.classList.remove('open');
                if(adminOverlay) adminOverlay.classList.remove('active');
            }

            navBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            
            const targetPanel = document.getElementById('panel-' + btn.getAttribute('data-panel'));
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // LOGIKA DROPDOWN KELAS
    const bukuKategori = document.getElementById('bukuKategori');
    const bukuSub = document.getElementById('bukuSub');
    const kelasGroup = document.getElementById('kelasGroup');

    if (bukuKategori && bukuSub) {
        bukuKategori.addEventListener('change', (e) => {
            const val = e.target.value;
            bukuSub.innerHTML = '<option value="">-- Pilih Sub Kategori --</option>';
            if(kelasGroup) kelasGroup.style.display = 'none';

            if (val === 'non_fiksi') {
                bukuSub.innerHTML += '<option value="pelajaran">Buku Pelajaran</option><option value="umum">Pengetahuan Umum</option>';
            } else if (val === 'fiksi') {
                bukuSub.innerHTML += '<option value="cerpen">Cerpen</option><option value="dongeng">Dongeng</option><option value="komik">Komik</option>';
            }
        });

        bukuSub.addEventListener('change', (e) => {
            if(kelasGroup) {
                kelasGroup.style.display = (e.target.value === 'pelajaran') ? 'block' : 'none';
            }
        });
    }
});

// ==========================================
// 4. FUNGSI LOGIN & LOGOUT
// ==========================================
const btnLogin = document.getElementById('btnLogin');
if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        if (!supabase) return alert("Database belum siap!");

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginError = document.getElementById('loginError');

        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
        if(loginError) loginError.innerText = '';

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            if(loginError) loginError.innerText = 'Login Gagal: Email / Password salah!';
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Masuk';
        } else {
            window.location.reload(); 
        }
    });
}

const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });
}

// ==========================================
// 5. FUNGSI SIMPAN BUKU
// ==========================================
const btnSimpanBuku = document.getElementById('btnSimpanBuku');
if (btnSimpanBuku) {
    btnSimpanBuku.addEventListener('click', async () => {
        const judul = document.getElementById('bukuJudul').value;
        const link_drive = document.getElementById('bukuDrive').value;
        const kategori_utama = document.getElementById('bukuKategori').value;
        const sub_kategori = document.getElementById('bukuSub').value;
        const kelas = document.getElementById('bukuKelas').value;

        if (!judul || !link_drive || !kategori_utama || !sub_kategori) {
            alert('Harap lengkapi semua data wajib!');
            return;
        }

        btnSimpanBuku.disabled = true;
        btnSimpanBuku.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

        const payload = {
            judul, link_drive, kategori_utama, sub_kategori,
            kelas: sub_kategori === 'pelajaran' ? kelas : null
        };

        const { error } = await supabase.from('buku').insert([payload]);

        if (error) {
            alert('Gagal menambah buku: ' + error.message);
        } else {
            alert('Buku berhasil ditambahkan!');
            document.getElementById('bukuJudul').value = '';
            document.getElementById('bukuDrive').value = '';
            loadTabelBuku(); 
        }
        
        btnSimpanBuku.disabled = false;
        btnSimpanBuku.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Buku';
    });
}

// ==========================================
// 6. FUNGSI SIMPAN MADING
// ==========================================
const btnSimpanMading = document.getElementById('btnSimpanMading');
if (btnSimpanMading) {
    btnSimpanMading.addEventListener('click', async () => {
        const judul = document.getElementById('madingJudul').value;
        const isi = document.getElementById('madingIsi').value;
        const link_gambar = document.getElementById('madingGambar').value;

        if (!judul || !isi) {
            alert('Judul dan Isi mading wajib diisi!');
            return;
        }

        btnSimpanMading.disabled = true;
        btnSimpanMading.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

        const payload = {
            judul, isi, 
            link_gambar: link_gambar || null
        };

        const { error } = await supabase.from('mading').insert([payload]);

        if (error) {
            alert('Gagal menambah mading: ' + error.message);
        } else {
            alert('Mading berhasil diposting!');
            document.getElementById('madingJudul').value = '';
            document.getElementById('madingIsi').value = '';
            document.getElementById('madingGambar').value = '';
            loadTabelMading(); 
        }
        
        btnSimpanMading.disabled = false;
        btnSimpanMading.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Mading';
    });
}

// ==========================================
// 7. FUNGSI LOAD & HAPUS BUKU
// ==========================================
async function loadTabelBuku() {
    const tbody = document.getElementById('tableBukuBody');
    if(!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Memuat data... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;

    const { data, error } = await supabase.from('buku').select('*').order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Gagal memuat data</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada data buku.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(buku => `
        <tr>
            <td><strong>${buku.judul}</strong></td>
            <td>${buku.kategori_utama === 'non_fiksi' ? 'Non Fiksi' : 'Fiksi'}</td>
            <td>${buku.sub_kategori}</td>
            <td>${buku.kelas ? 'Kelas ' + buku.kelas : '-'}</td>
            <td>
                <button id="btn-hapus-buku-${buku.id}" onclick="hapusBuku('${buku.id}')" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

window.hapusBuku = async function(id) {
    if(confirm('Yakin ingin menghapus buku ini?')) {
        const btn = document.getElementById(`btn-hapus-buku-${id}`);
        if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const { error } = await supabase.from('buku').delete().eq('id', id);
        if(error) alert('Gagal menghapus: ' + error.message);
        loadTabelBuku();
    }
}

// ==========================================
// 8. FUNGSI LOAD & HAPUS MADING
// ==========================================
async function loadTabelMading() {
    const tbody = document.getElementById('tableMadingBody');
    if(!tbody) return;

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Memuat data... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;

    const { data, error } = await supabase.from('mading').select('*').order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="color:red; text-align:center;">Gagal memuat data</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Belum ada data mading.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(mading => `
        <tr>
            <td><strong>${mading.judul}</strong></td>
            <td>${mading.isi.substring(0, 35)}...</td>
            <td>${mading.link_gambar ? `<a href="${mading.link_gambar}" target="_blank" style="color:#3498db;">Lihat</a>` : '-'}</td>
            <td>
                <button id="btn-hapus-mading-${mading.id}" onclick="hapusMading('${mading.id}')" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

window.hapusMading = async function(id) {
    if(confirm('Yakin ingin menghapus mading ini?')) {
        const btn = document.getElementById(`btn-hapus-mading-${id}`);
        if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const { error } = await supabase.from('mading').delete().eq('id', id);
        if(error) alert('Gagal menghapus: ' + error.message);
        loadTabelMading();
    }
}
