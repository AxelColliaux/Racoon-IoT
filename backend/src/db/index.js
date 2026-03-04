const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'smartposture';

const SENSOR_TS_COLLECTION = 'sensor_readings_ts';
const AGGREGATES_5M_COLLECTION = 'aggregates_5m';
const RETENTION_MINUTES = 10;
const AGGREGATION_BUCKET_MINUTES = 5;

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

  await ensureTimeSeriesCollection();
  await ensureAggregatesIndexes();

  return db;
}

async function ensureTimeSeriesCollection() {
  const collections = await getDb().listCollections({ name: SENSOR_TS_COLLECTION }).toArray();
  if (collections.length > 0) return;
  await getDb().createCollection(SENSOR_TS_COLLECTION, {
    timeseries: {
      timeField: 'ts',
      metaField: 'meta',
      granularity: 'seconds',
    },
    expireAfterSeconds: RETENTION_MINUTES * 60,
  });
}

async function ensureAggregatesIndexes() {
  const col = getDb().collection(AGGREGATES_5M_COLLECTION);
  await col.createIndex({ bucket: -1 }).catch(() => {});
  await col.createIndex({ 'meta.device_id': 1, bucket: -1 }).catch(() => {});
  await col.createIndex({ bucket: -1, 'meta.device_id': 1 }).catch(() => {});
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

/* ── Time-Series (sensors/alerts/config) ─────────────────────────── */

function sensorTsCol() {
  return getDb().collection(SENSOR_TS_COLLECTION);
}

function aggregates5mCol() {
  return getDb().collection(AGGREGATES_5M_COLLECTION);
}

function toDate(ts) {
  if (ts instanceof Date) return ts;
  if (typeof ts === 'number') return new Date(ts);
  return new Date();
}

async function insertSensorReading(meta, type, fields) {
  const { ts: _ts, ...rest } = fields;
  const doc = {
    ts: toDate(_ts ?? Date.now()),
    meta: {
      device_id: meta.deviceId ?? meta.device_id ?? null,
      type,
    },
    ...rest,
  };
  await sensorTsCol().insertOne(doc);
}

async function runAggregationAndRetention() {
  const now = new Date();
  const bucketMs = AGGREGATION_BUCKET_MINUTES * 60 * 1000;
  const bucketStart = new Date(Math.floor(now.getTime() / bucketMs) * bucketMs - bucketMs);
  const bucketEnd = new Date(bucketStart.getTime() + bucketMs);
  const col = sensorTsCol();
  const aggCol = aggregates5mCol();

  const pipeline = [
    { $match: { ts: { $gte: bucketStart, $lt: bucketEnd } } },
    {
      $group: {
        _id: { device_id: '$meta.device_id', type: '$meta.type' },
        bucket: { $first: bucketStart },
        count: { $sum: 1 },
        avg_temperature: { $avg: '$temperature' },
        min_temperature: { $min: '$temperature' },
        max_temperature: { $max: '$temperature' },
      },
    },
    {
      $project: {
        bucket: 1,
        meta: { device_id: '$_id.device_id', type: '$_id.type' },
        count: 1,
        avg_temperature: 1,
        min_temperature: 1,
        max_temperature: 1,
      },
    },
  ];
  const cursor = col.aggregate(pipeline);
  const results = await cursor.toArray();
  if (results.length > 0) {
    const docs = results.map((r) => ({
      ts: r.bucket,
      bucket: r.bucket,
      meta: r.meta,
      count: r.count,
      avg_temperature: r.avg_temperature,
      min_temperature: r.min_temperature,
      max_temperature: r.max_temperature,
    }));
    await aggCol.insertMany(docs);
  }
}

async function getRecentAggregates(limit = 100, deviceId = null) {
  const col = aggregates5mCol();
  const filter = deviceId ? { 'meta.device_id': deviceId } : {};
  const cursor = col.find(filter).sort({ bucket: -1 }).limit(limit);
  return cursor.toArray();
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
  insertSensorReading,
  runAggregationAndRetention,
  getRecentAggregates,
  SENSOR_TS_COLLECTION,
  AGGREGATES_5M_COLLECTION,
  RETENTION_MINUTES,
  AGGREGATION_BUCKET_MINUTES,
};
