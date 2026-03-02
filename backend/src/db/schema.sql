-- SmartPosture / CorpSafe v1 - Schéma SQLite

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  operator_id TEXT,
  zone TEXT,
  accel_x REAL, accel_y REAL, accel_z REAL,
  gyro_x REAL, gyro_y REAL, gyro_z REAL,
  ts INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS posture_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT,
  operator_id TEXT,
  zone TEXT,
  posture_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  tilt_forward_deg REAL,
  tilt_lateral_deg REAL,
  ts INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_telemetry_ts ON telemetry(ts);
CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_posture_events_ts ON posture_events(ts);
CREATE INDEX IF NOT EXISTS idx_posture_events_device ON posture_events(device_id);
