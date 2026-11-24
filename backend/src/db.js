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
    name                   TEXT    NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
    capacity_t             REAL    NOT NULL CHECK (capacity_t BETWEEN 1 AND 20),
    span_m                 REAL    NOT NULL CHECK (span_m BETWEEN 5 AND 30),
    lift_height_m          REAL    NOT NULL CHECK (lift_height_m BETWEEN 3 AND 15),
    end_clearance_left_mm  INTEGER NOT NULL CHECK (end_clearance_left_mm BETWEEN 100 AND 1500),
    end_clearance_right_mm INTEGER NOT NULL CHECK (end_clearance_right_mm BETWEEN 100 AND 1500),
    duty_group             TEXT    NOT NULL CHECK (duty_group IN ('A3', 'A4', 'A5', 'A6')),
    schema_version         INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
    created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
