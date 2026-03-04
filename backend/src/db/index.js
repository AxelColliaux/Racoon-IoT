const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'smartposture';
const RAW_RETENTION_SECONDS = Number.parseInt(process.env.TS_RETENTION_SECONDS || '600', 10);

let client = null;
let db = null;

async function ensureCollection(name, options) {
  try {
    await db.createCollection(name, options);
  } catch (err) {
    if (err && err.codeName === 'NamespaceExists') return;
    throw err;
  }
}

async function ensureTimeSeriesCollections() {
  await ensureCollection('telemetry_ts', {
    timeseries: {
      timeField: 'ts',
      metaField: 'meta',
      granularity: 'seconds',
    },
    expireAfterSeconds: RAW_RETENTION_SECONDS,
  });

  await ensureCollection('telemetry_agg_5m');

  const raw = db.collection('telemetry_ts');
  const agg = db.collection('telemetry_agg_5m');

  await raw.createIndex({ 'meta.device_id': 1, 'meta.kind': 1, ts: -1 }).catch(() => {});
  await raw.createIndex({ ts: -1 }).catch(() => {});

  await agg.createIndex({ bucket_start: -1 }).catch(() => {});
  await agg.createIndex({ device_id: 1, kind: 1, bucket_start: -1 }, { unique: true }).catch(() => {});
}

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

  await ensureTimeSeriesCollections();

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

async function insertTimeSeriesPoint({ deviceId, kind, value, ts, source = 'mqtt' }) {
  const col = getDb().collection('telemetry_ts');
  const pointTs = ts instanceof Date ? ts : new Date(ts ?? Date.now());
  const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : null;

  await col.insertOne({
    ts: pointTs,
    meta: {
      device_id: deviceId ?? 'unknown',
      kind,
      source,
    },
    value,
    value_num: numericValue,
    created_at: new Date(),
  });
}

async function upsertFiveMinuteAggregation() {
  const raw = getDb().collection('telemetry_ts');
  const agg = getDb().collection('telemetry_agg_5m');
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const pipeline = [
    { $match: { ts: { $gte: tenMinutesAgo } } },
    {
      $addFields: {
        bucket_start: {
          $dateTrunc: {
            date: '$ts',
            unit: 'minute',
            binSize: 5,
          },
        },
      },
    },
    {
      $group: {
        _id: {
          device_id: '$meta.device_id',
          kind: '$meta.kind',
          bucket_start: '$bucket_start',
        },
        count: { $sum: 1 },
        min_value_num: { $min: '$value_num' },
        max_value_num: { $max: '$value_num' },
        avg_value_num: { $avg: '$value_num' },
        last_value: { $last: '$value' },
        last_ts: { $max: '$ts' },
      },
    },
    {
      $project: {
        _id: 0,
        device_id: '$_id.device_id',
        kind: '$_id.kind',
        bucket_start: '$_id.bucket_start',
        count: 1,
        min_value_num: 1,
        max_value_num: 1,
        avg_value_num: 1,
        last_value: 1,
        last_ts: 1,
        updated_at: '$$NOW',
      },
    },
  ];

  const docs = await raw.aggregate(pipeline).toArray();
  if (docs.length === 0) return { upserts: 0 };

  const operations = docs.map((doc) => ({
    updateOne: {
      filter: {
        device_id: doc.device_id,
        kind: doc.kind,
        bucket_start: doc.bucket_start,
      },
      update: { $set: doc },
      upsert: true,
    },
  }));

  const result = await agg.bulkWrite(operations, { ordered: false });
  return { upserts: result.upsertedCount + result.modifiedCount };
}

async function getRecentFiveMinuteAggregation(limit = 100) {
  const col = getDb().collection('telemetry_agg_5m');
  const docs = await col.find({}).sort({ bucket_start: -1 }).limit(limit).toArray();
  return docs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }));
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
  insertTimeSeriesPoint,
  upsertFiveMinuteAggregation,
  getRecentFiveMinuteAggregation,
  registerVest,
  getAllVests,
  updateVest,
  deleteVest,
};
