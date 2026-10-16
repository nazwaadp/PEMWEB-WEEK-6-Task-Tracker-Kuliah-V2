// 1. Ambil elemen dari HTML
const form = document.getElementById("form-tugas");
const inputJudul = document.getElementById("judul");
const inputMatkul = document.getElementById("matkul");
const inputDeadline = document.getElementById("deadline");
const pesanError = document.getElementById("pesan-error");
const daftar = document.getElementById("daftar");
const counter = document.getElementById("counter");
const pesanKosong = document.getElementById("kosong");
const tombolFilter = document.querySelectorAll(".filter button");
const tombolHapusSelesai = document.getElementById("hapus-selesai");

// 2. State (data utama aplikasi)
const STORAGE_KEY = "task-tracker-kuliah";
let tasks = muatDariStorage();
let filterAktif = "semua"; // 'semua' | 'aktif' | 'selesai'

// 3. localStorage
function muatDariStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

function simpanKeStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// 4. render(): SATU fungsi yang membangun seluruh tampilan
function render() {
  // Tanggal hari ini format YYYY-MM-DD (zona waktu lokal)
  const hariIni = new Date().toLocaleDateString("en-CA");
  // a. Filter sesuai tombol yang aktif
  let tampil = tasks.filter(function (t) {
    if (filterAktif === "aktif") return !t.selesai;
    if (filterAktif === "selesai") return t.selesai;
    return true;
  });

  // b. Bonus: urutkan deadline terdekat
  tampil = tampil.slice().sort(function (a, b) {
    return a.deadline.localeCompare(b.deadline);
  });

  // c. Kosongkan daftar, lalu bangun ulang
  daftar.innerHTML = ""; // hanya mengosongkan, tidak memasukkan teks user
  tampil.forEach(function (t) {
    const li = document.createElement("li");
    li.dataset.id = t.id; // simpan id di elemen untuk event delegation
    if (t.selesai) li.classList.add("selesai");

    const cek = document.createElement("input");
    cek.type = "checkbox";
    cek.checked = t.selesai;

    const info = document.createElement("div");
    info.className = "info";

    const judul = document.createElement("span");
    judul.className = "judul";
    judul.textContent = t.judul; // textContent, BUKAN innerHTML

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = t.matkul + " · deadline " + t.deadline;

    // Belum selesai + deadline sudah lewat = terlambat
    if (!t.selesai && t.deadline < hariIni) {
      li.classList.add("terlambat");
      meta.textContent += " · terlambat!";
    }

    info.append(judul, meta);

    const hapus = document.createElement("button");
    hapus.className = "hapus";
    hapus.type = "button";
    hapus.textContent = "✕";
    hapus.setAttribute("aria-label", "Hapus tugas");

    li.append(cek, info, hapus);
    daftar.appendChild(li);
  });

  // d. Counter tugas aktif (dihitung dari SEMUA tugas, bukan hasil filter)
  const jumlahAktif = tasks.filter(function (t) {
    return !t.selesai;
  }).length;
  counter.textContent = jumlahAktif + " tugas aktif";

  // e. Pesan saat daftar kosong
  pesanKosong.hidden = tampil.length > 0;
  if (tasks.length === 0) {
    pesanKosong.textContent = "Belum ada tugas. 🎀";
  } else {
    pesanKosong.textContent = "Tidak ada tugas di filter ini. 🎀";
  }

  // f. Tombol hapus-selesai hanya muncul kalau ada tugas yang selesai
  tombolHapusSelesai.hidden = !tasks.some(function (t) {
    return t.selesai;
  });

  // g. Tandai tombol filter aktif dengan class "on"
  tombolFilter.forEach(function (btn) {
    btn.classList.toggle("on", btn.dataset.filter === filterAktif);
  });
}

// 5. Form tambah tugas
form.addEventListener("submit", function (e) {
  e.preventDefault(); // cegah halaman reload

  const judul = inputJudul.value.trim();
  const matkul = inputMatkul.value;
  const deadline = inputDeadline.value;

  // Validasi: judul >= 3 karakter, deadline wajib
  if (judul.length < 3) {
    pesanError.textContent = "Judul tugas minimal berisi 3 karakter. 🎀";
    return;
  }
  if (!deadline) {
    pesanError.textContent = "Deadline wajib diisi. 🎀";
    return;
  }

  pesanError.textContent = ""; // validasi lolos, hapus pesan error

  tasks.push({
    id: Date.now(), // id unik sederhana
    judul: judul,
    matkul: matkul,
    deadline: deadline,
    selesai: false,
  });

  simpanKeStorage();
  form.reset();
  render();
});

// 6. Event delegation: 1 listener di <ul> untuk semua item
daftar.addEventListener("click", function (e) {
  const li = e.target.closest("li");
  if (!li) return;
  const id = Number(li.dataset.id);

  // Klik tombol hapus
  if (e.target.closest(".hapus")) {
    tasks = tasks.filter(function (t) {
      return t.id !== id;
    });
    simpanKeStorage();
    render();
    return;
  }

  // Klik checkbox
  if (e.target.matches('input[type="checkbox"]')) {
    const tugas = tasks.find(function (t) {
      return t.id === id;
    });
    if (tugas) tugas.selesai = e.target.checked;
    simpanKeStorage();
    render();
  }
});

// 7. Filter Semua / Aktif / Selesai
tombolFilter.forEach(function (btn) {
  btn.addEventListener("click", function () {
    filterAktif = btn.dataset.filter;
    render();
  });
});

// 8. Hapus semua tugas yang sudah selesai
tombolHapusSelesai.addEventListener("click", function () {
  tasks = tasks.filter(function (t) {
    return !t.selesai;
  });
  simpanKeStorage();
  render();
});

// 9. Tampilkan data saat halaman pertama dibuka
render();
