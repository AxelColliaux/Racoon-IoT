require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const dbModule = require('./index');

async function run() {
  await dbModule.connect();
  const db = dbModule.getDb();
  const telemetryCol = db.collection('telemetry');
  const postureCol = db.collection('posture_events');
  const usersCol = db.collection('users');
  await telemetryCol.createIndex({ ts: -1 });
  await telemetryCol.createIndex({ device_id: 1 });
  await postureCol.createIndex({ ts: -1 });
  await postureCol.createIndex({ device_id: 1 });
  await usersCol.createIndex({ username: 1 }, { unique: true });
  const vestsCol = db.collection('vests');
  await vestsCol.createIndex({ vest_id: 1 }, { unique: true });
  console.log('MongoDB indexes created (telemetry, posture_events, users, vests, telemetry_ts, telemetry_agg_5m)');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
