import initSqlJs from 'sql.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config/index.js';

let dbInstance: initSqlJs.Database | null = null;

export async function initializeDatabase(): Promise<initSqlJs.Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();
  const dbPath = config.databasePath;
  const dbDir = dirname(dbPath);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
    createTables(dbInstance);
    saveDatabase(dbInstance, dbPath);
  }

  return dbInstance;
}

function createTables(db: initSqlJs.Database): void {
  // Satellites table
  db.run(`
    CREATE TABLE IF NOT EXISTS satellites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      norad_cat_id INTEGER NOT NULL UNIQUE,
      object_id TEXT,
      regime TEXT NOT NULL,
      altitude REAL,
      velocity REAL,
      inclination REAL,
      eccentricity REAL,
      status TEXT,
      operator TEXT,
      object_type TEXT,
      owner_code TEXT,
      launch_date TEXT,
      epoch_utc TEXT NOT NULL,
      retrieved_at_utc TEXT NOT NULL,
      record_age_hours REAL,
      freshness_category TEXT,
      semi_major_axis_km REAL,
      approx_altitude_km REAL,
      approx_velocity_km_s REAL,
      orbital_period_min REAL,
      covariance_available INTEGER DEFAULT 0,
      quality_score INTEGER,
      raw_omm TEXT,
      satcat_metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Simulations table
  db.run(`
    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      satellite_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'idle',
      current_timestamp_utc TEXT,
      simulation_start_utc TEXT,
      simulation_end_utc TEXT,
      time_step_seconds REAL,
      propagation_method TEXT,
      random_seed INTEGER,
      speed_multiplier REAL DEFAULT 1,
      parameters TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (satellite_id) REFERENCES satellites(id)
    )
  `);

  // Simulation states/trajectory points
  db.run(`
    CREATE TABLE IF NOT EXISTS simulation_states (
      id TEXT PRIMARY KEY,
      simulation_id TEXT NOT NULL,
      timestamp_utc TEXT NOT NULL,
      position_x REAL,
      position_y REAL,
      position_z REAL,
      velocity_x REAL,
      velocity_y REAL,
      velocity_z REAL,
      altitude_km REAL,
      speed_km_s REAL,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (simulation_id) REFERENCES simulations(id)
    )
  `);

  // Audit logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp_utc TEXT NOT NULL,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      category TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Data sources table
  db.run(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      url TEXT,
      retrieved_at_utc TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      content_type TEXT,
      http_status INTEGER,
      sha256 TEXT,
      is_cached INTEGER DEFAULT 0,
      caching_policy TEXT,
      next_recommended_refresh_utc TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Data quality checks table
  db.run(`
    CREATE TABLE IF NOT EXISTS quality_checks (
      id TEXT PRIMARY KEY,
      satellite_id TEXT NOT NULL,
      check_id TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      measured_value TEXT,
      threshold TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (satellite_id) REFERENCES satellites(id)
    )
  `);

  // Evidence gaps table
  db.run(`
    CREATE TABLE IF NOT EXISTS evidence_gaps (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      affected_objects TEXT,
      description TEXT NOT NULL,
      why_it_matters TEXT,
      recommended_action TEXT,
      impact_on_verdict TEXT,
      detection_timestamp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function saveDatabase(db: initSqlJs.Database, dbPath: string): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

export function getDatabaseInstance(): initSqlJs.Database | null {
  return dbInstance;
}
