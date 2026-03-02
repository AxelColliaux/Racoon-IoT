const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/smartposture.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

let db = null;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    try {
      db.exec(schema);
    } catch (e) {
      // tables may already exist
    }
  }
  return db;
}

function insertTelemetry(row) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO telemetry (device_id, operator_id, zone, accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, ts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    row.deviceId ?? null,
    row.operatorId ?? null,
    row.zone ?? null,
    row.accel.x, row.accel.y, row.accel.z,
    row.gyro.x, row.gyro.y, row.gyro.z,
    row.ts ?? Date.now()
  );
}

function insertPostureEvent(row) {
  const d = getDb();
  const stmt = d.prepare(`
    INSERT INTO posture_events (device_id, operator_id, zone, posture_type, severity, tilt_forward_deg, tilt_lateral_deg, ts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    row.deviceId ?? null,
    row.operatorId ?? null,
    row.zone ?? null,
    row.postureType,
    row.severity,
    row.tiltForwardDeg ?? null,
    row.tiltLateralDeg ?? null,
    row.ts ?? Date.now()
  );
}

function getRecentTelemetry(limit = 100) {
  return getDb().prepare(
    'SELECT * FROM telemetry ORDER BY ts DESC LIMIT ?'
  ).all(limit);
}

function getRecentPostureEvents(limit = 50) {
  return getDb().prepare(
    'SELECT * FROM posture_events ORDER BY ts DESC LIMIT ?'
  ).all(limit);
}

module.exports = {
  getDb,
  insertTelemetry,
  insertPostureEvent,
  getRecentTelemetry,
  getRecentPostureEvents,
};
