// ==========================================
// 1. INISIALISASI SUPABASE (DENGAN PENGAMAN)
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

var supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.error("Gawat! SDK Supabase belum ter-load. Cek urutan tag <script> di HTML kamu!");
}

// ==========================================
// 2. LOGIKA UI (SIDEBAR MOBILE & DROPDOWN)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    // A. Buka Sidebar dari tombol Hamburger
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation(); 
            sidebar.classList.toggle('active');
            sidebar.classList.toggle('open'); 
            if(overlay) overlay.classList.add('active'); 
        });
    }

    // B. Tutup Sidebar kalau user klik area gelap (overlay)
    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // C. Dropdown Menu (Sidebar Bertingkat)
    const dropdownToggles = document.querySelectorAll('.has-dropdown > .dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); 

            const parent = this.parentElement;
            
            // Tutup menu sejajar yang sedang terbuka agar rapi
            const siblings = parent.parentElement.querySelectorAll('.has-dropdown');
            siblings.forEach(sib => {
                if (sib !== parent) sib.classList.remove('active');
            });

            // Buka/Tutup menu yang diklik
            parent.classList.toggle('active');
            
            // Putar icon panah
            const icon = this.querySelector('.chevron');
            if (icon) {
                icon.style.transform = parent.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });
    });

    // ==========================================
    // 3. ROUTER HALAMAN
    // ==========================================
    if (supabase) {
        const currentUrl = window.location.href.toLowerCase();
        if (currentUrl.includes('buku')) {
            ambilDataBuku();
        } else if (currentUrl.includes('mading')) {
            ambilDataMading();
        }
    }
});

// ==========================================
// 4. FUNGSI AMBIL DATA BUKU (LEVEL MAX)
// ==========================================
async function ambilDataBuku() {
    const urlParams = new URLSearchParams(window.location.search);
    const kategori = urlParams.get('kategori'); 
    const sub = urlParams.get('sub');           
    const kelas = urlParams.get('kelas');       

    const titleEl = document.getElementById('buku-title') || document.getElementById('buku-section-title');
    const subEl = document.getElementById('buku-subtitle') || document.getElementById('buku-section-sub');
    const grid = document.getElementById('buku-grid');
    const selector = document.getElementById('kategoriSelector');

    if (!grid || !selector) return; 

    // SKENARIO 1: Belum pilih apa-apa
    if (!kategori && !sub) {
        selector.style.display = 'flex'; 
        grid.style.display = 'none';     
        return; 
    }

    // SKENARIO 2: Sudah milih kategori
    selector.style.display = 'none'; 
    grid.style.display = 'grid'; 

    if (titleEl && subEl) {
        if (sub === 'pelajaran') {
            titleEl.innerText = 'Buku Pelajaran';
            subEl.innerText = kelas ? `Kelas ${kelas}` : 'Pilih kelas dari menu samping';
        } else if (sub === 'umum') {
            titleEl.innerText = 'Pengetahuan Umum';
            subEl.innerText = 'Buku penambah wawasan';
        } else if (sub === 'cerpen' || sub === 'dongeng' || sub === 'komik') {
            titleEl.innerText = sub.charAt(0).toUpperCase() + sub.slice(1);
            subEl.innerText = 'Koleksi Fiksi Seru';
        }
    }

    let query = supabase.from('buku').select('*');
    if (kategori) query = query.eq('kategori_utama', kategori);
    if (sub) query = query.eq('sub_kategori', sub);
    if (kelas) query = query.eq('kelas', kelas);

    const { data, error } = await query;

    // SKENARIO 3: BUKU KOSONG
    if (error || !data || data.length === 0) {
        grid.style.display = 'flex'; 
        grid.innerHTML = `
            <div style="text-align:center; padding:60px 20px; width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:white; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.05); margin-top:20px;">
                <img src="https://cdn-icons-png.flaticon.com/512/7486/7486747.png" alt="Kosong" style="width: 150px; opacity: 0.6; margin-bottom: 25px;">
                <h3 style="color:#1e293b; font-size:26px; margin-bottom:10px; font-weight:800;">Rak Buku Masih Kosong</h3>
                <p style="color:#64748b; font-size:16px; margin-bottom:30px;">Bapak/Ibu Guru belum mengunggah buku untuk kategori ini. Tunggu ya!</p>
                <a href="buku.html" style="padding:15px 35px; background:linear-gradient(135deg, #1d4ed8, #2563eb); color:white; border-radius:50px; text-decoration:none; font-weight:800; transition:all 0.3s; box-shadow:0 10px 20px rgba(29,78,216,0.3);">
                    <i class="fa-solid fa-arrow-left" style="margin-right:8px;"></i> Kembali Pilih Kategori
                </a>
            </div>
        `;
        return;
    }

    // SKENARIO 4: BUKU ADA
    grid.style.display = 'grid'; 
    grid.innerHTML = data.map(buku => `
        <div class="card-buku" style="background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.3s ease;">
            <div class="card-buku-info" style="text-align:center;">
                <div style="background:#f8fafc; width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 15px auto; border: 2px solid #e2e8f0;">
                    <i class="fa-solid fa-book-open" style="font-size: 32px; color: #3b82f6;"></i>
                </div>
                <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px; line-height: 1.4; font-weight: 800;">${buku.judul}</h3>
                <span style="background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 50px; font-size: 12px; font-weight: 800; display:inline-block;">
                    ${buku.sub_kategori.toUpperCase()} ${buku.kelas ? `(KLS ${buku.kelas})` : ''}
                </span>
            </div>
            <button onclick="bukaBuku('${buku.link_drive}', '${buku.judul}')" style="display: block; width: 100%; border:none; cursor:pointer; text-align: center; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px; border-radius: 10px; margin-top: 25px; font-weight: 800; font-size:15px; transition: all 0.3s; box-shadow:0 4px 15px rgba(16, 185, 129, 0.3);">
                <i class="fa-solid fa-book-open-reader" style="margin-right: 8px;"></i> BACA SEKARANG
            </button>
        </div>
    `).join('');
}

window.bukaBuku = function(linkDriveAsli, judulBuku) {
    let linkEmbed = linkDriveAsli;
    if (linkDriveAsli.includes('/view')) {
        linkEmbed = linkDriveAsli.replace('/view', '/preview');
    } else if (linkDriveAsli.includes('/edit')) {
        linkEmbed = linkDriveAsli.replace('/edit', '/preview');
    } else if (linkDriveAsli.includes('/d/')) {
        const match = linkDriveAsli.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            linkEmbed = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }
    document.getElementById('bacaJudul').innerText = judulBuku;
    document.getElementById('bacaIframe').src = linkEmbed;
    document.getElementById('bacaModal').style.display = 'flex';
}

window.tutupBuku = function() {
    const modal = document.getElementById('bacaModal');
    if(modal) modal.style.display = 'none';
    const iframe = document.getElementById('bacaIframe');
    if(iframe) iframe.src = ''; 
}

// ==========================================
// 5. FUNGSI AMBIL DATA MADING (LEVEL MAX)
// ==========================================
window.dataMadingGlobal = []; 

async function ambilDataMading() {
    const grid = document.getElementById('mading-grid');
    if (!grid) return; 

    const { data, error } = await supabase
        .from('mading')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error Supabase:', error);
        grid.innerHTML = `<div style="text-align:center; padding:50px; color:red; width:100%;">Gagal memuat mading.</div>`;
        return;
    }

    if (!data || data.length === 0) {
        grid.style.display = 'flex';
        grid.innerHTML = `
            <div style="text-align:center; padding:60px 20px; width:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:white; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.05); margin-top:20px;">
                <i class="fa-solid fa-newspaper" style="font-size: 5rem; margin-bottom: 20px; color: #cbd5e1;"></i>
                <h3 style="color:#1e293b; font-size:26px; margin-bottom:10px; font-weight:800;">Mading Masih Kosong</h3>
                <p style="color:#64748b; font-size:16px;">Belum ada karya atau informasi terbaru. Tunggu update dari Bapak/Ibu Guru ya!</p>
            </div>
        `;
        return;
    }

    window.dataMadingGlobal = data;
    grid.style.display = 'grid';

    grid.innerHTML = data.map((item, index) => {
        const tanggal = new Date(item.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        // Potong teks agar seragam di kartu depan
        const isiPendek = item.isi.length > 120 ? item.isi.substring(0, 120) + '...' : item.isi;

        return `
            <div class="card-mading" onclick="bukaMading(${index})" style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.05); margin-bottom: 20px; display: flex; flex-direction: column; height: 100%; cursor: pointer;">
                <div style="overflow: hidden;">
                    ${item.link_gambar ? `<img src="${item.link_gambar}" alt="${item.judul}" style="width: 100%; height: 220px; object-fit: cover; display: block;">` : `<div style="height:15px; background:linear-gradient(90deg, #1d4ed8, #3b82f6); width:100%;"></div>`}
                </div>
                <div style="padding: 25px; display: flex; flex-direction: column; flex-grow: 1;">
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 8px; font-weight: bold;"><i class="fa-regular fa-calendar"></i> ${tanggal}</p>
                    <h3 style="margin-top: 0; color: #1e293b; font-size: 20px; font-weight: 800; line-height: 1.3;">${item.judul}</h3>
                    <p style="color: #475569; line-height: 1.6; font-size: 15px; flex-grow: 1; margin-top: 10px;">${isiPendek}</p>
                    <div style="margin-top: 20px; color: #1d4ed8; font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                        Baca Selengkapnya <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// FUNGSI KHUSUS: MODAL BACA MADING PULL-UP
// ==========================================
window.bukaMading = function(index) {
    const item = window.dataMadingGlobal[index];
    if (!item) return;

    const tanggal = new Date(item.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    document.getElementById('madingModalTitle').innerText = item.judul;
    document.getElementById('madingModalDate').innerHTML = `<i class="fa-regular fa-calendar"></i> Diposting pada: ${tanggal}`;
    document.getElementById('madingModalText').innerText = item.isi;

    const imgEl = document.getElementById('madingModalImg');
    if (item.link_gambar) {
        imgEl.src = item.link_gambar;
        imgEl.style.display = 'block';
    } else {
        imgEl.src = '';
        imgEl.style.display = 'none';
    }

    document.getElementById('madingModal').style.display = 'flex';
}

window.tutupMading = function() {
    const modal = document.getElementById('madingModal');
    if(modal) modal.style.display = 'none';
}