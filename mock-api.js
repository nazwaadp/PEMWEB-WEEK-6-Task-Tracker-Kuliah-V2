
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(cors());
app.use(express.json());

function readTasks() {
  const data = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(data).tasks;
}

function saveTasks(tasks) {
  fs.writeFileSync(
    DB_PATH,
    JSON.stringify({ tasks }, null, 2)
  );
}

// GET: mengambil semua tugas
app.get("/api/tasks", (req, res) => {
  res.json(readTasks());
});

// GET: mengambil tugas berdasarkan ID
app.get("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(
    (task) => task.id === Number(req.params.id)
  );

  if (!task) {
    return res.status(404).json({
      message: "Tugas tidak ditemukan"
    });
  }

  res.json(task);
});

// POST: menambahkan tugas baru
app.post("/api/tasks", (req, res) => {
  const {
    title,
    description = "",
    matkul = "",
    deadline = ""
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      message: "Judul tugas wajib diisi"
    });
  }

  const tasks = readTasks();

  const newId = tasks.length > 0
    ? Math.max(...tasks.map((task) => task.id)) + 1
    : 1;

  const newTask = {
    id: newId,
    title: title.trim(),
    description,
    matkul,
    deadline,
    completed: false
  };

  tasks.push(newTask);
  saveTasks(tasks);

  res.status(201).json(newTask);
});

// PATCH: mengubah status atau data tugas
app.patch("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex(
    (task) => task.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      message: "Tugas tidak ditemukan"
    });
  }

  const { id, ...updates } = req.body;

  tasks[index] = {
    ...tasks[index],
    ...updates,
    id: tasks[index].id
  };

  saveTasks(tasks);

  res.json(tasks[index]);
});

// DELETE: menghapus tugas berdasarkan ID
app.delete("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();

  const filteredTasks = tasks.filter(
    (task) => task.id !== Number(req.params.id)
  );

  if (filteredTasks.length === tasks.length) {
    return res.status(404).json({
      message: "Tugas tidak ditemukan"
    });
  }

  saveTasks(filteredTasks);

  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Mock API berjalan di http://localhost:${PORT}`);
});
