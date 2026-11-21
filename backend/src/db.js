import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "./config.js";

fs.mkdirSync(path.dirname(env.dbPath), { recursive: true });

const db = new Database(env.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Only INPUTS are stored. Dimensions are recalculated when a design is read.
db.exec(`
  CREATE TABLE IF NOT EXISTS designs (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    name                   TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
    capacity_t             REAL    NOT NULL,
    span_m                 REAL    NOT NULL,
    lift_height_m          REAL    NOT NULL,
    end_clearance_left_mm  INTEGER NOT NULL,
    end_clearance_right_mm INTEGER NOT NULL,
    duty_group             TEXT    NOT NULL,
    schema_version         INTEGER NOT NULL DEFAULT 1,
    created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
