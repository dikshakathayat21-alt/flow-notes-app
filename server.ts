import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const db = new Database("flow.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    google_id TEXT UNIQUE
  );
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    type TEXT CHECK(type IN ('note', 'todo')),
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple Mock Auth API (for demo purposes as requested "dumb app")
  // In a real app, we'd use proper sessions/JWT
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ success: true, user: { id: user.id, email: user.email } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/signup", (req, res) => {
    const { email, password } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, password);
      res.json({ success: true, user: { id: info.lastInsertRowid, email } });
    } catch (e) {
      res.status(400).json({ success: false, message: "User already exists" });
    }
  });

  // Items API
  app.get("/api/items/:userId", (req, res) => {
    const items = db.prepare("SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
    res.json(items);
  });

  app.post("/api/items", (req, res) => {
    const { userId, content, type } = req.body;
    const info = db.prepare("INSERT INTO items (user_id, content, type) VALUES (?, ?, ?)").run(userId, content, type);
    const newItem = db.prepare("SELECT * FROM items WHERE id = ?").get(info.lastInsertRowid);
    res.json(newItem);
  });

  app.patch("/api/items/:id", (req, res) => {
    const { completed } = req.body;
    db.prepare("UPDATE items SET completed = ? WHERE id = ?").run(completed ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/items/:id", (req, res) => {
    db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
