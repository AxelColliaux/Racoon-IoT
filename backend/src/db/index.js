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
    activity: row.activity ?? null,
    embedded_posture: row.embeddedPosture ?? null,
    angle_diff: row.angleDiff ?? null,
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

/* ── Vests (gilets) ─────────────────────────────────────────────── */

function vestsCol() {
  return getDb().collection('vests');
}

async function nextVestId() {
  const counters = getDb().collection('counters');
  const result = await counters.findOneAndUpdate(
    { _id: 'vest_seq' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const num = result.seq ?? 1;
  return `V-${String(num).padStart(3, '0')}`;
}

async function registerVest(vest) {
  const col = vestsCol();
  const vestId =
    vest.vestId && String(vest.vestId).trim() !== ''
      ? String(vest.vestId).trim()
      : await nextVestId();
  const doc = {
    vest_id: vestId,
    label: vest.label || vestId,
    operator: vest.operator || null,
    zone: vest.zone || null,
    status: 'inactive',
    created_at: new Date(),
  };
  await col.insertOne(doc);
  return doc;
}

async function getAllVests() {
  const col = vestsCol();
  const docs = await col.find({}).sort({ created_at: -1 }).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }));
}

async function updateVest(vestId, fields) {
  const col = vestsCol();
  const $set = {};
  if (fields.label != null) $set.label = fields.label;
  if (fields.operator != null) $set.operator = fields.operator;
  if (fields.zone != null) $set.zone = fields.zone;
  if (fields.status != null) $set.status = fields.status;
  if (Object.keys($set).length === 0) return null;
  const result = await col.findOneAndUpdate(
    { vest_id: vestId },
    { $set },
    { returnDocument: 'after' },
  );
  return result;
}

async function deleteVest(vestId) {
  const col = vestsCol();
  const result = await col.deleteOne({ vest_id: vestId });
  return result.deletedCount > 0;
}

module.exports = {
  connect,
  getDb,
  insertTelemetry,
  insertPostureEvent,
  getRecentTelemetry,
  getRecentPostureEvents,
  registerVest,
  getAllVests,
  updateVest,
  deleteVest,
};
