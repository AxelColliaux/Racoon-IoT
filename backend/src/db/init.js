require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const dbModule = require('./index');

async function run() {
  await dbModule.connect();
  const db = dbModule.getDb();
  const telemetryCol = db.collection('telemetry');
  const postureCol = db.collection('posture_events');
  const usersCol = db.collection('users');
  const aggregatesCol = db.collection('aggregates_5m');
  await telemetryCol.createIndex({ ts: -1 });
  await telemetryCol.createIndex({ device_id: 1 });
  await telemetryCol.createIndex({ device_id: 1, ts: -1 });
  await postureCol.createIndex({ ts: -1 });
  await postureCol.createIndex({ device_id: 1 });
  await postureCol.createIndex({ device_id: 1, ts: -1 });
  await usersCol.createIndex({ username: 1 }, { unique: true });
  const vestsCol = db.collection('vests');
  await vestsCol.createIndex({ vest_id: 1 }, { unique: true });
  await aggregatesCol.createIndex({ bucket: -1 });
  await aggregatesCol.createIndex({ 'meta.device_id': 1, bucket: -1 });
  await aggregatesCol.createIndex({ bucket: -1, 'meta.device_id': 1 });
  console.log('MongoDB indexes created (telemetry, posture_events, users, vests, sensor_readings_ts, aggregates_5m)');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
