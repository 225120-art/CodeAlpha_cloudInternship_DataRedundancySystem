import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("dedupe.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    hash TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/records", (req, res) => {
    const records = db.prepare("SELECT * FROM records ORDER BY created_at DESC").all();
    res.json(records);
  });

  app.post("/api/ingest", (req, res) => {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    const items = Array.isArray(data) ? data : [data];
    const results = {
      unique: 0,
      redundant: 0,
      errors: 0,
      details: [] as any[]
    };

    const insert = db.prepare("INSERT INTO records (content, hash) VALUES (?, ?)");

    for (const item of items) {
      try {
        // Normalize content for hashing (sort keys to ensure same hash for same data)
        const normalized = JSON.stringify(item, Object.keys(item).sort());
        const hash = crypto.createHash("sha256").update(normalized).digest("hex");

        const existing = db.prepare("SELECT id FROM records WHERE hash = ?").get(hash);

        if (existing) {
          results.redundant++;
          results.details.push({ status: "redundant", hash });
        } else {
          insert.run(normalized, hash);
          results.unique++;
          results.details.push({ status: "unique", hash });
        }
      } catch (err) {
        results.errors++;
        console.error("Error processing item:", err);
      }
    }

    res.json(results);
  });

  app.delete("/api/records", (req, res) => {
    db.prepare("DELETE FROM records").run();
    res.json({ message: "All records cleared" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
