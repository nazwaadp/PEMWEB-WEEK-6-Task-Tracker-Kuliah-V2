
const API_URL = "http://localhost:3000/api/tasks";

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

let tasks = [];
let filterAktif = "semua";

function dariAPI(task) {
  return {
    id: task.id,
    judul: task.title,
    matkul: task.matkul || task.description || "",
    deadline: task.deadline || "",
    selesai: Boolean(task.completed)
  };
}

async function requestAPI(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Request gagal: HTTP ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

async function muatDariAPI() {
  try {
    const data = await requestAPI(API_URL);
    tasks = data.map(dariAPI);
    render();
  } catch (err) {
    pesanError.textContent =
      "Gagal mengambil data. Pastikan server API berjalan.";
    console.error(err);
  }
}

function render() {
  const hariIni = new Date().toLocaleDateString("en-CA");

  let tampil = tasks.filter(function (t) {
    if (filterAktif === "aktif") return !t.selesai;
    if (filterAktif === "selesai") return t.selesai;
    return true;
  });

  tampil = tampil.slice().sort(function (a, b) {
    return a.deadline.localeCompare(b.deadline);
  });

  daftar.innerHTML = "";

  tampil.forEach(function (t) {
    const li = document.createElement("li");
    li.dataset.id = t.id;

    if (t.selesai) li.classList.add("selesai");

    const cek = document.createElement("input");
    cek.type = "checkbox";
    cek.checked = t.selesai;

    const info = document.createElement("div");
    info.className = "info";

    const judul = document.createElement("span");
    judul.className = "judul";
    judul.textContent = t.judul;

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = t.matkul + " · deadline " +
      (t.deadline || "belum ditentukan");

    if (!t.selesai && t.deadline && t.deadline < hariIni) {
      li.classList.add("terlambat");
      meta.textContent += " · terlambat!";
    }

    info.append(judul, meta);

    const hapus = document.createElement("button");
    hapus.className = "hapus";
    hapus.type = "button";
    hapus.textContent = "×";
    hapus.setAttribute("aria-label", "Hapus tugas");

    li.append(cek, info, hapus);
    daftar.appendChild(li);
  });

  const jumlahAktif = tasks.filter(t => !t.selesai).length;
  counter.textContent = jumlahAktif + " tugas aktif";

  pesanKosong.hidden = tampil.length > 0;
  pesanKosong.textContent = tasks.length === 0
    ? "Belum ada tugas. 🎀"
    : "Tidak ada tugas di filter ini. 🎀";

  tombolHapusSelesai.hidden = !tasks.some(t => t.selesai);

  tombolFilter.forEach(function (btn) {
    btn.classList.toggle("on", btn.dataset.filter === filterAktif);
  });
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const judul = inputJudul.value.trim();
  const matkul = inputMatkul.value;
  const deadline = inputDeadline.value;

  if (judul.length < 3) {
    pesanError.textContent = "Judul tugas minimal berisi 3 karakter.";
    return;
  }

  if (!deadline) {
    pesanError.textContent = "Deadline wajib diisi.";
    return;
  }

  pesanError.textContent = "";

  try {
    const tugasBaru = await requestAPI(API_URL, {
      method: "POST",
      body: JSON.stringify({
        title: judul,
        description: matkul,
        matkul: matkul,
        deadline: deadline
      })
    });

    tasks.push(dariAPI(tugasBaru));
    form.reset();
    render();
  } catch (err) {
    pesanError.textContent = "Gagal menambahkan tugas.";
    console.error(err);
  }
});

daftar.addEventListener("click", async function (e) {
  const li = e.target.closest("li");
  if (!li) return;

  const id = Number(li.dataset.id);
  const tugas = tasks.find(t => t.id === id);
  if (!tugas) return;

  try {
    if (e.target.closest(".hapus")) {
      await requestAPI(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      tasks = tasks.filter(t => t.id !== id);
      render();
      return;
    }

    if (e.target.matches('input[type="checkbox"]')) {
      const selesaiBaru = e.target.checked;

      await requestAPI(`${API_URL}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          completed: selesaiBaru
        })
      });

      tugas.selesai = selesaiBaru;
      render();
    }
  } catch (err) {
    pesanError.textContent = "Gagal mengubah data tugas.";
    console.error(err);
    await muatDariAPI();
  }
});

tombolFilter.forEach(function (btn) {
  btn.addEventListener("click", function () {
    filterAktif = btn.dataset.filter;
    render();
  });
});

tombolHapusSelesai.addEventListener("click", async function () {
  const tugasSelesai = tasks.filter(t => t.selesai);

  try {
    await Promise.all(
      tugasSelesai.map(t =>
        requestAPI(`${API_URL}/${t.id}`, {
          method: "DELETE"
        })
      )
    );

    tasks = tasks.filter(t => !t.selesai);
    render();
  } catch (err) {
    pesanError.textContent = "Gagal menghapus semua tugas selesai.";
    console.error(err);
    await muatDariAPI();
  }
});

muatDariAPI();
