import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("etd_logbook.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'user'))
  );

  CREATE TABLE IF NOT EXISTS machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    machine_number TEXT UNIQUE,
    model TEXT,
    serial_number TEXT,
    manufacturer TEXT,
    status TEXT DEFAULT 'available',
    printer_status TEXT DEFAULT 'working'
  );

  CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    phone_code TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number TEXT,
    gate_number TEXT,
    machine_id INTEGER,
    manual_machine_number TEXT,
    guards_count INTEGER,
    installed_by TEXT,
    installation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    removal_time DATETIME,
    removed_by TEXT,
    status TEXT DEFAULT 'installed',
    FOREIGN KEY(machine_id) REFERENCES machines(id)
  );
`);

// Migration for existing tables
const columns_machines = db.prepare("PRAGMA table_info(machines)").all() as any[];
if (!columns_machines.find(c => c.name === 'model')) {
  db.exec("ALTER TABLE machines ADD COLUMN model TEXT");
  db.exec("ALTER TABLE machines ADD COLUMN serial_number TEXT");
  db.exec("ALTER TABLE machines ADD COLUMN manufacturer TEXT");
}

const columns_logs = db.prepare("PRAGMA table_info(logs)").all() as any[];
if (!columns_logs.find(c => c.name === 'manual_machine_number')) {
  db.exec("ALTER TABLE logs ADD COLUMN manual_machine_number TEXT");
}

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "admin");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("guard1", "guard123", "user");
}

// Update machines to the specific list provided by the user
const targetMachines = [
  '57006', '57008', '57021',
  '51966', '51996', '52048',
  '51975', '57023', '57014',
  '54081', '57195', '56992',
  '56987', '56985', '54825',
  '57019', '51972', '50277',
  '57013', '52631', '54039'
];

const currentMachineCount = db.prepare("SELECT count(*) as count FROM machines").get() as { count: number };
// If machines don't match the new list (either count or specific numbers), reset them
const firstMachine = db.prepare("SELECT machine_number FROM machines LIMIT 1").get() as { machine_number: string } | undefined;

if (currentMachineCount.count !== targetMachines.length || (firstMachine && !targetMachines.includes(firstMachine.machine_number))) {
  console.log("Resetting machines to the new list...");
  db.transaction(() => {
    // Preserve machine numbers for existing logs before unlinking
    db.prepare(`
      UPDATE logs 
      SET manual_machine_number = (SELECT machine_number FROM machines WHERE machines.id = logs.machine_id)
      WHERE machine_id IS NOT NULL AND manual_machine_number IS NULL
    `).run();
    
    db.prepare("UPDATE logs SET machine_id = NULL").run();
    db.prepare("DELETE FROM machines").run();
    const insert = db.prepare("INSERT INTO machines (machine_number) VALUES (?)");
    for (const num of targetMachines) {
      insert.run(num);
    }
  })();
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  app.use(express.json());
  const PORT = 3000;

  // Helper to broadcast updates
  const broadcastUpdate = (type: string, data: any) => {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Machines API
  app.get("/api/machines", (req, res) => {
    const machines = db.prepare("SELECT * FROM machines").all();
    res.json(machines);
  });

  app.post("/api/machines", (req, res) => {
    const { machine_number, model, serial_number, manufacturer, printer_status } = req.body;
    try {
      db.prepare("INSERT INTO machines (machine_number, model, serial_number, manufacturer, printer_status) VALUES (?, ?, ?, ?, ?)").run(
        machine_number, model, serial_number, manufacturer, printer_status || 'working'
      );
      broadcastUpdate('MACHINE_ADDED', { machine_number });
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Machine already exists" });
    }
  });

  // Logs API
  app.get("/api/logs/active", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, COALESCE(m.machine_number, l.manual_machine_number) as machine_number, m.printer_status
      FROM logs l 
      LEFT JOIN machines m ON l.machine_id = m.id 
      WHERE l.status = 'installed'
      ORDER BY l.installation_time DESC
    `).all();
    res.json(logs);
  });

  app.get("/api/logs/all", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, COALESCE(m.machine_number, l.manual_machine_number) as machine_number, m.printer_status
      FROM logs l 
      LEFT JOIN machines m ON l.machine_id = m.id 
      ORDER BY l.installation_time DESC
    `).all();
    res.json(logs);
  });

  app.post("/api/logs/install", (req, res) => {
    console.log("Received install request:", req.body);
    const { flight_number, gate_number, machine_id, machine_ids, manual_machine_number, guards_count, installed_by } = req.body;
    
    // Support both single machine_id and array of machine_ids
    const idsToProcess = machine_ids && Array.isArray(machine_ids) ? machine_ids : (machine_id ? [machine_id] : []);
    
    const transaction = db.transaction(() => {
      if (idsToProcess.length > 0) {
        const insertLog = db.prepare("INSERT INTO logs (flight_number, gate_number, machine_id, manual_machine_number, guards_count, installed_by) VALUES (?, ?, ?, ?, ?, ?)");
        const updateMachine = db.prepare("UPDATE machines SET status = 'deployed' WHERE id = ?");
        
        for (const id of idsToProcess) {
          console.log(`Processing machine ID: ${id}`);
          insertLog.run(flight_number, gate_number, id, null, guards_count, installed_by);
          updateMachine.run(id);
        }
      } else if (manual_machine_number) {
        console.log(`Processing manual machine: ${manual_machine_number}`);
        db.prepare("INSERT INTO logs (flight_number, gate_number, machine_id, manual_machine_number, guards_count, installed_by) VALUES (?, ?, ?, ?, ?, ?)").run(
          flight_number, gate_number, null, manual_machine_number, guards_count, installed_by
        );
      } else {
        throw new Error("No machine specified");
      }
    });
    
    try {
      transaction();
      broadcastUpdate('LOG_UPDATED', { action: 'install', flight_number, gate_number });
      res.status(201).json({ success: true });
    } catch (e: any) {
      console.error("Install error:", e);
      res.status(500).json({ error: e.message || "Failed to log installation" });
    }
  });

  app.post("/api/logs/remove", (req, res) => {
    const { log_id, removed_by } = req.body;
    
    const log = db.prepare("SELECT machine_id FROM logs WHERE id = ?").get(log_id) as any;
    if (!log) return res.status(404).json({ error: "Log not found" });

    const transaction = db.transaction(() => {
      db.prepare("UPDATE logs SET status = 'removed', removal_time = CURRENT_TIMESTAMP, removed_by = ? WHERE id = ?").run(removed_by, log_id);
      db.prepare("UPDATE machines SET status = 'available' WHERE id = ?").run(log.machine_id);
    });

    try {
      transaction();
      broadcastUpdate('LOG_UPDATED', { action: 'remove', log_id });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to log removal" });
    }
  });

  // Admin: Users API
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, password, role);
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Personnel API
  app.get("/api/personnel", (req, res) => {
    const personnel = db.prepare("SELECT * FROM personnel ORDER BY name ASC").all();
    res.json(personnel);
  });

  app.post("/api/personnel", (req, res) => {
    const { name, phone_code } = req.body;
    try {
      db.prepare("INSERT INTO personnel (name, phone_code) VALUES (?, ?)").run(name, phone_code);
      res.status(201).json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Personnel already exists" });
    }
  });

  app.patch("/api/personnel/:id", (req, res) => {
    const { id } = req.params;
    const { name, phone_code } = req.body;
    try {
      db.prepare("UPDATE personnel SET name = ?, phone_code = ? WHERE id = ?").run(name, phone_code, id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update personnel" });
    }
  });

  app.delete("/api/personnel/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare("DELETE FROM personnel WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete personnel" });
    }
  });

  app.delete("/api/machines/:id", (req, res) => {
    const { id } = req.params;
    try {
      // Check if machine is deployed
      const machine = db.prepare("SELECT status FROM machines WHERE id = ?").get(id) as any;
      if (machine && machine.status === 'deployed') {
        return res.status(400).json({ error: "Cannot delete a deployed machine" });
      }
      db.prepare("DELETE FROM machines WHERE id = ?").run(id);
      broadcastUpdate('MACHINE_REMOVED', { id });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete machine" });
    }
  });

  app.patch("/api/machines/:id", (req, res) => {
    const { id } = req.params;
    const { machine_number, model, serial_number, manufacturer, printer_status } = req.body;
    try {
      db.prepare("UPDATE machines SET machine_number = ?, model = ?, serial_number = ?, manufacturer = ?, printer_status = ? WHERE id = ?").run(
        machine_number, model, serial_number, manufacturer, printer_status, id
      );
      broadcastUpdate('MACHINE_ADDED', { id }); // Trigger refresh
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update machine" });
    }
  });

  app.patch("/api/machines/:id/printer", (req, res) => {
    const { id } = req.params;
    const { printer_status } = req.body;
    try {
      db.prepare("UPDATE machines SET printer_status = ? WHERE id = ?").run(printer_status, id);
      broadcastUpdate('MACHINE_ADDED', { id }); // Trigger refresh
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to update printer status" });
    }
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
