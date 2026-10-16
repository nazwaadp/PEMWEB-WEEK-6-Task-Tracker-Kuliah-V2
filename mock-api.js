const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());

function readTasks() {
  const data = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(data).tasks;
}

function saveTasks(tasks) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ tasks }, null, 2));
}

app.get("/api/tasks", (req, res) => {
  res.json(readTasks());
});

app.get("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((task) => task.id === Number(req.params.id));

  if (!task) {
    return res.status(404).json({
      message: "Tugas tidak ditemukan",
    });
  }

  res.json(task);
});

app.post("/api/tasks", (req, res) => {
  const { title, description = "" } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      message: "Judul tugas wajib diisi",
    });
  }

  const tasks = readTasks();

  const newId =
    tasks.length > 0 ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;

  const newTask = {
    id: newId,
    title: title.trim(),
    description,
    completed: false,
  };

  tasks.push(newTask);
  saveTasks(tasks);

  res.status(201).json(newTask);
});

app.listen(PORT, () => {
  console.log(`Mock API berjalan di http://localhost:${PORT}`);
});
