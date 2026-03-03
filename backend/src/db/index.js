const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'smartposture';

let client = null;
let db = null;

async function connect() {
  if (db) return db;
  if (!MONGODB_URI) {
    const err = new Error('MONGODB_URI is required');
    console.error(err.message);
    throw err;
  }
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  const telemetryCol = db.collection('telemetry');
  const postureCol = db.collection('posture_events');
  await telemetryCol.createIndex({ ts: -1 }).catch(() => {});
  await telemetryCol.createIndex({ device_id: 1 }).catch(() => {});
  await postureCol.createIndex({ ts: -1 }).catch(() => {});
  await postureCol.createIndex({ device_id: 1 }).catch(() => {});

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not connected: call connect() first');
  return db;
}

async function insertTelemetry(row) {
  const col = getDb().collection('telemetry');
  const doc = {
    device_id: row.deviceId ?? null,
    operator_id: row.operatorId ?? null,
    zone: row.zone ?? null,
    accel_x: row.accel?.x ?? 0,
    accel_y: row.accel?.y ?? 0,
    accel_z: row.accel?.z ?? 1,
    gyro_x: row.gyro?.x ?? 0,
    gyro_y: row.gyro?.y ?? 0,
    gyro_z: row.gyro?.z ?? 0,
    ts: row.ts ?? Date.now(),
    created_at: new Date(),
  };
  await col.insertOne(doc);
}

async function insertPostureEvent(row) {
  const col = getDb().collection('posture_events');
  const doc = {
    device_id: row.deviceId ?? null,
    operator_id: row.operatorId ?? null,
    zone: row.zone ?? null,
    posture_type: row.postureType,
    severity: row.severity,
    tilt_forward_deg: row.tiltForwardDeg ?? null,
    tilt_lateral_deg: row.tiltLateralDeg ?? null,
    ts: row.ts ?? Date.now(),
    created_at: new Date(),
  };
  await col.insertOne(doc);
}

async function getRecentTelemetry(limit = 100) {
  const col = getDb().collection('telemetry');
  const cursor = col.find({}).sort({ ts: -1 }).limit(limit);
  const docs = await cursor.toArray();
  return docs.map(({ _id, ...rest }) => rest);
}

async function getRecentPostureEvents(limit = 50) {
  const col = getDb().collection('posture_events');
  const cursor = col.find({}).sort({ ts: -1 }).limit(limit);
  const docs = await cursor.toArray();
  return docs.map((doc) => {
    const { _id, ...rest } = doc;
    return { ...rest, id: _id.toString() };
  });
}

module.exports = {
  connect,
  getDb,
  insertTelemetry,
  insertPostureEvent,
  getRecentTelemetry,
  getRecentPostureEvents,
};
